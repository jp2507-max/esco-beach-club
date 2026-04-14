import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CalendarDays, User, Waves } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateProfile } from '@/lib/api';
import { useProfileData } from '@/providers/DataProvider';
import { AppScreenContent } from '@/src/components/app/app-screen-content';
import {
  Button,
  ProfileSubScreenHeader,
  SurfaceCard,
} from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { ControlledDateInput } from '@/src/lib/forms/controlled-date-input';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type EditProfileFormInput,
  type EditProfileFormValues,
  editProfileSchema,
} from '@/src/lib/forms/schemas';
import { hapticSuccess } from '@/src/lib/haptics/haptics';
import { captureHandledError } from '@/src/lib/monitoring';
import { KeyboardAvoidingView, ScrollView, Text } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

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
  } = useForm<EditProfileFormInput, unknown, EditProfileFormValues>({
    defaultValues: {
      bio: '',
      dateOfBirth: '',
      fullName: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(editProfileSchema),
  });

  useEffect(() => {
    if (isDirty) return;

    reset({
      bio: profile?.bio ?? '',
      dateOfBirth: profile?.date_of_birth ?? '',
      fullName: profile?.full_name ?? '',
    });
  }, [isDirty, profile, reset]);

  const saveProfileMutation = useMutation({
    mutationFn: async (values: EditProfileFormValues) =>
      updateProfile(userId, {
        bio: values.bio.trim(),
        date_of_birth: values.dateOfBirth?.trim() || null,
        full_name: values.fullName.trim(),
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

      <AppScreenContent className="flex-1">
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

            <ControlledTextInput<EditProfileFormInput>
              autoCapitalize="words"
              control={control}
              icon={({ color, size }) => <User color={color} size={size} />}
              label={t('editProfile.fullName')}
              name="fullName"
              placeholder={t('editProfile.fullName')}
              returnKeyType="next"
              testID="edit-profile-full-name"
            />

            <ControlledDateInput<EditProfileFormInput>
              control={control}
              icon={({ color, size }) => (
                <CalendarDays color={color} size={size} />
              )}
              label={t('editProfile.dateOfBirth')}
              name="dateOfBirth"
              placeholder={t('editProfile.dateOfBirthPlaceholder')}
              testID="edit-profile-date-of-birth"
            />
            <Text className="-mt-1 mb-3 px-1 text-xs leading-5 text-text-muted dark:text-text-muted-dark">
              {t('editProfile.dateOfBirthHint')}
            </Text>

            <ControlledTextInput<EditProfileFormInput>
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
      </AppScreenContent>
    </KeyboardAvoidingView>
  );
}
