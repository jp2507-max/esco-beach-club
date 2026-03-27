import { X } from 'lucide-react-native';
import React from 'react';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Pressable, Text, View } from '@/src/tw';

export type ModalHeaderTitleAlign = 'center' | 'left';
export type ModalHeaderClosePosition = 'left' | 'right';

export type ModalHeaderProps = {
  className?: string;
  closeButtonClassName?: string;
  closePosition?: ModalHeaderClosePosition;
  closeTestID?: string;
  onClose: () => void;
  subtitle?: string;
  title: string;
  titleAlign?: ModalHeaderTitleAlign;
};

function CloseButton({
  className,
  onClose,
  testID,
}: {
  className?: string;
  onClose: () => void;
  testID?: string;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'size-10 items-center justify-center rounded-full bg-sand dark:bg-dark-bg-card',
        className
      )}
      onPress={onClose}
      testID={testID}
    >
      <X color={Colors.text} size={20} />
    </Pressable>
  );
}

function HeaderCopy({
  subtitle,
  title,
  titleAlign,
}: {
  subtitle?: string;
  title: string;
  titleAlign: ModalHeaderTitleAlign;
}): React.JSX.Element {
  const textAlignClass =
    titleAlign === 'center' ? 'items-center' : 'items-start';

  return (
    <View className={cn('flex-1 px-2', textAlignClass)}>
      <Text
        className={cn(
          'text-2xl font-extrabold text-text dark:text-text-primary-dark',
          titleAlign === 'center' ? 'text-center' : undefined
        )}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className={cn(
            'mt-0.5 text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark',
            titleAlign === 'center' ? 'text-center' : undefined
          )}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function ModalHeader({
  className,
  closeButtonClassName,
  closePosition = 'right',
  closeTestID,
  onClose,
  subtitle,
  title,
  titleAlign = 'left',
}: ModalHeaderProps): React.JSX.Element {
  const closeButton = (
    <CloseButton
      className={closeButtonClassName}
      onClose={onClose}
      testID={closeTestID}
    />
  );

  if (titleAlign === 'center') {
    return (
      <View className={cn('flex-row items-center px-5 py-4', className)}>
        {closePosition === 'left' ? closeButton : <View className="size-10" />}
        <HeaderCopy subtitle={subtitle} title={title} titleAlign={titleAlign} />
        {closePosition === 'right' ? closeButton : <View className="size-10" />}
      </View>
    );
  }

  return (
    <View className={cn('flex-row items-center px-5 py-4', className)}>
      {closePosition === 'left' ? closeButton : null}
      <HeaderCopy subtitle={subtitle} title={title} titleAlign={titleAlign} />
      {closePosition === 'right' ? closeButton : null}
    </View>
  );
}
