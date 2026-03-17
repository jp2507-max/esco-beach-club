import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Send, Star, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { submitReview } from '@/lib/api';
import { useUserId } from '@/providers/DataProvider';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import { type ReviewFormValues, reviewSchema } from '@/src/lib/forms/schemas';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type StarButtonProps = {
  isActive: boolean;
  onPress: () => void;
  scale: SharedValue<number>;
  star: number;
};

function useStarScales(): SharedValue<number>[] {
  return [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
  ];
}

function StarButton({
  isActive,
  onPress,
  scale,
  star,
}: StarButtonProps): React.JSX.Element {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
      accessibilityRole="button"
      accessibilityHint="Tap to select this star rating"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      testID={`star-${star}`}
    >
      <Animated.View style={style}>
        <Star
          color={isActive ? '#FFB300' : Colors.border}
          fill={isActive ? '#FFB300' : 'transparent'}
          size={42}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function RateUsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const starScales = useStarScales();
  const successScale = useSharedValue(0);
  const userId = useUserId();
  const { control, handleSubmit, setValue } = useForm<ReviewFormValues>({
    defaultValues: {
      comment: '',
      rating: 0,
    },
    mode: 'onBlur',
    resolver: zodResolver(reviewSchema),
  });

  const rating = useWatch({ control, name: 'rating', defaultValue: 0 });
  const comment =
    useWatch({ control, name: 'comment', defaultValue: '' }) ?? '';

  const successStyle = useAnimatedStyle(() => ({
    opacity: successScale.get(),
    transform: [{ scale: successScale.get() }],
  }));

  const reviewMutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      submitReview(userId, values.rating, values.comment?.trim() || null),
    onSuccess: () => {
      console.log('[RateUs] Review submitted successfully');
      setSubmitted(true);
      successScale.set(withSpring(1, motion.spring.bouncy));
    },
    onError: (err) => {
      console.log('[RateUs] Review submit error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Could not submit your review right now.';
      Alert.alert('Review Failed', message);
    },
  });

  function handleStarPress(star: number): void {
    setValue('rating', star, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    starScales[star - 1].set(
      withSequence(
        withTiming(1.4, rmTiming(motion.dur.xs)),
        withTiming(1, rmTiming(motion.dur.xs))
      )
    );
  }

  function handleInvalidSubmit(): void {
    Alert.alert(t('rateUs.ratingRequired'), t('rateUs.ratingRequiredMessage'));
  }

  function handleValidSubmit(values: ReviewFormValues): void {
    if (reviewMutation.isPending) return;
    reviewMutation.mutate(values);
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          accessibilityRole="button"
          className="size-10 items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
          onPress={() => router.back()}
          testID="close-rate"
        >
          <X color={Colors.text} size={20} />
        </Pressable>
        <Text className="text-base font-bold text-text dark:text-text-primary-dark">
          {t('rateUs.title')}
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="items-center px-6 pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!submitted ? (
            <>
              <View className="mb-5 mt-5 size-[90px] items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
                <Text className="text-[40px]">
                  {rating === 0
                    ? '🏖️'
                    : rating <= 2
                      ? '😕'
                      : rating === 3
                        ? '😊'
                        : '🤩'}
                </Text>
              </View>

              <Text className="mb-2 text-center text-[26px] font-extrabold text-text dark:text-text-primary-dark">
                {t('rateUs.howWasVisit')}
              </Text>
              <Text className="mb-7 px-2 text-center text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                {t('rateUs.feedbackHint')}
              </Text>

              <View className="mb-[10px] flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <View key={star} className={star < 5 ? 'mr-[14px]' : ''}>
                    <StarButton
                      isActive={star <= rating}
                      onPress={() => handleStarPress(star)}
                      scale={starScales[star - 1]}
                      star={star}
                    />
                  </View>
                ))}
              </View>

              {rating > 0 ? (
                <Text className="mb-7 mt-1.5 text-[15px] font-bold text-[#FFB300]">
                  {t(`rateUs.starLabels.${rating - 1}`)}
                </Text>
              ) : null}

              <View className="w-full">
                <ControlledTextInput<ReviewFormValues>
                  className="min-h-[90px]"
                  containerClassName="min-h-[130px] items-start p-4"
                  control={control}
                  maxLength={500}
                  multiline={true}
                  name="comment"
                  numberOfLines={4}
                  placeholder={t('rateUs.placeholder')}
                  testID="comment-input"
                  textAlignVertical="top"
                />
                <Text className="mb-6 text-right text-[11px] text-text-muted dark:text-text-muted-dark">
                  {comment.length}/500
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                className="w-full flex-row items-center justify-center rounded-2xl bg-primary py-4"
                disabled={rating === 0 || reviewMutation.isPending}
                onPress={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                style={
                  rating === 0 || reviewMutation.isPending
                    ? { opacity: 0.5 }
                    : undefined
                }
                testID="submit-review"
              >
                <Send color="#fff" size={18} />
                <Text className="ml-2 text-base font-bold text-white">
                  {t('rateUs.submitLabel')}
                </Text>
              </Pressable>
            </>
          ) : (
            <Animated.View
              className="items-center pt-[60px]"
              style={successStyle}
            >
              <Text className="mb-5 text-[64px]">🎉</Text>
              <Text className="mb-[10px] text-[28px] font-extrabold text-text dark:text-text-primary-dark">
                {t('rateUs.thankYou')}
              </Text>
              <Text className="mb-9 px-5 text-center text-[15px] leading-[22px] text-text-secondary dark:text-text-secondary-dark">
                {t('rateUs.thankYouMessage')}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-2xl bg-secondary px-12 py-4"
                onPress={() => router.back()}
                testID="done-btn"
              >
                <Text className="text-base font-bold text-white">
                  {t('rateUs.done')}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
