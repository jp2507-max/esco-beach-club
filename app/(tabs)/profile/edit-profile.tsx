import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Calendar, User, Waves } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { updateProfile } from '@/lib/api';
import { useProfileData } from '@/providers/DataProvider';
import {
  Button,
  ProfileSubScreenHeader,
  SurfaceCard,
} from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type EditProfileFormValues,
  editProfileSchema,
} from '@/src/lib/forms/schemas';
import { hapticSuccess } from '@/src/lib/haptics/haptics';
import { captureHandledError } from '@/src/lib/monitoring';
import { cn } from '@/src/lib/utils';
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
} from '@/src/tw';
import { Animated } from '@/src/tw/animated';

function formatDateInput(text: string): string {
  const cleaned = text.replace(/\D/g, '').slice(0, 8);
  const match = cleaned.match(/^(\d{1,4})(\d{1,2})?(\d{1,2})?$/);

  if (!match) return cleaned;

  let formatted = match[1];
  if (match[2]) formatted += `-${match[2]}`;
  if (match[3]) formatted += `-${match[3]}`;
  return formatted;
}

export default function EditProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const { profile, userId } = useProfileData();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EditProfileFormValues>({
    defaultValues: {
      bio: '',
      fullName: '',
      memberSince: '',
      nightsLeft: '0',
    },
    mode: 'onBlur',
    resolver: zodResolver(editProfileSchema),
  });

  useEffect(() => {
    if (isDirty) return;

    reset({
      bio: profile?.bio ?? '',
      fullName: profile?.full_name ?? '',
      memberSince: profile?.member_since
        ? profile.member_since.slice(0, 10)
        : '',
      nightsLeft: String(profile?.nights_left ?? 0),
    });
  }, [isDirty, profile, reset]);

  const saveProfileMutation = useMutation({
    mutationFn: async (values: EditProfileFormValues) =>
      updateProfile(userId, {
        bio: values.bio.trim(),
        full_name: values.fullName.trim(),
        member_since: values.memberSince,
        nights_left: Number.parseInt(values.nightsLeft, 10),
      }),
    onError: (error: unknown) => {
      captureHandledError(error, {
        tags: {
          area: 'profile',
          operation: 'edit_profile',
        },
      });
      console.error('[EditProfile] Failed to save profile:', error);
      Alert.alert(t('errors.saveProfileFailed'));
    },
    onSuccess: () => {
      hapticSuccess();
      router.back();
    },
  });

  function handleSave(values: EditProfileFormValues): void {
    if (saveProfileMutation.isPending) return;
    saveProfileMutation.mutate(values);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader title={t('editProfile.title')} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-8 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentStyle}>
          <SurfaceCard className="mb-6 p-5">
            <Text className="text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
              {t('editProfile.subtitle')}
            </Text>
          </SurfaceCard>

          <ControlledTextInput<EditProfileFormValues>
            autoCapitalize="words"
            control={control}
            icon={({ color, size }) => <User color={color} size={size} />}
            label={t('editProfile.fullName')}
            name="fullName"
            placeholder={t('editProfile.fullName')}
            returnKeyType="next"
            testID="edit-profile-full-name"
          />

          <ControlledTextInput<EditProfileFormValues>
            control={control}
            icon={({ color, size }) => <Waves color={color} size={size} />}
            label={t('editProfile.bio')}
            maxLength={160}
            multiline
            name="bio"
            numberOfLines={4}
            placeholder={t('editProfile.bioPlaceholder')}
            testID="edit-profile-bio"
            textAlignVertical="top"
          />

          <Controller
            control={control}
            name="memberSince"
            render={({
              field: { onBlur, onChange, value },
              fieldState: { error, invalid },
            }) => (
              <View className="mb-3">
                <View
                  className={cn(
                    'flex-row items-center rounded-2xl border bg-background px-4 py-3 dark:bg-dark-bg-card',
                    invalid
                      ? 'border-danger dark:border-error-dark'
                      : 'border-border dark:border-dark-border'
                  )}
                >
                  <View className="mr-3 mt-0.5">
                    <Calendar color={Colors.textLight} size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-text-secondary dark:text-text-secondary-dark">
                      {t('editProfile.memberSince')}
                    </Text>
                    <TextInput
                      accessibilityHint={t(
                        'editProfile.memberSincePlaceholder'
                      )}
                      accessibilityLabel={t('editProfile.memberSince')}
                      className="min-h-6 flex-1 p-0 text-[15px] font-semibold text-text dark:text-text-primary-dark"
                      inputMode="numeric"
                      keyboardType="number-pad"
                      onBlur={onBlur}
                      onChangeText={(text) => {
                        onChange(formatDateInput(text));
                      }}
                      placeholder={t('editProfile.memberSincePlaceholder')}
                      placeholderTextColor={Colors.textLight}
                      testID="edit-profile-member-since"
                      value={value}
                    />
                    {error?.message ? (
                      <Text className="mt-1 text-xs font-medium text-danger dark:text-error-dark">
                        {t(error.message as never)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            )}
          />

          <ControlledTextInput<EditProfileFormValues>
            control={control}
            inputMode="numeric"
            keyboardType="number-pad"
            label={t('editProfile.nightsLeft')}
            name="nightsLeft"
            placeholder={t('editProfile.nightsLeftPlaceholder')}
            testID="edit-profile-nights-left"
          />

          <Button
            className="mt-3"
            isLoading={saveProfileMutation.isPending}
            onPress={handleSubmit(handleSave)}
            testID="edit-profile-save"
          >
            {saveProfileMutation.isPending
              ? t('editProfile.saving')
              : t('editProfile.save')}
          </Button>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
