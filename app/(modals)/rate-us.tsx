import React, { useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Star, Send } from 'lucide-react-native';
import { useForm, useWatch } from 'react-hook-form';
import {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useUserId } from '@/providers/DataProvider';
import { submitReview } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { motion, rmTiming } from '@/src/lib/animations/motion';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import { type ReviewFormValues, reviewSchema } from '@/src/lib/forms/schemas';
import { Animated } from '@/src/tw/animated';
import { KeyboardAvoidingView, ScrollView, Text, Pressable, View } from '@/src/tw';

const starLabels = ['Terrible', 'Poor', 'Okay', 'Great', 'Amazing!'] as const;

type StarButtonProps = {
  isActive: boolean;
  onPress: () => void;
  scale: SharedValue<number>;
  star: number;
};

function StarButton({ isActive, onPress, scale, star }: StarButtonProps): React.JSX.Element {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable onPress={onPress} testID={`star-${star}`}>
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
  const [submitted, setSubmitted] = useState<boolean>(false);
  const starScaleOne = useSharedValue(1);
  const starScaleTwo = useSharedValue(1);
  const starScaleThree = useSharedValue(1);
  const starScaleFour = useSharedValue(1);
  const starScaleFive = useSharedValue(1);
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
  const comment = useWatch({ control, name: 'comment', defaultValue: '' }) ?? '';
  const starScales = useMemo(
    () => [starScaleOne, starScaleTwo, starScaleThree, starScaleFour, starScaleFive],
    [starScaleFive, starScaleFour, starScaleOne, starScaleThree, starScaleTwo]
  );

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
      const message = err instanceof Error ? err.message : 'Could not submit your review right now.';
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
      withSequence(withTiming(1.4, rmTiming(motion.dur.xs)), withTiming(1, rmTiming(motion.dur.xs)))
    );
  }

  function handleInvalidSubmit(): void {
    Alert.alert('Rating Required', 'Please select a star rating before submitting.');
  }

  function handleValidSubmit(values: ReviewFormValues): void {
    reviewMutation.mutate(values);
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          className="size-10 items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
          onPress={() => router.back()}
          testID="close-rate"
        >
          <X color={Colors.text} size={20} />
        </Pressable>
        <Text className="text-base font-bold text-text dark:text-text-primary-dark">
          Rate Your Experience
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
                  {rating === 0 ? '🏖️' : rating <= 2 ? '😕' : rating === 3 ? '😊' : '🤩'}
                </Text>
              </View>

              <Text className="mb-2 text-center text-[26px] font-extrabold text-text dark:text-text-primary-dark">
                How was your visit?
              </Text>
              <Text className="mb-7 px-2 text-center text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                Your feedback helps us create the best beach club experience.
              </Text>

              <View className="mb-[10px] flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <View
                    key={star}
                    className={star < 5 ? 'mr-[14px]' : ''}
                  >
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
                  {starLabels[rating - 1]}
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
                  placeholder="Tell us more about your experience..."
                  testID="comment-input"
                  textAlignVertical="top"
                />
                <Text className="mb-6 text-right text-[11px] text-text-muted dark:text-text-muted-dark">
                  {comment.length}/500
                </Text>
              </View>

              <Pressable
                className="w-full flex-row items-center justify-center rounded-2xl bg-primary py-4"
                onPress={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                style={rating === 0 ? { opacity: 0.5 } : undefined}
                testID="submit-review"
              >
                <Send color="#fff" size={18} />
                <Text className="ml-2 text-base font-bold text-white">Submit Review</Text>
              </Pressable>
            </>
          ) : (
            <Animated.View className="items-center pt-[60px]" style={successStyle}>
              <Text className="mb-5 text-[64px]">🎉</Text>
              <Text className="mb-[10px] text-[28px] font-extrabold text-text dark:text-text-primary-dark">
                Thank You!
              </Text>
              <Text className="mb-9 px-5 text-center text-[15px] leading-[22px] text-text-secondary dark:text-text-secondary-dark">
                Your feedback means the world to us. We will keep making Esco Life even better.
              </Text>
              <Pressable
                className="rounded-2xl bg-secondary px-12 py-4"
                onPress={() => router.back()}
                testID="done-btn"
              >
                <Text className="text-base font-bold text-white">Done</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
