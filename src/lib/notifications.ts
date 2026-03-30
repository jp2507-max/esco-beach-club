import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '@/src/lib/i18n';

export const venueUpsellNotificationChannelId = 'venue-upsell';

let hasConfiguredNotificationHandler = false;

export function configureNotificationPresentation(): void {
  if (hasConfiguredNotificationHandler) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  hasConfiguredNotificationHandler = true;
}

export async function ensureVenueUpsellNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(
    venueUpsellNotificationChannelId,
    {
      name: i18n.t('auth:venueUpsellNotificationChannelName'),
      description: i18n.t('auth:venueUpsellNotificationChannelDescription'),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    }
  );
}

export async function scheduleVenueUpsellNotification(): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('auth:venueUpsellNotificationTitle'),
      body: i18n.t('auth:venueUpsellNotificationBody'),
      data: {
        type: 'venue-upsell',
      },
      ...(Platform.OS === 'android'
        ? { channelId: venueUpsellNotificationChannelId }
        : {}),
    },
    trigger: null,
  });
}
