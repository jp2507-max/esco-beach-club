import DateTimePicker from '@react-native-community/datetimepicker';
import { type ReactNode, useState } from 'react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Pressable, Text, View } from '@/src/tw';

type IconProps = {
  color: string;
  size: number;
};

type ControlledDateInputProps<TFieldValues extends FieldValues> = {
  containerClassName?: string;
  control: Control<TFieldValues, unknown, unknown>;
  icon?: (props: IconProps) => ReactNode;
  label?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  name: FieldPath<TFieldValues>;
  placeholder?: string;
  testID?: string;
};

function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';

  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;

  return `${day}.${month}.${year}`;
}

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

  return new Date(2000, 0, 1);
}

const MIN_AGE_YEARS = 16;
const DEFAULT_MIN_YEAR = 1920;

function getDefaultMaxDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear() - MIN_AGE_YEARS, now.getMonth(), now.getDate());
}

function getDefaultMinDate(): Date {
  return new Date(DEFAULT_MIN_YEAR, 0, 1);
}

export function ControlledDateInput<TFieldValues extends FieldValues>({
  containerClassName,
  control,
  icon,
  label,
  maximumDate,
  minimumDate,
  name,
  placeholder,
  testID,
}: ControlledDateInputProps<TFieldValues>): ReactNode {
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const iconColor =
    colorScheme === 'dark' ? Colors.textMutedDark : Colors.textLight;
  const placeholderColor =
    colorScheme === 'dark' ? Colors.textMutedDark : Colors.textLight;

  const resolvedMaxDate = maximumDate ?? getDefaultMaxDate();
  const resolvedMinDate = minimumDate ?? getDefaultMinDate();

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, value },
        fieldState: { error, invalid },
      }) => {
        const stringValue = typeof value === 'string' ? value : '';
        const displayValue = formatDateForDisplay(stringValue);
        const dateValue = stringValue
          ? parseDateFromISO(stringValue)
          : resolvedMaxDate;

        function handleDateChange(
          _event: unknown,
          selectedDate: Date | undefined
        ): void {
          if (Platform.OS === 'android') {
            setIsPickerVisible(false);
          }

          if (selectedDate) {
            onChange(formatDateToISO(selectedDate));
          }
        }

        function handleConfirm(): void {
          setIsPickerVisible(false);
        }

        return (
          <>
            <Pressable
              accessibilityRole="button"
              className={cn(
                'mb-3 flex-row items-center rounded-2xl border border-border bg-background px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card',
                invalid && 'border-danger dark:border-error-dark',
                containerClassName
              )}
              onPress={() => setIsPickerVisible(true)}
              testID={testID}
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
                <Text
                  className={cn(
                    'min-h-[24px] text-[15px] font-semibold',
                    displayValue
                      ? 'text-text dark:text-text-primary-dark'
                      : 'text-text-muted dark:text-text-muted-dark'
                  )}
                  style={
                    !displayValue ? { color: placeholderColor } : undefined
                  }
                >
                  {displayValue || placeholder || ''}
                </Text>
                {error?.message ? (
                  <Text className="mt-1 text-xs font-medium text-danger dark:text-error-dark">
                    {t(error.message as never)}
                  </Text>
                ) : null}
              </View>
            </Pressable>

            {Platform.OS === 'ios' ? (
              <Modal
                animationType="slide"
                transparent
                visible={isPickerVisible}
                onRequestClose={handleConfirm}
              >
                <Pressable
                  className="flex-1"
                  onPress={handleConfirm}
                >
                  <View className="flex-1" />
                  <View className="rounded-t-3xl bg-white pb-8 dark:bg-dark-bg-card">
                    <View className="flex-row items-center justify-between border-b border-border/50 px-5 py-3 dark:border-dark-border/50">
                      <View className="w-16" />
                      <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                        {label ?? ''}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        className="w-16 items-end"
                        onPress={handleConfirm}
                        testID={testID ? `${testID}-done` : undefined}
                      >
                        <Text className="text-[16px] font-bold text-primary dark:text-primary-bright">
                          {t('done')}
                        </Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      display="spinner"
                      maximumDate={resolvedMaxDate}
                      minimumDate={resolvedMinDate}
                      mode="date"
                      onChange={handleDateChange}
                      testID={testID ? `${testID}-picker` : undefined}
                      value={dateValue}
                    />
                  </View>
                </Pressable>
              </Modal>
            ) : null}

            {Platform.OS === 'android' && isPickerVisible ? (
              <DateTimePicker
                display="default"
                maximumDate={resolvedMaxDate}
                minimumDate={resolvedMinDate}
                mode="date"
                onChange={handleDateChange}
                testID={testID ? `${testID}-picker` : undefined}
                value={dateValue}
              />
            ) : null}
          </>
        );
      }}
    />
  );
}
