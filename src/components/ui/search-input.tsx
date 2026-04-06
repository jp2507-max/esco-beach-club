import { Search, X } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TextInput as RNTextInputType } from 'react-native';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Pressable, TextInput, View } from '@/src/tw';

export type SearchInputProps = {
  className?: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID?: string;
};

/**
 * Lightweight inline search bar that replaces native Stack.SearchBar.
 * Styled to match the app's surface-card aesthetic with proper dark mode support.
 */
export function SearchInput({
  className,
  onChangeText,
  placeholder,
  testID = 'search-input',
}: SearchInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputRef = useRef<RNTextInputType>(null);
  const [value, setValue] = useState('');

  const handleChangeText = useCallback(
    (text: string): void => {
      setValue(text);
      onChangeText(text);
    },
    [onChangeText]
  );

  const handleClear = useCallback((): void => {
    setValue('');
    onChangeText('');
    inputRef.current?.blur();
  }, [onChangeText]);

  return (
    <View
      className={cn(
        'mx-5 flex-row items-center rounded-2xl border border-border bg-white px-3.5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card',
        className
      )}
    >
      <Search
        color={isDark ? Colors.textMutedDark : Colors.textMuted}
        size={18}
      />
      <TextInput
        accessibilityHint={t('accessibility.textInputHint')}
        accessibilityLabel={t('accessibility.textInputDefault')}
        ref={inputRef}
        autoCapitalize="none"
        autoCorrect={false}
        className="ml-2.5 flex-1 text-[15px] font-medium text-text dark:text-text-primary-dark"
        clearButtonMode="never"
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? Colors.textMutedDark : Colors.textMuted}
        returnKeyType="search"
        testID={testID}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityHint={t('searchInput.clearHint')}
          accessibilityLabel={t('searchInput.clearLabel')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleClear}
          testID={`${testID}-clear`}
        >
          <View className="size-5 items-center justify-center rounded-full bg-text-muted/20 dark:bg-text-muted-dark/20">
            <X
              color={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
              size={12}
            />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
