import { Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { Avatar, Button } from '@/src/components/ui';
import type { ProfilePhotoFieldValue } from '@/src/lib/forms/schemas';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

type ProfilePhotoActionHandler = (
  current: ProfilePhotoFieldValue
) => Promise<ProfilePhotoFieldValue | null>;

type ControlledProfilePhotoInputProps<TFieldValues extends FieldValues> = {
  choosePhotoLabel: string;
  control: Control<TFieldValues, unknown, unknown>;
  helperText?: string;
  isBusy?: boolean;
  label: string;
  name: FieldPath<TFieldValues>;
  removePhotoLabel: string;
  takePhotoLabel: string;
  testIDPrefix?: string;
  onChoosePhoto: ProfilePhotoActionHandler;
  onRemovePhoto: ProfilePhotoActionHandler;
  onTakePhoto: ProfilePhotoActionHandler;
};

function normalizeProfilePhotoFieldValue(
  value: unknown
): ProfilePhotoFieldValue {
  const emptyValue: ProfilePhotoFieldValue = {
    action: 'keep',
    localUri: null,
    mimeType: null,
    previewUri: null,
  };

  if (typeof value !== 'object' || value === null) {
    return emptyValue;
  }

  const maybeValue = value as Record<string, unknown>;

  return {
    action:
      maybeValue.action === 'upload' || maybeValue.action === 'remove'
        ? maybeValue.action
        : 'keep',
    localUri:
      typeof maybeValue.localUri === 'string' ? maybeValue.localUri : null,
    mimeType:
      typeof maybeValue.mimeType === 'string' ? maybeValue.mimeType : null,
    previewUri:
      typeof maybeValue.previewUri === 'string' ? maybeValue.previewUri : null,
  };
}

function renderButtonIcon(icon: ReactNode): ReactNode {
  return <View className="mr-1.5">{icon}</View>;
}

export function ControlledProfilePhotoInput<TFieldValues extends FieldValues>({
  choosePhotoLabel,
  control,
  helperText,
  isBusy = false,
  label,
  name,
  onChoosePhoto,
  onRemovePhoto,
  onTakePhoto,
  removePhotoLabel,
  takePhotoLabel,
  testIDPrefix = 'profile-photo',
}: ControlledProfilePhotoInputProps<TFieldValues>): React.JSX.Element {
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const iconColor =
    colorScheme === 'dark' ? Colors.textPrimaryDark : Colors.text;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const current = normalizeProfilePhotoFieldValue(value);

        async function handleAction(
          runAction: ProfilePhotoActionHandler
        ): Promise<void> {
          if (isBusy) return;
          const nextValue = await runAction(current);
          if (!nextValue) return;
          onChange(nextValue);
        }

        return (
          <View className="mb-4 rounded-2xl border border-border bg-background p-4 dark:border-dark-border dark:bg-dark-bg-card">
            <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-text-secondary dark:text-text-secondary-dark">
              {label}
            </Text>

            {helperText ? (
              <Text className="mb-3 text-sm text-text-secondary dark:text-text-secondary-dark">
                {helperText}
              </Text>
            ) : null}

            <View className="mb-3 items-center">
              <View
                className="size-24 overflow-hidden rounded-full border-2 border-border dark:border-dark-border"
                testID={`${testIDPrefix}-preview`}
              >
                <Avatar className="h-full w-full" uri={current.previewUri} />
              </View>
            </View>

            <View className="gap-2">
              <Button
                className="w-full"
                isLoading={isBusy}
                leftIcon={renderButtonIcon(
                  <Camera color={iconColor} size={16} />
                )}
                onPress={() => {
                  void handleAction(onTakePhoto);
                }}
                size="sm"
                testID={`${testIDPrefix}-take-photo`}
                variant="outline"
              >
                {takePhotoLabel}
              </Button>

              <Button
                className="w-full"
                isLoading={isBusy}
                leftIcon={renderButtonIcon(
                  <ImagePlus color={iconColor} size={16} />
                )}
                onPress={() => {
                  void handleAction(onChoosePhoto);
                }}
                size="sm"
                testID={`${testIDPrefix}-choose-photo`}
                variant="outline"
              >
                {choosePhotoLabel}
              </Button>

              <Button
                className="w-full"
                contentClassName="justify-start"
                isLoading={isBusy}
                leftIcon={renderButtonIcon(
                  <Trash2 color={Colors.danger} size={16} />
                )}
                onPress={() => {
                  void handleAction(onRemovePhoto);
                }}
                size="sm"
                testID={`${testIDPrefix}-remove-photo`}
                textClassName="text-danger dark:text-error-dark"
                variant="ghost"
              >
                {removePhotoLabel}
              </Button>
            </View>

            {error?.message ? (
              <Text
                className={cn(
                  'mt-2 text-xs font-medium text-danger dark:text-error-dark'
                )}
              >
                {t(error.message as never)}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}
