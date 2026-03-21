import {
  type GlassStyle,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import React from 'react';
import {
  type AccessibilityState,
  Platform,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Pressable, View } from '@/src/tw';

export type HeaderGlassButtonVariant = 'overlay' | 'surface';

export type HeaderGlassButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  accessibilityState?: AccessibilityState;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  glassStyle?: GlassStyle;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: HeaderGlassButtonVariant;
};

function supportsGlassEffect(): boolean {
  if (Platform.OS !== 'ios') return false;

  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export function HeaderGlassButton({
  accessibilityHint,
  accessibilityLabel,
  accessibilityState,
  children,
  className,
  disabled = false,
  glassStyle = 'regular',
  onPress,
  style,
  testID,
  variant = 'surface',
}: HeaderGlassButtonProps): React.JSX.Element {
  const canUseGlass = supportsGlassEffect();

  const isReducedMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      className={cn(
        'size-10 items-center justify-center overflow-hidden rounded-full border',
        variant === 'overlay'
          ? 'border-white/35 bg-black/35'
          : 'border-border bg-white/75 dark:border-dark-border dark:bg-dark-bg-card/75',
        className
      )}
      disabled={disabled}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      {canUseGlass ? (
        <GlassView
          glassEffectStyle={{
            animate: !isReducedMotion,
            animationDuration: isReducedMotion ? 0 : 0.2,
            style: glassStyle,
          }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          tintColor={
            variant === 'overlay'
              ? Colors.overlayTintDark
              : Colors.overlayTintLight
          }
        />
      ) : null}
      <View className="items-center justify-center">{children}</View>
    </Pressable>
  );
}
