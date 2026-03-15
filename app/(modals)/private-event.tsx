import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, PartyPopper, Calendar, Users, ChevronDown, Send } from 'lucide-react-native';
import { useForm, useWatch } from 'react-hook-form';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useUserId } from '@/providers/DataProvider';
import { submitPrivateEventInquiry } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { motion } from '@/src/lib/animations/motion';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type PrivateEventFormValues,
  privateEventSchema,
} from '@/src/lib/forms/schemas';
import { Animated } from '@/src/tw/animated';
import { KeyboardAvoidingView, ScrollView, Text, Pressable, View } from '@/src/tw';

const eventTypes = ['Company Party', 'Birthday', 'Wedding', 'Anniversary', 'Corporate Retreat', 'Other'];

export default function PrivateEventScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showTypePicker, setShowTypePicker] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const successScale = useSharedValue(0);

  const userId = useUserId();
  const { control, handleSubmit, setValue } = useForm<PrivateEventFormValues>({
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
  const preferredDate = useWatch({ control, name: 'preferredDate', defaultValue: '' });
  const estimatedPax = useWatch({ control, name: 'estimatedPax', defaultValue: '' });

  const successStyle = useAnimatedStyle(() => ({
    opacity: successScale.get(),
    transform: [{ scale: successScale.get() }],
  }));

  const inquiryMutation = useMutation({
    mutationFn: (values: PrivateEventFormValues) =>
      submitPrivateEventInquiry({
        user_id: userId,
        event_type: values.eventType,
        preferred_date: values.preferredDate,
        estimated_pax: Number.parseInt(values.estimatedPax, 10),
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
      const message = err instanceof Error ? err.message : 'Could not send your inquiry right now.';
      Alert.alert('Submission Failed', message);
    },
  });

  const isValid = eventType.length > 0 && preferredDate.length > 0 && estimatedPax.length > 0;

  function handleInvalidSubmit(): void {
    Alert.alert('Missing Info', 'Please fill in the event type, date, and estimated guests.');
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
          className="size-10 items-center justify-center rounded-full border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
          onPress={() => router.back()}
          testID="close-inquiry"
        >
          <X color={Colors.text} size={20} />
        </Pressable>
        <Text className="text-base font-bold text-text dark:text-text-primary-dark">
          Private Event
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
                  Plan Your Private Party
                </Text>
                <Text className="px-2 text-center text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                  From intimate birthdays to grand corporate events — let us handle it all.
                </Text>
              </View>

              <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[1.2px] text-text-secondary dark:text-text-secondary-dark">
                Event Details
              </Text>

              <Pressable
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
                    Event Type
                  </Text>
                  <Text
                    className={
                      eventType
                        ? 'text-[15px] font-semibold text-text dark:text-text-primary-dark'
                        : 'text-[15px] font-normal text-text-muted dark:text-text-muted-dark'
                    }
                  >
                    {eventType || 'Select type...'}
                  </Text>
                </View>
                <ChevronDown color={Colors.textLight} size={18} />
              </Pressable>

              {showTypePicker && (
                <View className="mb-2 mt-[-4px] overflow-hidden rounded-[14px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
                  {eventTypes.map((type) => (
                    <Pressable
                      key={type}
                      className="border-b border-border px-[18px] py-[13px] last:border-b-0 dark:border-dark-border"
                      onPress={() => handleTypeSelect(type)}
                      style={eventType === type ? { backgroundColor: `${Colors.secondary}12` } : undefined}
                      testID={`type-${type}`}
                    >
                      <Text
                        className="text-[15px]"
                        style={{
                          color: eventType === type ? Colors.secondary : Colors.text,
                          fontWeight: eventType === type ? '700' : '500',
                        }}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <ControlledTextInput<PrivateEventFormValues>
                control={control}
                icon={({ color, size }) => <Calendar color={Colors.secondary} size={size} />}
                label="Preferred Date"
                name="preferredDate"
                placeholder="e.g. March 15, 2026"
                testID="date-input"
              />

              <ControlledTextInput<PrivateEventFormValues>
                control={control}
                icon={({ color, size }) => <Users color={Colors.secondary} size={size} />}
                keyboardType="number-pad"
                label="Estimated Guests"
                name="estimatedPax"
                placeholder="e.g. 50"
                testID="pax-input"
              />

              <Text className="mb-2 ml-1 mt-6 text-[11px] font-bold uppercase tracking-[1.2px] text-text-secondary dark:text-text-secondary-dark">
                Contact Info (optional)
              </Text>

              <ControlledTextInput<PrivateEventFormValues>
                control={control}
                label="Name"
                name="contactName"
                placeholder="Your full name"
                testID="name-input"
              />

              <ControlledTextInput<PrivateEventFormValues>
                autoCapitalize="none"
                control={control}
                keyboardType="email-address"
                label="Email"
                name="contactEmail"
                placeholder="you@email.com"
                testID="email-input"
              />

              <ControlledTextInput<PrivateEventFormValues>
                className="min-h-[60px]"
                containerClassName="min-h-[100px] items-start pt-[14px]"
                control={control}
                label="Additional Notes"
                multiline={true}
                name="notes"
                numberOfLines={4}
                placeholder="Theme, dietary requirements, special requests..."
                testID="notes-input"
                textAlignVertical="top"
              />

              <Pressable
                className="mt-5 flex-row items-center justify-center rounded-2xl bg-secondary py-4"
                onPress={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                style={!isValid ? { opacity: 0.5 } : undefined}
                testID="submit-inquiry"
              >
                <Send color="#fff" size={18} />
                <Text className="ml-2 text-base font-bold text-white">Send Inquiry</Text>
              </Pressable>

              <Text className="mt-3 text-center text-xs text-text-muted dark:text-text-muted-dark">
                Our team will get back to you within 24 hours.
              </Text>
            </>
          ) : (
            <Animated.View className="items-center pt-[60px]" style={successStyle}>
              <Text className="mb-5 text-[64px]">🎊</Text>
              <Text className="mb-[10px] text-[28px] font-extrabold text-text dark:text-text-primary-dark">
                Inquiry Sent!
              </Text>
              <Text className="mb-9 px-5 text-center text-[15px] leading-[22px] text-text-secondary dark:text-text-secondary-dark">
                Our events team will review your request and reach out within 24 hours. Get ready for an unforgettable event!
              </Text>
              <Pressable
                className="rounded-2xl bg-secondary px-12 py-4"
                onPress={() => router.back()}
                testID="done-inquiry"
              >
                <Text className="text-base font-bold text-white">Back to Events</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
