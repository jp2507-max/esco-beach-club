import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import {
  type GlassStyle,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import React from 'react';
import {
  AccessibilityInfo,
  type AccessibilityState,
  Platform,
  type StyleProp,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { getAndroidRippleConfig } from '@/src/lib/styles/android-ripple';
import { shadows } from '@/src/lib/styles/shadows';
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

type GlassSupportState = {
  apiAvailable: boolean;
  canUseGlass: boolean;
  error?: string;
  liquidAvailable: boolean;
};
const GLASS_FILL_STYLE = { borderRadius: 999 } as const;

function getGlassSupportState(): GlassSupportState {
  if (Platform.OS !== 'ios') {
    return {
      apiAvailable: false,
      canUseGlass: false,
      liquidAvailable: false,
    };
  }

  try {
    const apiAvailable = isGlassEffectAPIAvailable();
    const liquidAvailable = isLiquidGlassAvailable();
    return {
      apiAvailable,
      canUseGlass: apiAvailable && liquidAvailable,
      liquidAvailable,
    };
  } catch (error: unknown) {
    return {
      apiAvailable: false,
      canUseGlass: false,
      error: error instanceof Error ? error.message : 'unknownError',
      liquidAvailable: false,
    };
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
  const supportState = React.useMemo(() => getGlassSupportState(), []);
  const canUseGlass = supportState.canUseGlass;
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isReducedMotion = useReducedMotion();
  const [isGlassReady, setIsGlassReady] = React.useState(false);
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] =
    React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!canUseGlass || !isFocused) {
      setIsGlassReady(false);
      return;
    }

    setIsGlassReady(false);
    const frameId = requestAnimationFrame(() => {
      setIsGlassReady(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [canUseGlass, glassStyle, isFocused]);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let isMounted = true;

    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((isEnabled) => {
        if (!isMounted) return;
        setIsReduceTransparencyEnabled(isEnabled);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsReduceTransparencyEnabled(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const glassContainerClassName =
    variant === 'overlay'
      ? 'border-white/30 bg-transparent'
      : 'border-white/35 bg-transparent dark:border-white/20';

  const fallbackContainerClassName =
    variant === 'overlay'
      ? 'border-white/35 bg-black/35'
      : 'border-white/45 bg-white/35 dark:border-white/20 dark:bg-white/10';

  const effectiveGlassStyle: GlassStyle =
    canUseGlass && isFocused && isGlassReady && !isReduceTransparencyEnabled
      ? glassStyle
      : 'none';
  const shouldAnimateGlass = !isReducedMotion && effectiveGlassStyle !== 'none';
  const androidRipple = React.useMemo(
    () =>
      getAndroidRippleConfig(
        isDark ? Colors.ACTIVE_BG_DARK : Colors.ACTIVE_BG_LIGHT
      ),
    [isDark]
  );
  const androidFallbackStyle = React.useMemo<StyleProp<ViewStyle>>(
    () =>
      Platform.OS === 'android'
        ? [
            shadows.level2,
            variant === 'overlay'
              ? {
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  borderColor: 'rgba(255,255,255,0.35)',
                  shadowColor: Colors.black,
                }
              : {
                  backgroundColor: isDark
                    ? Colors.darkBgElevated
                    : Colors.surfaceContainerLow,
                  borderColor: isDark
                    ? Colors.darkBorderBright
                    : Colors.borderLight,
                  shadowColor: isDark ? Colors.black : Colors.primary,
                },
          ]
        : undefined,
    [isDark, variant]
  );

  return (
    <Pressable
      android_ripple={androidRipple}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      className={cn(
        'size-10 items-center justify-center rounded-full border',
        canUseGlass
          ? glassContainerClassName
          : Platform.OS === 'android'
            ? variant === 'overlay'
              ? 'border-white/35 bg-transparent'
              : 'bg-transparent'
            : fallbackContainerClassName,
        className
      )}
      disabled={disabled}
      onPress={onPress}
      style={[androidFallbackStyle, style]}
      testID={testID}
    >
      {canUseGlass ? (
        <GlassView
          key={`glass-${isFocused ? 'focused' : 'blurred'}-${isGlassReady ? 'ready' : 'init'}-${effectiveGlassStyle}`}
          glassEffectStyle={{
            animate: shouldAnimateGlass,
            animationDuration: shouldAnimateGlass ? 0.2 : 0,
            style: effectiveGlassStyle,
          }}
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, GLASS_FILL_STYLE]}
          tintColor={
            variant === 'overlay'
              ? Colors.overlayTintDark
              : isDark
                ? Colors.overlayTintDark
                : Colors.overlayTintLight
          }
        />
      ) : Platform.OS === 'ios' ? (
        <BlurView
          intensity={78}
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, GLASS_FILL_STYLE]}
          tint={variant === 'overlay' || isDark ? 'dark' : 'light'}
        />
      ) : null}
      <View className="items-center justify-center">{children}</View>
    </Pressable>
  );
}
