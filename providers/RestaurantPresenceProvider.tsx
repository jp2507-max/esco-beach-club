import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import { useProfileData } from '@/providers/DataProvider';
import { config } from '@/src/lib/config';
import {
  checkRestaurantPresenceInForeground,
  startRestaurantGeofencing,
  stopRestaurantGeofencing,
  syncBackgroundLocationPermissionStatus,
} from '@/src/lib/location/restaurant-geofence';
import {
  configureNotificationPresentation,
  ensureVenueUpsellNotificationChannel,
} from '@/src/lib/notifications';
import { captureHandledError } from '@/src/lib/monitoring';
import { useRestaurantPresenceStore } from '@/src/stores/restaurant-presence-store';

type RestaurantPresenceProviderProps = {
  children: React.ReactNode;
};

function mapExpoPermissionStatus(
  status: string | null | undefined
): OnboardingPermissionStatus {
  const normalized = status?.trim().toLowerCase();

  if (normalized === 'granted') {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === 'denied') {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

export function RestaurantPresenceProvider({
  children,
}: RestaurantPresenceProviderProps): React.JSX.Element {
  const { profile } = useProfileData();

  const syncForegroundPresence = React.useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') return;

    const foregroundLocationPermission =
      await Location.getForegroundPermissionsAsync();
    const notificationsPermission = await Notifications.getPermissionsAsync();
    const foregroundLocationStatus = mapExpoPermissionStatus(
      foregroundLocationPermission.status
    );
    const pushStatus = mapExpoPermissionStatus(notificationsPermission.status);
    const backgroundLocationStatus =
      await syncBackgroundLocationPermissionStatus();
    const hasGeofenceConfig = config.restaurantPresence.geofence !== null;

    const canCheckForegroundPresence =
      foregroundLocationStatus === onboardingPermissionStatuses.granted &&
      pushStatus === onboardingPermissionStatuses.granted &&
      hasGeofenceConfig;
    const canRegisterGeofence =
      canCheckForegroundPresence &&
      backgroundLocationStatus === onboardingPermissionStatuses.granted;

    if (!canRegisterGeofence) {
      await stopRestaurantGeofencing();
    } else {
      await startRestaurantGeofencing();
    }

    if (!canCheckForegroundPresence) return;

    await checkRestaurantPresenceInForeground();
  }, []);

  React.useEffect(() => {
    configureNotificationPresentation();

    void ensureVenueUpsellNotificationChannel().catch((error: unknown) => {
      captureHandledError(error, {
        tags: { feature: 'restaurant-presence' },
      });
    });
  }, []);

  React.useEffect(() => {
    useRestaurantPresenceStore.getState().setMemberSegment(
      profile?.member_segment ?? null
    );
  }, [profile]);

  React.useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        if (isCancelled) return;
        await syncForegroundPresence();
      } catch (error: unknown) {
        captureHandledError(error, {
          tags: { feature: 'restaurant-presence' },
        });
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [syncForegroundPresence]);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    function handleAppStateChange(status: AppStateStatus): void {
      if (status !== 'active') return;

      void syncForegroundPresence().catch((error: unknown) => {
        captureHandledError(error, {
          tags: { feature: 'restaurant-presence' },
        });
      });
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncForegroundPresence]);

  React.useEffect(() => {
    return () => {
      void stopRestaurantGeofencing().catch(() => undefined);
      useRestaurantPresenceStore.getState().reset();
    };
  }, []);

  return <>{children}</>;
}
