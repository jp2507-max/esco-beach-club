import { type ReactNode } from 'react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
  useColorScheme,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Text, TextInput, View } from '@/src/tw';

type IconProps = {
  color: string;
  size: number;
};

type ControlledTextInputProps<TFieldValues extends FieldValues> = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  className?: string;
  containerClassName?: string;
  control: Control<TFieldValues, unknown, unknown>;
  icon?: (props: IconProps) => ReactNode;
  keyboardType?: KeyboardTypeOptions;
  label?: string;
  maxLength?: number;
  multiline?: boolean;
  name: FieldPath<TFieldValues>;
  numberOfLines?: number;
  placeholder?: string;
  returnKeyType?: ReturnKeyTypeOptions;
  rightAdornment?: ReactNode;
  secureTextEntry?: boolean;
  testID?: string;
  textAlignVertical?: 'auto' | 'top' | 'center' | 'bottom';
};

export function ControlledTextInput<TFieldValues extends FieldValues>({
  accessibilityHint,
  accessibilityLabel,
  autoCapitalize,
  autoComplete,
  className,
  containerClassName,
  control,
  icon,
  keyboardType,
  label,
  maxLength,
  multiline,
  name,
  numberOfLines,
  placeholder,
  returnKeyType,
  rightAdornment,
  secureTextEntry,
  testID,
  textAlignVertical,
}: ControlledTextInputProps<TFieldValues>) {
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    label ??
    placeholder ??
    t('accessibility.textInputDefault');
  const fieldForHint = label ?? placeholder;
  const resolvedAccessibilityHint =
    accessibilityHint ??
    (fieldForHint
      ? t('accessibility.textInputHintWithField', {
          field: fieldForHint.toLowerCase(),
        })
      : t('accessibility.textInputHint'));
  const iconColor =
    colorScheme === 'dark' ? Colors.textMutedDark : Colors.textLight;
  const placeholderColor =
    colorScheme === 'dark' ? Colors.textMutedDark : Colors.textLight;

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onBlur, onChange, value },
        fieldState: { invalid },
      }) => (
        <View
          className={cn(
            'mb-3 flex-row items-center rounded-2xl border border-border bg-background px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card',
            invalid && 'border-danger dark:border-error-dark',
            multiline && 'items-start',
            containerClassName
          )}
        >
          {icon ? (
            <View className="mr-3 mt-0.5">
              {icon({ color: iconColor, size: 18 })}
            </View>
          ) : null}
          <View className="flex-1">
            {label ? (
              <Text className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-text-secondary dark:text-text-secondary-dark">
                {label}
              </Text>
            ) : null}
            <TextInput
              accessibilityLabel={resolvedAccessibilityLabel}
              accessibilityHint={resolvedAccessibilityHint}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              className={cn(
                'min-h-[24px] flex-1 p-0 text-[15px] font-semibold text-text dark:text-text-primary-dark',
                multiline && 'min-h-[96px]',
                className
              )}
              keyboardType={keyboardType}
              maxLength={maxLength}
              multiline={multiline}
              numberOfLines={numberOfLines}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={placeholderColor}
              returnKeyType={returnKeyType}
              secureTextEntry={secureTextEntry}
              testID={testID}
              textAlignVertical={textAlignVertical}
              value={typeof value === 'string' ? value : ''}
            />
          </View>
          {rightAdornment ? <View>{rightAdornment}</View> : null}
        </View>
      )}
    />
  );
}
