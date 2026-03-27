import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Calendar, User, Waves } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { updateProfile, uploadProfilePhotoAndGetUrl } from '@/lib/api';
import { useProfileData } from '@/providers/DataProvider';
import {
  Button,
  ProfileSubScreenHeader,
  SurfaceCard,
} from '@/src/components/ui';
import { ControlledProfilePhotoInput } from '@/src/lib/forms/controlled-profile-photo-input';
import { ControlledTextInput } from '@/src/lib/forms/controlled-text-input';
import {
  type EditProfileFormValues,
  editProfileSchema,
  type ProfilePhotoFieldValue,
} from '@/src/lib/forms/schemas';
import { cn } from '@/src/lib/utils';
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
} from '@/src/tw';

function formatDateInput(text: string): string {
  const cleaned = text.replace(/\D/g, '').slice(0, 8);
  const match = cleaned.match(/^(\d{1,4})(\d{1,2})?(\d{1,2})?$/);

  if (!match) return cleaned;

  let formatted = match[1];
  if (match[2]) formatted += `-${match[2]}`;
  if (match[3]) formatted += `-${match[3]}`;
  return formatted;
}

function createProfilePhotoValue(
  previewUri: string | null
): ProfilePhotoFieldValue {
  return {
    action: 'keep',
    localUri: null,
    mimeType: null,
    previewUri,
  };
}

function isPermissionBlocked(permission: {
  canAskAgain?: boolean;
  granted: boolean;
}): boolean {
  return !permission.granted && permission.canAskAgain === false;
}

export default function EditProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
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
      profilePhoto: createProfilePhotoValue(null),
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
      profilePhoto: createProfilePhotoValue(profile?.avatar_url ?? null),
    });
  }, [isDirty, profile, reset]);

  async function pickImageFromLibrary(
    current: ProfilePhotoFieldValue
  ): Promise<ProfilePhotoFieldValue | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t('errors.photoPermissionTitle'),
        isPermissionBlocked(permission)
          ? t('errors.photoPermissionBlockedDescription')
          : t('errors.photoLibraryPermissionDescription')
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return current;

    const [asset] = result.assets;
    if (!asset?.uri) {
      Alert.alert(t('errors.photoSelectionFailed'));
      return null;
    }

    return {
      action: 'upload',
      localUri: asset.uri,
      mimeType: asset.mimeType ?? null,
      previewUri: asset.uri,
    };
  }

  async function capturePhoto(
    current: ProfilePhotoFieldValue
  ): Promise<ProfilePhotoFieldValue | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t('errors.photoPermissionTitle'),
        isPermissionBlocked(permission)
          ? t('errors.photoPermissionBlockedDescription')
          : t('errors.photoCameraPermissionDescription')
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return current;

    const [asset] = result.assets;
    if (!asset?.uri) {
      Alert.alert(t('errors.photoSelectionFailed'));
      return null;
    }

    return {
      action: 'upload',
      localUri: asset.uri,
      mimeType: asset.mimeType ?? null,
      previewUri: asset.uri,
    };
  }

  async function markPhotoForRemoval(
    current: ProfilePhotoFieldValue
  ): Promise<ProfilePhotoFieldValue | null> {
    if (!current.previewUri) return current;

    return {
      action: 'remove',
      localUri: null,
      mimeType: null,
      previewUri: null,
    };
  }

  const saveProfileMutation = useMutation({
    mutationFn: async (values: EditProfileFormValues) => {
      let avatarUrlUpdate: string | null | undefined = undefined;

      if (values.profilePhoto.action === 'remove') {
        avatarUrlUpdate = null;
      }

      if (
        values.profilePhoto.action === 'upload' &&
        values.profilePhoto.localUri
      ) {
        avatarUrlUpdate = await uploadProfilePhotoAndGetUrl({
          localUri: values.profilePhoto.localUri,
          mimeType: values.profilePhoto.mimeType,
          userId,
        });
      }

      return updateProfile(userId, {
        avatar_url: avatarUrlUpdate,
        bio: values.bio.trim(),
        full_name: values.fullName.trim(),
        member_since: values.memberSince,
        nights_left: Number.parseInt(values.nightsLeft, 10),
      });
    },
    onError: (error: unknown) => {
      const errorKey =
        error instanceof Error && error.message === 'profilePhotoUploadFailed'
          ? 'errors.photoUploadFailed'
          : 'errors.saveProfileFailed';

      console.error('[EditProfile] Failed to save profile:', error);
      Alert.alert(t(errorKey));
    },
    onSuccess: () => {
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
        <SurfaceCard className="mb-6 p-5">
          <Text className="text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
            {t('editProfile.subtitle')}
          </Text>
        </SurfaceCard>

        <ControlledProfilePhotoInput<EditProfileFormValues>
          choosePhotoLabel={t('editProfile.profilePhoto.chooseFromLibrary')}
          control={control}
          helperText={t('editProfile.profilePhoto.helper')}
          isBusy={saveProfileMutation.isPending}
          label={t('editProfile.profilePhoto.label')}
          name="profilePhoto"
          onChoosePhoto={pickImageFromLibrary}
          onRemovePhoto={markPhotoForRemoval}
          onTakePhoto={capturePhoto}
          removePhotoLabel={t('editProfile.profilePhoto.remove')}
          takePhotoLabel={t('editProfile.profilePhoto.takePhoto')}
          testIDPrefix="edit-profile-photo"
        />

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
                    accessibilityHint={t('editProfile.memberSincePlaceholder')}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
