import { Bell } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Avatar } from '@/src/components/ui/avatar';
import { HeaderGlassButton } from '@/src/components/ui/header-glass-button';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type ProfileHeaderProps = {
  avatarUrl: string | null;
  comingSoonLabel: string;
  isDark: boolean;
  notificationsHint: string;
  onPressNotifications: () => void;
  userName: string;
  welcomeBackLabel: string;
};

function ProfileAvatarIntro({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const scale = useSharedValue(0.94);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.set(withSpring(1, motion.spring.gentle));
    opacity.set(withTiming(1, rmTiming(motion.dur.md)));

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export function ProfileHeader({
  avatarUrl,
  comingSoonLabel,
  isDark,
  notificationsHint,
  onPressNotifications,
  userName,
  welcomeBackLabel,
}: ProfileHeaderProps): React.JSX.Element {
  return (
    <View className="flex-row items-center justify-between pb-4 pt-3">
      <ProfileAvatarIntro>
        <View className="flex-row items-center">
          <View
            className="mr-3 size-12 overflow-hidden rounded-full border-[2.5px]"
            style={{ borderColor: `${Colors.primary}40` }}
          >
            <Avatar className="h-full w-full" uri={avatarUrl} />
          </View>
          <View>
            <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
              {welcomeBackLabel}
            </Text>
            <Text className="text-xl font-extrabold text-primary dark:text-primary-bright">
              {userName}
            </Text>
          </View>
        </View>
      </ProfileAvatarIntro>

      <HeaderGlassButton
        accessibilityLabel={comingSoonLabel}
        accessibilityHint={notificationsHint}
        className="size-10.5 border-white/35 dark:border-white/20"
        glassStyle="regular"
        onPress={onPressNotifications}
        testID="notification-bell"
      >
        <Bell color={isDark ? Colors.textPrimaryDark : Colors.text} size={20} />
      </HeaderGlassButton>
    </View>
  );
}
