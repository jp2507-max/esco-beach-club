import { LinearGradient } from 'expo-linear-gradient';
import { Facebook, Instagram, Mail } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { Button } from '@/src/components/ui';
import { config } from '@/src/lib/config';
import { hapticLight } from '@/src/lib/haptics/haptics';
import { Pressable, Text, View } from '@/src/tw';

function openContactUrl(
  url: string,
  errorMessage: string,
  logPrefix: string
): void {
  hapticLight();
  Linking.openURL(url).catch((error: unknown) => {
    console.error(`[${logPrefix}] Failed to open contact URL:`, error);
    Alert.alert(errorMessage);
  });
}

export function BookingContactActions(): React.JSX.Element {
  const { t } = useTranslation('common');
  const isDark = useColorScheme() === 'dark';

  const iconColor = isDark ? Colors.textPrimaryDark : Colors.text;
  const openLinkError = t('bookingContact.openLinkError');

  return (
    <View className="w-full gap-2.5">
      <Button
        accessibilityHint={t('bookingContact.emailHint')}
        accessibilityLabel={t('bookingContact.emailButton')}
        className="w-full"
        leftIcon={<Mail color={iconColor} size={18} />}
        onPress={() =>
          openContactUrl(
            `mailto:${config.contact.supportEmail}`,
            openLinkError,
            'BookingContactActions'
          )
        }
        testID="booking-contact-email-action"
        variant="outline"
      >
        {t('bookingContact.emailButton')}
      </Button>

      <View className="flex-row gap-2.5">
        <Button
          accessibilityHint={t('bookingContact.instagramHint')}
          accessibilityLabel={t('bookingContact.instagramButton')}
          className="flex-1"
          leftIcon={<Instagram color={iconColor} size={18} />}
          onPress={() =>
            openContactUrl(
              config.contact.instagramUrl,
              openLinkError,
              'BookingContactActions'
            )
          }
          testID="booking-contact-instagram"
          variant="outline"
        >
          {t('bookingContact.instagramButton')}
        </Button>

        <Button
          accessibilityHint={t('bookingContact.facebookHint')}
          accessibilityLabel={t('bookingContact.facebookButton')}
          className="flex-1"
          leftIcon={<Facebook color={iconColor} size={18} />}
          onPress={() =>
            openContactUrl(
              config.contact.facebookUrl,
              openLinkError,
              'BookingContactActions'
            )
          }
          testID="booking-contact-facebook"
          variant="outline"
        >
          {t('bookingContact.facebookButton')}
        </Button>
      </View>
    </View>
  );
}

export function BookingContactInlineLinks(): React.JSX.Element {
  const { t } = useTranslation('common');
  const openLinkError = t('bookingContact.openLinkError');

  return (
    <View className="mb-3 mt-2">
      <Text className="text-[11px] font-semibold uppercase tracking-[0.6px] text-text-secondary dark:text-text-secondary-dark">
        {t('bookingContact.inlinePrompt')}
      </Text>

      <View className="mt-2 gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('bookingContact.instagramHint')}
          accessibilityLabel={t('bookingContact.instagramInlineCta')}
          className="w-full overflow-hidden rounded-full active:opacity-90"
          onPress={() =>
            openContactUrl(
              config.contact.instagramUrl,
              openLinkError,
              'BookingContactInlineLinks'
            )
          }
          testID="booking-inline-instagram"
        >
          <LinearGradient
            colors={Colors.brandInstagramGradient}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={{ width: '100%' }}
          >
            <View className="min-h-11 flex-row items-center justify-center px-3 py-2.5">
              <Instagram color={Colors.white} size={18} />
              <Text
                className="ml-2 text-center text-[13px] font-bold text-white"
                numberOfLines={1}
              >
                {t('bookingContact.instagramInlineCta')}
              </Text>
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('bookingContact.facebookHint')}
          accessibilityLabel={t('bookingContact.facebookInlineCta')}
          className="min-h-11 w-full flex-row items-center justify-center rounded-full px-3 py-2.5 active:opacity-90"
          style={{ backgroundColor: Colors.brandFacebookBlue }}
          onPress={() =>
            openContactUrl(
              config.contact.facebookUrl,
              openLinkError,
              'BookingContactInlineLinks'
            )
          }
          testID="booking-inline-facebook"
        >
          <Facebook color={Colors.white} size={18} />
          <Text
            className="ml-2 text-center text-[13px] font-bold text-white"
            numberOfLines={1}
          >
            {t('bookingContact.facebookInlineCta')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
