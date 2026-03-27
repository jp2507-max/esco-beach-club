import { ArrowLeft } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Text, View } from '@/src/tw';

type OnboardingHeaderProps = {
  onBack: () => void;
  step: number;
  testIDPrefix: string;
  totalSteps?: number;
};

const DEFAULT_TOTAL_STEPS = 6;

export function OnboardingHeader({
  onBack,
  step,
  testIDPrefix,
  totalSteps = DEFAULT_TOTAL_STEPS,
}: OnboardingHeaderProps): ReactNode {
  const { t } = useTranslation('auth');
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-5 pb-3"
      style={{ paddingTop: insets.top + 6 }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="size-10 items-center justify-center rounded-full"
          onPress={onBack}
          testID={`${testIDPrefix}-back`}
        >
          <ArrowLeft
            className="text-primary dark:text-primary-bright"
            size={20}
          />
        </Pressable>

        <Text className="text-[24px] font-extrabold tracking-[-0.7px] text-primary dark:text-primary-bright">
          {t('brandTitle')}
        </Text>

        <View className="size-10" />
      </View>

      <View className="items-center gap-1.5">
        <Text className="text-[10px] font-bold uppercase tracking-[3.5px] text-secondary dark:text-secondary-fixed">
          {t('onboardingBasicsStep', { step, total: totalSteps })}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              className={`h-1.5 w-7 rounded-full ${
                i < step
                  ? 'bg-primary dark:bg-primary-bright'
                  : 'bg-primary/20 dark:bg-primary-bright/30'
              }`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
