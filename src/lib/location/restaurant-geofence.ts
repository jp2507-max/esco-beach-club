import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { onboardingPermissionStatuses } from '@/lib/types';
import { config } from '@/src/lib/config';
import {
  addMonitoringBreadcrumb,
  captureHandledError,
} from '@/src/lib/monitoring';
import {
  ensureVenueUpsellNotificationChannel,
  scheduleVenueUpsellNotification,
} from '@/src/lib/notifications';
import {
  geofenceRegistrationStatuses,
  useRestaurantPresenceStore,
} from '@/src/stores/restaurant-presence-store';

export const RESTAURANT_GEOFENCE_TASK_NAME = 'restaurant-venue-geofence';

function mapExpoPermissionStatus(
  status: string | null | undefined
): (typeof onboardingPermissionStatuses)[keyof typeof onboardingPermissionStatuses] {
  const normalized = status?.trim().toLowerCase();

  if (normalized === 'granted') {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === 'denied') {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

function getRestaurantRegion(): Location.LocationRegion | null {
  const geofence = config.restaurantPresence.geofence;
  if (!geofence) return null;

  return {
    identifier: 'esco-restaurant',
    latitude: geofence.latitude,
    longitude: geofence.longitude,
    notifyOnEnter: true,
    notifyOnExit: true,
    radius: geofence.radiusMeters,
  };
}

function getDistanceMeters(params: {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
}): number {
  const earthRadiusMeters = 6371000;
  const dLat = ((params.toLatitude - params.fromLatitude) * Math.PI) / 180;
  const dLon = ((params.toLongitude - params.fromLongitude) * Math.PI) / 180;
  const fromLatRad = (params.fromLatitude * Math.PI) / 180;
  const toLatRad = (params.toLatitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromLatRad) *
      Math.cos(toLatRad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

async function handleRestaurantEntry(
  source: 'foreground' | 'geofence'
): Promise<void> {
  const nowIso = new Date().toISOString();
  const store = useRestaurantPresenceStore.getState();
  store.markRestaurantEntry(nowIso);

  const lastUpsellAt = store.lastUpsellNotificationAt
    ? Date.parse(store.lastUpsellNotificationAt)
    : Number.NaN;
  const isCooldownActive =
    Number.isFinite(lastUpsellAt) &&
    Date.now() - lastUpsellAt <
      config.restaurantPresence.notificationCooldownMs;

  if (isCooldownActive) {
    addMonitoringBreadcrumb({
      category: 'restaurant-presence',
      data: { source },
      message: 'Skipped venue upsell notification because cooldown is active.',
    });
    return;
  }

  try {
    await ensureVenueUpsellNotificationChannel();
    await scheduleVenueUpsellNotification();
    useRestaurantPresenceStore.getState().markUpsellNotificationSent(nowIso);
    addMonitoringBreadcrumb({
      category: 'restaurant-presence',
      data: { source },
      message: 'Scheduled venue upsell notification.',
    });
  } catch (error: unknown) {
    captureHandledError(error, {
      extras: { source },
      tags: { feature: 'restaurant-presence' },
    });
  }
}

function handleRestaurantExit(): void {
  useRestaurantPresenceStore.getState().markRestaurantExit();
  addMonitoringBreadcrumb({
    category: 'restaurant-presence',
    message: 'Detected restaurant exit.',
  });
}

if (!TaskManager.isTaskDefined(RESTAURANT_GEOFENCE_TASK_NAME)) {
  TaskManager.defineTask(
    RESTAURANT_GEOFENCE_TASK_NAME,
    async ({ data, error }): Promise<void> => {
      if (error) {
        captureHandledError(error, {
          tags: { feature: 'restaurant-presence' },
        });
        useRestaurantPresenceStore
          .getState()
          .setGeofenceRegistrationStatus(geofenceRegistrationStatuses.error);
        return;
      }

      const payload = data as
        | {
            eventType?: Location.GeofencingEventType;
          }
        | undefined;

      if (!payload?.eventType) return;

      if (payload.eventType === Location.GeofencingEventType.Enter) {
        await handleRestaurantEntry('geofence');
        return;
      }

      if (payload.eventType === Location.GeofencingEventType.Exit) {
        handleRestaurantExit();
      }
    }
  );
}

export async function syncBackgroundLocationPermissionStatus(): Promise<
  (typeof onboardingPermissionStatuses)[keyof typeof onboardingPermissionStatuses]
> {
  if (Platform.OS === 'web') {
    return onboardingPermissionStatuses.denied;
  }

  const permission = await Location.getBackgroundPermissionsAsync();
  const status = mapExpoPermissionStatus(permission.status);
  useRestaurantPresenceStore.getState().setBackgroundLocationStatus(status);
  return status;
}

export async function startRestaurantGeofencing(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const region = getRestaurantRegion();
  if (!region) return false;

  if (!(await TaskManager.isAvailableAsync())) {
    useRestaurantPresenceStore
      .getState()
      .setGeofenceRegistrationStatus(geofenceRegistrationStatuses.error);
    return false;
  }

  await Location.startGeofencingAsync(RESTAURANT_GEOFENCE_TASK_NAME, [region]);
  useRestaurantPresenceStore
    .getState()
    .setGeofenceRegistrationStatus(geofenceRegistrationStatuses.registered);

  return true;
}

export async function stopRestaurantGeofencing(): Promise<void> {
  if (Platform.OS === 'web') return;

  const isRegistered = await Location.hasStartedGeofencingAsync(
    RESTAURANT_GEOFENCE_TASK_NAME
  );

  if (isRegistered) {
    await Location.stopGeofencingAsync(RESTAURANT_GEOFENCE_TASK_NAME);
  }

  useRestaurantPresenceStore
    .getState()
    .setGeofenceRegistrationStatus(geofenceRegistrationStatuses.idle);
}

export async function checkRestaurantPresenceInForeground(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const geofence = config.restaurantPresence.geofence;
  if (!geofence) return false;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const distanceMeters = getDistanceMeters({
    fromLatitude: position.coords.latitude,
    fromLongitude: position.coords.longitude,
    toLatitude: geofence.latitude,
    toLongitude: geofence.longitude,
  });
  const isInside = distanceMeters <= geofence.radiusMeters;

  if (isInside) {
    await handleRestaurantEntry('foreground');
    return true;
  }

  handleRestaurantExit();
  return false;
}
