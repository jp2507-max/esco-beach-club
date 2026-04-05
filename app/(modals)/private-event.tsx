import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronDown,
  PartyPopper,
  Send,
  Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, useColorScheme } from 'react-native';
import {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { submitPrivateEventInquiry } from '@/lib/api';
import {
  BookingContentDataProvider,
  useBookingContentData,
  useUserId,
} from '@/providers/DataProvider';
import { Button, ModalHeader } from '@/src/components/ui';
import { motion, withRM } from '@/src/lib/animations/motion';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type PrivateEventFormInput,
  type PrivateEventFormValues,
  privateEventSchema,
} from '@/src/lib/forms/schemas';
import { hapticSelection } from '@/src/lib/haptics/haptics';
import { captureHandledError } from '@/src/lib/monitoring';
import { cn } from '@/src/lib/utils';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
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

type EventTypeOption = {
  label: string;
  value: string;
};

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateFromISO(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  return new Date();
}

function formatPrivateEventDateForDisplay(
  dateString: string,
  locale?: string
): string {
  if (!dateString) return '';

  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function PrivateEventScreenContent(): React.JSX.Element {
  const { t, i18n } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [showTypePicker, setShowTypePicker] = useState<boolean>(false);
  const [isDatePickerVisible, setIsDatePickerVisible] =
    useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const successScale = useSharedValue(0);

  const userId = useUserId();
  const { bookingContentLoading, privateEventTypes } = useBookingContentData();
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

  const resolvedEventTypeOptions = React.useMemo<EventTypeOption[]>(() => {
    if (bookingContentLoading) {
      return [];
    }

    if (privateEventTypes.length === 0) {
      return EVENT_TYPE_KEYS.map((key) => ({
        label: t(`privateEvent.eventTypes.${key}` as never) as string,
        value: key,
      }));
    }

    return privateEventTypes.map((option) => ({
      label: t(option.label_key as never) as string,
      value: option.value,
    }));
  }, [bookingContentLoading, privateEventTypes, t]);

  const selectedEventTypeLabel = React.useMemo<string>(() => {
    if (!eventType) return '';

    return (
      resolvedEventTypeOptions.find((option) => option.value === eventType)
        ?.label ??
      (t(`privateEvent.eventTypes.${eventType}` as never) as string)
    );
  }, [eventType, resolvedEventTypeOptions, t]);

  const successStyle = useAnimatedStyle(() => ({
    opacity: successScale.get(),
    transform: [{ scale: successScale.get() }],
  }));

  const inquiryMutation = useMutation({
    mutationFn: (values: PrivateEventFormValues) => {
      const preferredDate =
        values.preferredDate instanceof Date
          ? values.preferredDate
          : parseDateFromISO(String(values.preferredDate));

      return submitPrivateEventInquiry({
        user_id: userId,
        event_type: values.eventType,
        preferred_date: formatDateToISO(preferredDate),
        estimated_pax: Number.parseInt(values.estimatedPax, 10) || 0,
        contact_name: values.contactName?.trim() || undefined,
        contact_email: values.contactEmail?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      successScale.set(withSpring(1, motion.spring.bouncy));
    },
    onError: (err) => {
      captureHandledError(err, {
        extras: { userId },
        tags: {
          area: 'private_events',
          operation: 'submit_inquiry',
        },
      });
      const message =
        err instanceof Error ? err.message : t('privateEvent.submitError');
      Alert.alert(t('privateEvent.submissionFailed'), message);
    },
  });

  const isValid =
    eventType.length > 0 && !!preferredDate && estimatedPax.length > 0;
  const isSubmitting = inquiryMutation.isPending;

  function handleInvalidSubmit(): void {
    Alert.alert(
      t('privateEvent.missingInfo'),
      t('privateEvent.missingInfoMessage')
    );
  }

  function handleTypeSelect(value: string): void {
    hapticSelection();
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

  if (bookingContentLoading) {
    return (
      <View
        className="flex-1 bg-background dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <ModalHeader
          className="px-4 py-3"
          closeButtonClassName="size-10 items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
          closePosition="left"
          closeTestID="close-inquiry"
          onClose={() => router.back()}
          title={t('privateEvent.title')}
          titleAlign="center"
        />
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator
            color={isDark ? Colors.primaryBright : Colors.primary}
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ModalHeader
        className="px-4 py-3"
        closeButtonClassName="size-10 items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
        closePosition="left"
        closeTestID="close-inquiry"
        onClose={() => router.back()}
        title={t('privateEvent.title')}
        titleAlign="center"
      />

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
                <View className="mb-4 size-17.5 items-center justify-center rounded-full bg-pink-light">
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

              <Animated.View layout={withRM(LinearTransition)}>
                <Pressable
                  accessibilityRole="button"
                  className="mb-2 flex-row items-center rounded-[14px] border border-border bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card"
                  onPress={() => {
                    hapticSelection();
                    setShowTypePicker(!showTypePicker);
                  }}
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
                        ? selectedEventTypeLabel
                        : t('privateEvent.selectType')}
                    </Text>
                  </View>
                  <ChevronDown
                    color={isDark ? Colors.textMutedDark : Colors.textLight}
                    size={18}
                  />
                </Pressable>

                {showTypePicker ? (
                  <View className="-mt-1 mb-2 overflow-hidden rounded-[14px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
                    {resolvedEventTypeOptions.map((option) => (
                      <Pressable
                        accessibilityRole="button"
                        key={option.value}
                        className="border-b border-border px-4.5 py-3.25 last:border-b-0 dark:border-dark-border"
                        onPress={() => handleTypeSelect(option.value)}
                        style={
                          eventType === option.value
                            ? { backgroundColor: `${Colors.secondary}12` }
                            : undefined
                        }
                        testID={`type-${option.value}`}
                      >
                        <Text
                          className="text-[15px]"
                          style={{
                            color:
                              eventType === option.value
                                ? isDark
                                  ? Colors.secondaryBright
                                  : Colors.secondary
                                : isDark
                                  ? Colors.textPrimaryDark
                                  : Colors.text,
                            fontWeight:
                              eventType === option.value ? '700' : '500',
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Animated.View>

              <Controller
                control={control}
                name="preferredDate"
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { invalid },
                }) => {
                  const stringValue =
                    typeof value === 'string'
                      ? value
                      : (value as Date)?.toISOString?.().substring(0, 10) || '';
                  const displayValue = formatPrivateEventDateForDisplay(
                    stringValue,
                    i18n.language
                  );
                  const placeholder = t(
                    'privateEvent.preferredDatePlaceholder'
                  );
                  const nativeDateAccessibilityLabel = `${t('privateEvent.preferredDate')} ${displayValue || placeholder}`;
                  const pickerValue = stringValue
                    ? parseDateFromISO(stringValue)
                    : new Date();

                  function handleNativeDateChange(
                    _event: unknown,
                    selectedDate: Date | undefined
                  ): void {
                    if (Platform.OS === 'android') {
                      setIsDatePickerVisible(false);
                      onBlur();
                    }

                    if (selectedDate) {
                      onChange(formatDateToISO(selectedDate));
                    }
                  }

                  return (
                    <>
                      <Pressable
                        accessibilityRole={
                          Platform.OS === 'web' ? undefined : 'button'
                        }
                        accessibilityLabel={
                          Platform.OS === 'web'
                            ? undefined
                            : nativeDateAccessibilityLabel
                        }
                        accessibilityHint={
                          Platform.OS === 'web'
                            ? undefined
                            : t('privateEvent.preferredDateHint')
                        }
                        className={cn(
                          'mb-3 flex-row items-center rounded-2xl border bg-background px-4 py-3 dark:bg-dark-bg-card',
                          invalid
                            ? 'border-danger dark:border-error-dark'
                            : 'border-border dark:border-dark-border'
                        )}
                        onPress={
                          Platform.OS === 'web'
                            ? undefined
                            : () => {
                                hapticSelection();
                                setIsDatePickerVisible(true);
                              }
                        }
                        testID={
                          Platform.OS === 'web' ? undefined : 'date-input'
                        }
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
                                minHeight: '24px',
                                outline: 'none',
                                padding: 0,
                                width: '100%',
                              }}
                              value={stringValue}
                              onBlur={onBlur}
                              onChange={(e) => {
                                onChange(e.target.value);
                              }}
                              aria-label={t('privateEvent.preferredDate')}
                              data-testid="date-input"
                            />
                          ) : (
                            <Text
                              className={cn(
                                'min-h-6 text-[15px] font-semibold',
                                displayValue
                                  ? 'text-text dark:text-text-primary-dark'
                                  : 'text-text-muted dark:text-text-muted-dark'
                              )}
                            >
                              {displayValue || placeholder}
                            </Text>
                          )}
                        </View>
                      </Pressable>

                      {Platform.OS === 'ios' ? (
                        <Modal
                          animationType="slide"
                          transparent
                          visible={isDatePickerVisible}
                          onRequestClose={() => {
                            setIsDatePickerVisible(false);
                            onBlur();
                          }}
                        >
                          <View className="flex-1">
                            <Pressable
                              accessibilityHint={t('datePicker.dismissHint')}
                              accessibilityRole="button"
                              accessibilityLabel={t('close')}
                              className="flex-1"
                              onPress={() => {
                                setIsDatePickerVisible(false);
                                onBlur();
                              }}
                            />
                            <View className="rounded-t-3xl bg-card pb-8 dark:bg-dark-bg-card">
                              <View className="flex-row items-center justify-between border-b border-border/50 px-5 py-3 dark:border-dark-border/50">
                                <View className="w-16" />
                                <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                                  {t('privateEvent.preferredDate')}
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  className="w-16 items-end"
                                  onPress={() => {
                                    setIsDatePickerVisible(false);
                                    onBlur();
                                  }}
                                  testID="date-input-done"
                                >
                                  <Text className="text-[16px] font-bold text-primary dark:text-primary-bright">
                                    {t('done')}
                                  </Text>
                                </Pressable>
                              </View>
                              <DateTimePicker
                                display="inline"
                                mode="date"
                                onChange={handleNativeDateChange}
                                testID="date-input-picker"
                                value={pickerValue}
                              />
                            </View>
                          </View>
                        </Modal>
                      ) : null}

                      {Platform.OS === 'android' && isDatePickerVisible ? (
                        <DateTimePicker
                          display="default"
                          mode="date"
                          onChange={handleNativeDateChange}
                          testID="date-input-picker"
                          value={pickerValue}
                        />
                      ) : null}
                    </>
                  );
                }}
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
                className="min-h-15"
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

              <Button
                className="mt-5"
                isLoading={isSubmitting}
                leftIcon={
                  <Send
                    color={isDark ? Colors.secondaryDeeper : Colors.white}
                    size={18}
                  />
                }
                onPress={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                disabled={!isValid}
                testID="submit-inquiry"
                variant="secondary"
              >
                {t('privateEvent.sendInquiry')}
              </Button>

              <Text className="mt-3 text-center text-xs text-text-muted dark:text-text-muted-dark">
                {t('privateEvent.teamResponse')}
              </Text>
            </>
          ) : (
            <Animated.View className="items-center pt-15" style={successStyle}>
              <Text className="mb-5 text-[64px]">🎊</Text>
              <Text className="mb-2.5 text-[28px] font-extrabold text-text dark:text-text-primary-dark">
                {t('privateEvent.inquirySent')}
              </Text>
              <Text className="mb-9 px-5 text-center text-[15px] leading-5.5 text-text-secondary dark:text-text-secondary-dark">
                {t('privateEvent.inquirySentMessage')}
              </Text>
              <Button
                className="px-12"
                onPress={() => router.back()}
                size="lg"
                testID="done-inquiry"
                variant="secondary"
              >
                {t('privateEvent.backToEvents')}
              </Button>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function PrivateEventScreen(): React.JSX.Element {
  return (
    <BookingContentDataProvider>
      <PrivateEventScreenContent />
    </BookingContentDataProvider>
  );
}
