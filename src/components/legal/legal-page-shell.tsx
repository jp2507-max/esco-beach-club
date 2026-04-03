import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Card } from '@/src/components/ui/card';
import { config } from '@/src/lib/config';
import { Pressable, ScrollView, Text, View } from '@/src/tw';

type LegalSection = {
  bodyKeys: readonly string[];
  titleKey: string;
};

type LegalPageShellProps = {
  ctaHref?: string;
  ctaLabelKey?: string;
  introKey: string;
  sections: readonly LegalSection[];
  titleKey: string;
};

function openUrl(url: string): void {
  void Linking.openURL(url).catch(() => undefined);
}

export function LegalPageShell({
  ctaHref,
  ctaLabelKey,
  introKey,
  sections,
  titleKey,
}: LegalPageShellProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <>
      <Stack.Screen options={{ title: t(titleKey, titleKey) }} />
      <ScrollView className="flex-1 bg-background dark:bg-dark-bg">
        <View className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8">
          <View className="gap-4">
            <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-primary-bright">
              {t('legal.eyebrow')}
            </Text>
            <Text className="text-4xl font-black leading-tight text-text dark:text-text-primary-dark">
              {t(titleKey, titleKey)}
            </Text>
            <Text className="max-w-3xl text-base leading-7 text-text-secondary dark:text-text-secondary-dark">
              {t(introKey, introKey)}
            </Text>
          </View>

          <View className="mt-8 gap-4">
            {sections.map((section) => (
              <Card key={section.titleKey} className="p-5">
                <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
                  {t(section.titleKey, section.titleKey)}
                </Text>
                <View className="mt-3 gap-3">
                  {section.bodyKeys.map((bodyKey) => (
                    <Text
                      key={bodyKey}
                      className="text-sm leading-7 text-text-secondary dark:text-text-secondary-dark"
                    >
                      {t(bodyKey, bodyKey)}
                    </Text>
                  ))}
                </View>
              </Card>
            ))}
          </View>

          <Card className="mt-8 p-5">
            <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
              {t('legal.contact.title')}
            </Text>
            <Text className="mt-3 text-sm leading-7 text-text-secondary dark:text-text-secondary-dark">
              {t('legal.contact.description', {
                email: config.contact.supportEmail,
              })}
            </Text>

            <View className="mt-4 gap-3">
              <Pressable
                accessibilityRole="link"
                className="rounded-2xl border border-border px-4 py-3 dark:border-dark-border"
                onPress={() => openUrl(`mailto:${config.contact.supportEmail}`)}
              >
                <Text className="text-sm font-semibold text-text dark:text-text-primary-dark">
                  {config.contact.supportEmail}
                </Text>
              </Pressable>

              {ctaHref && ctaLabelKey ? (
                <Pressable
                  accessibilityRole="link"
                  className="rounded-2xl bg-primary px-4 py-3 dark:bg-primary-bright"
                  onPress={() => openUrl(ctaHref)}
                >
                  <Text className="text-sm font-semibold text-white">
                    {t(ctaLabelKey, ctaLabelKey)}
                  </Text>
                </Pressable>
              ) : null}

              {Platform.OS === 'web' ? (
                <Text className="text-xs leading-6 text-text-muted dark:text-text-muted-dark">
                  {t('legal.hostedOnExpo')}
                </Text>
              ) : null}
            </View>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
