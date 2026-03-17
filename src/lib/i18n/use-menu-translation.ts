import { useTranslation } from 'react-i18next';

export type MenuItemKey =
  | `items.${string}.name`
  | `items.${string}.description`
  | `items.${string}.tag`;
export type MenuCategoryKey = `categories.${string}`;
export type MenuKey = MenuItemKey | MenuCategoryKey;

export function useMenuTranslation(): (key: MenuKey) => string {
  const { t } = useTranslation('menu');
  return (key: MenuKey) => t(key as never);
}
