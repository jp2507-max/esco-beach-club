import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronDown,
  PartyPopper,
  Send,
  Users,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { submitPrivateEventInquiry } from '@/lib/api';
import { useUserId } from '@/providers/DataProvider';
import { motion } from '@/src/lib/animations/motion';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type PrivateEventFormInput,
  type PrivateEventFormValues,
  privateEventSchema,
} from '@/src/lib/forms/schemas';
import { cn } from '@/src/lib/utils';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const EVENT_TYPE_KEYS = [
  'companyParty',
  'birthday',
  'wedding',
  'anniversary',
  'corporateRetreat',
  'other',
] as const;

export default function PrivateEventScreen(): React.JSX.Element {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showTypePicker, setShowTypePicker] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const successScale = useSharedValue(0);

  const userId = useUserId();
  const { control, handleSubmit, setValue } = useForm<
    PrivateEventFormInput,
    unknown,
    PrivateEventFormValues
  >({
    defaultValues: {
      contactEmail: '',
      contactName: '',
      estimatedPax: '',
      eventType: '',
      notes: '',
      preferredDate: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(privateEventSchema),
  });

  const eventType = useWatch({ control, name: 'eventType', defaultValue: '' });
  const preferredDate = useWatch({ control, name: 'preferredDate' });
  const estimatedPax = useWatch({
    control,
    name: 'estimatedPax',
    defaultValue: '',
  });

  const successStyle = useAnimatedStyle(() => ({
    opacity: successScale.get(),
    transform: [{ scale: successScale.get() }],
  }));

  const inquiryMutation = useMutation({
    mutationFn: (values: PrivateEventFormValues) =>
      submitPrivateEventInquiry({
        user_id: userId,
        event_type: values.eventType,
        preferred_date: values.preferredDate.toISOString(),
        estimated_pax: Number.parseInt(values.estimatedPax, 10) || 0,
        contact_name: values.contactName?.trim() || undefined,
        contact_email: values.contactEmail?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      console.log('[PrivateEvent] Inquiry submitted');
      setSubmitted(true);
      successScale.set(withSpring(1, motion.spring.bouncy));
    },
    onError: (err) => {
      console.log('[PrivateEvent] Submit error:', err);
      const message =
        err instanceof Error ? err.message : t('privateEvent.submitError');
      Alert.alert(t('privateEvent.submissionFailed'), message);
    },
  });

  const isValid =
    eventType.length > 0 && !!preferredDate && estimatedPax.length > 0;

  function handleInvalidSubmit(): void {
    Alert.alert(
      t('privateEvent.missingInfo'),
      t('privateEvent.missingInfoMessage')
    );
  }

  function handleTypeSelect(value: string): void {
    setValue('eventType', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setShowTypePicker(false);
  }

  function handleValidSubmit(values: PrivateEventFormValues): void {
    inquiryMutation.mutate(values);
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
          testID="close-inquiry"
        >
          <X color={Colors.text} size={20} />
        </Pressable>
        <Text className="text-base font-bold text-text dark:text-text-primary-dark">
          {t('privateEvent.title')}
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!submitted ? (
            <>
              <View className="mb-7 items-center">
                <View className="mb-4 size-[70px] items-center justify-center rounded-full bg-pink-light">
                  <PartyPopper color={Colors.primary} size={32} />
                </View>
                <Text className="mb-2 text-center text-2xl font-extrabold text-text dark:text-text-primary-dark">
                  {t('privateEvent.header')}
                </Text>
                <Text className="px-2 text-center text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                  {t('privateEvent.subtitle')}
                </Text>
              </View>

              <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[1.2px] text-text-secondary dark:text-text-secondary-dark">
                {t('privateEvent.eventDetails')}
              </Text>

              <Pressable
                accessibilityRole="button"
                className="mb-2 flex-row items-center rounded-[14px] border border-border bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card"
                onPress={() => setShowTypePicker(!showTypePicker)}
                testID="event-type-picker"
              >
                <View
                  className="mr-3 size-9 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${Colors.tealLight}66` }}
                >
                  <PartyPopper color={Colors.secondary} size={18} />
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 text-[11px] font-semibold text-text-secondary dark:text-text-secondary-dark">
                    {t('privateEvent.eventType')}
                  </Text>
                  <Text
                    className={
                      eventType
                        ? 'text-[15px] font-semibold text-text dark:text-text-primary-dark'
                        : 'text-[15px] font-normal text-text-muted dark:text-text-muted-dark'
                    }
                  >
                    {eventType
                      ? t(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          `privateEvent.eventTypes.${eventType}` as any
                        )
                      : t('privateEvent.selectType')}
                  </Text>
                </View>
                <ChevronDown color={Colors.textLight} size={18} />
              </Pressable>

              {showTypePicker && (
                <View className="mb-2 mt-[-4px] overflow-hidden rounded-[14px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
                  {EVENT_TYPE_KEYS.map((key) => (
                    <Pressable
                      accessibilityRole="button"
                      key={key}
                      className="border-b border-border px-[18px] py-[13px] last:border-b-0 dark:border-dark-border"
                      onPress={() => handleTypeSelect(key)}
                      style={
                        eventType === key
                          ? { backgroundColor: `${Colors.secondary}12` }
                          : undefined
                      }
                      testID={`type-${key}`}
                    >
                      <Text
                        className="text-[15px]"
                        style={{
                          color:
                            eventType === key ? Colors.secondary : Colors.text,
                          fontWeight: eventType === key ? '700' : '500',
                        }}
                      >
                        {t(`privateEvent.eventTypes.${key}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Controller
                control={control}
                name="preferredDate"
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { invalid },
                }) => (
                  <View
                    className={cn(
                      'mb-3 flex-row items-center rounded-2xl border bg-background px-4 py-3 dark:bg-dark-bg-card',
                      invalid
                        ? 'border-danger dark:border-error-dark'
                        : 'border-border dark:border-dark-border'
                    )}
                  >
                    <View className="mr-3 mt-0.5">
                      <Calendar color={Colors.secondary} size={18} />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-text-secondary dark:text-text-secondary-dark">
                        {t('privateEvent.preferredDate')}
                      </Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="date"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'currentColor',
                            fontFamily: 'inherit',
                            fontSize: '15px',
                            fontWeight: '600',
                            outline: 'none',
                            padding: 0,
                            minHeight: '24px',
                            width: '100%',
                          }}
                          value={
                            typeof value === 'string'
                              ? value
                              : (value as Date)
                                  ?.toISOString?.()
                                  ?.substring(0, 10) || ''
                          }
                          onChange={(e) => {
                            onChange(e.target.value);
                          }}
                          onBlur={onBlur}
                          data-testid="date-input"
                        />
                      ) : (
                        <TextInput
                          accessibilityLabel="Text input field"
                          accessibilityHint="Enter preferred date in YYYY-MM-DD format"
                          className="min-h-[24px] flex-1 p-0 text-[15px] font-semibold text-text dark:text-text-primary-dark"
                          placeholder={
                            t('privateEvent.preferredDatePlaceholder') ||
                            'YYYY-MM-DD'
                          }
                          placeholderTextColor={Colors.textLight}
                          value={
                            typeof value === 'string'
                              ? value
                              : (value as Date)
                                  ?.toISOString?.()
                                  ?.substring(0, 10) || ''
                          }
                          onChangeText={(text) => {
                            const cleaned = text.replace(/\D/g, '').slice(0, 8);
                            const match = cleaned.match(
                              /^(\d{1,4})(\d{1,2})?(\d{1,2})?$/
                            );
                            if (match) {
                              let formatted = match[1];
                              if (match[2]) formatted += '-' + match[2];
                              if (match[3]) formatted += '-' + match[3];
                              onChange(formatted);
                            } else {
                              onChange(cleaned);
                            }
                          }}
                          onBlur={onBlur}
                          keyboardType="number-pad"
                          testID="date-input"
                        />
                      )}
                    </View>
                  </View>
                )}
              />

              <ControlledTextInput<PrivateEventFormInput>
                control={control}
                icon={({ size }) => (
                  <Users color={Colors.secondary} size={size} />
                )}
                keyboardType="number-pad"
                label={t('privateEvent.estimatedGuests')}
                name="estimatedPax"
                placeholder={t('privateEvent.estimatedGuestsPlaceholder')}
                testID="pax-input"
              />

              <Text className="mb-2 ml-1 mt-6 text-[11px] font-bold uppercase tracking-[1.2px] text-text-secondary dark:text-text-secondary-dark">
                {t('privateEvent.contactInfoOptional')}
              </Text>

              <ControlledTextInput<PrivateEventFormInput>
                control={control}
                label={t('privateEvent.name')}
                name="contactName"
                placeholder={t('privateEvent.namePlaceholder')}
                testID="name-input"
              />

              <ControlledTextInput<PrivateEventFormInput>
                autoCapitalize="none"
                control={control}
                keyboardType="email-address"
                label={t('privateEvent.email')}
                name="contactEmail"
                placeholder={t('privateEvent.emailPlaceholder')}
                testID="email-input"
              />

              <ControlledTextInput<PrivateEventFormInput>
                className="min-h-[60px]"
                containerClassName="min-h-[100px] items-start pt-[14px]"
                control={control}
                label={t('privateEvent.additionalNotes')}
                multiline={true}
                name="notes"
                numberOfLines={4}
                placeholder={t('privateEvent.additionalNotesPlaceholder')}
                testID="notes-input"
                textAlignVertical="top"
              />

              <Pressable
                accessibilityRole="button"
                className="mt-5 flex-row items-center justify-center rounded-2xl bg-secondary py-4"
                onPress={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                style={!isValid ? { opacity: 0.5 } : undefined}
                testID="submit-inquiry"
              >
                <Send color="#fff" size={18} />
                <Text className="ml-2 text-base font-bold text-white">
                  {t('privateEvent.sendInquiry')}
                </Text>
              </Pressable>

              <Text className="mt-3 text-center text-xs text-text-muted dark:text-text-muted-dark">
                {t('privateEvent.teamResponse')}
              </Text>
            </>
          ) : (
            <Animated.View
              className="items-center pt-[60px]"
              style={successStyle}
            >
              <Text className="mb-5 text-[64px]">🎊</Text>
              <Text className="mb-[10px] text-[28px] font-extrabold text-text dark:text-text-primary-dark">
                {t('privateEvent.inquirySent')}
              </Text>
              <Text className="mb-9 px-5 text-center text-[15px] leading-[22px] text-text-secondary dark:text-text-secondary-dark">
                {t('privateEvent.inquirySentMessage')}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="rounded-2xl bg-secondary px-12 py-4"
                onPress={() => router.back()}
                testID="done-inquiry"
              >
                <Text className="text-base font-bold text-white">
                  {t('privateEvent.backToEvents')}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
