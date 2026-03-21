import { Apple, Chrome } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  isAppleSignInAvailable,
  isGoogleSignInAvailable,
} from '@/src/lib/auth/social-auth';
import { cn } from '@/src/lib/utils';
import { ActivityIndicator, Pressable, Text, View } from '@/src/tw';

type ProviderButtonProps = {
  disabled?: boolean;
  icon: React.ReactNode;
  indicatorColor: string;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
  testID: string;
};

type SocialAuthButtonsProps = {
  appleLoading?: boolean;
  disabled?: boolean;
  googleLoading?: boolean;
  onApplePress: () => void;
  onGooglePress: () => void;
};

function ProviderButton({
  disabled = false,
  icon,
  indicatorColor,
  isLoading = false,
  label,
  onPress,
  testID,
}: ProviderButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'min-h-12 flex-row items-center justify-center rounded-2xl border border-border bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card',
        isLoading || disabled ? 'opacity-60' : undefined
      )}
      disabled={isLoading || disabled}
      onPress={onPress}
      testID={testID}
    >
      {isLoading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <>
          <View className="mr-3">{icon}</View>
          <Text className="text-sm font-semibold text-text dark:text-text-primary-dark">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SocialAuthButtons({
  appleLoading = false,
  disabled = false,
  googleLoading = false,
  onApplePress,
  onGooglePress,
}: SocialAuthButtonsProps): React.JSX.Element | null {
  const { t } = useTranslation('auth');
  const [shouldShowApple, setShouldShowApple] = useState(false);
  const shouldShowGoogle = isGoogleSignInAvailable();
  const colorScheme = useColorScheme();
  const iconColor =
    colorScheme === 'dark' ? Colors.textPrimaryDark : Colors.text;

  useEffect(() => {
    let isMounted = true;

    void isAppleSignInAvailable().then((isAvailable) => {
      if (isMounted) {
        setShouldShowApple(isAvailable);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!shouldShowApple && !shouldShowGoogle) {
    return null;
  }

  return (
    <View className="mt-5 gap-3">
      <View className="flex-row items-center">
        <View className="h-px flex-1 bg-border dark:bg-dark-border" />
        <Text className="mx-3 text-[13px] text-text-muted dark:text-text-muted-dark">
          {t('or')}
        </Text>
        <View className="h-px flex-1 bg-border dark:bg-dark-border" />
      </View>
      {shouldShowApple ? (
        <ProviderButton
          disabled={disabled}
          icon={<Apple color={iconColor} size={18} />}
          indicatorColor={iconColor}
          isLoading={appleLoading}
          label={t('continueWithApple')}
          onPress={onApplePress}
          testID="auth-apple-signin"
        />
      ) : null}
      {shouldShowGoogle ? (
        <ProviderButton
          disabled={disabled}
          icon={<Chrome color={iconColor} size={18} />}
          indicatorColor={iconColor}
          isLoading={googleLoading}
          label={t('continueWithGoogle')}
          onPress={onGooglePress}
          testID="auth-google-signin"
        />
      ) : null}
    </View>
  );
}
