import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapMenuCategory,
  mapMenuItem,
} from '@/src/lib/mappers';

import {
  EMPTY_MENU_CATEGORIES,
  EMPTY_MENU_ITEMS,
  type MenuContentData,
} from './context';

type MenuResourceParams = {
  userId: string;
};

export function useMenuResource(params: MenuResourceParams): MenuContentData {
  const { userId } = params;
  const menuCategoriesQuery = db.useQuery(userId ? { menu_categories: {} } : null);
  const menuItemsQuery = db.useQuery(userId ? { menu_items: {} } : null);

  const menuCategories = useMemo(() => {
    if (!userId) return EMPTY_MENU_CATEGORIES;
    const records = (menuCategoriesQuery.data?.menu_categories ??
      []) as InstantRecord[];
    return records
      .map(mapMenuCategory)
      .filter((category) => category.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [menuCategoriesQuery.data, userId]);

  const menuItems = useMemo(() => {
    if (!userId) return EMPTY_MENU_ITEMS;
    const records = (menuItemsQuery.data?.menu_items ?? []) as InstantRecord[];
    return records
      .map(mapMenuItem)
      .filter((item) => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItemsQuery.data, userId]);

  return useMemo(
    () => ({
      menuCategories,
      menuContentLoading:
        Boolean(userId) &&
        (menuCategoriesQuery.isLoading || menuItemsQuery.isLoading),
      menuItems,
    }),
    [
      menuCategories,
      menuCategoriesQuery.isLoading,
      menuItems,
      menuItemsQuery.isLoading,
      userId,
    ]
  );
}
