import { useTranslation } from 'react-i18next';

import type menuEn from '@/src/lib/i18n/locales/en/menu';

type MenuItemId = keyof (typeof menuEn)['items'];
type MenuCategoryId = keyof (typeof menuEn)['categories'];

export type MenuItemKey =
  | `items.${MenuItemId}.name`
  | `items.${MenuItemId}.description`
  | `items.${MenuItemId}.tag`;
export type MenuCategoryKey = `categories.${MenuCategoryId}`;
export type MenuKey = MenuItemKey | MenuCategoryKey;

export function useMenuTranslation(): (key: MenuKey) => string {
  const { t } = useTranslation('menu');
  return (key: MenuKey) => t(key as never);
}
