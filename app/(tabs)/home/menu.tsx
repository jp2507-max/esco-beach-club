import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  MenuContentDataProvider,
  useMenuContentData,
} from '@/providers/DataProvider';
import { Badge, Card } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import {
  type MenuCategoryKey,
  type MenuItemKey,
  useMenuTranslation,
} from '@/src/lib/i18n/use-menu-translation';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

type MenuItem = {
  descriptionKey: MenuItemKey;
  id: string;
  image: string;
  nameKey: MenuItemKey;
  price: string;
  tagKey?: MenuItemKey;
};

type MenuCategory = {
  items: MenuItem[];
  key: string;
  labelKey: MenuCategoryKey;
};

const MENU_DATA: MenuCategory[] = [
  {
    key: 'cocktails',
    labelKey: 'categories.cocktails',
    items: [
      {
        id: 'c1',
        nameKey: 'items.c1.name',
        descriptionKey: 'items.c1.description',
        price: '$18',
        image:
          'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=300&fit=crop',
        tagKey: 'items.c1.tag',
      },
      {
        id: 'c2',
        nameKey: 'items.c2.name',
        descriptionKey: 'items.c2.description',
        price: '$22',
        image:
          'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=300&h=300&fit=crop',
      },
      {
        id: 'c3',
        nameKey: 'items.c3.name',
        descriptionKey: 'items.c3.description',
        price: '$16',
        image:
          'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&h=300&fit=crop',
        tagKey: 'items.c3.tag',
      },
      {
        id: 'c4',
        nameKey: 'items.c4.name',
        descriptionKey: 'items.c4.description',
        price: '$24',
        image:
          'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=300&h=300&fit=crop',
      },
    ],
  },
  {
    key: 'food',
    labelKey: 'categories.food',
    items: [
      {
        id: 'f1',
        nameKey: 'items.f1.name',
        descriptionKey: 'items.f1.description',
        price: '$32',
        image:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
        tagKey: 'items.f1.tag',
      },
      {
        id: 'f2',
        nameKey: 'items.f2.name',
        descriptionKey: 'items.f2.description',
        price: '$28',
        image:
          'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&h=300&fit=crop',
      },
      {
        id: 'f3',
        nameKey: 'items.f3.name',
        descriptionKey: 'items.f3.description',
        price: '$36',
        image:
          'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=300&h=300&fit=crop',
      },
      {
        id: 'f4',
        nameKey: 'items.f4.name',
        descriptionKey: 'items.f4.description',
        price: '$22',
        image:
          'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=300&h=300&fit=crop',
      },
    ],
  },
  {
    key: 'wine',
    labelKey: 'categories.wine',
    items: [
      {
        id: 'w1',
        nameKey: 'items.w1.name',
        descriptionKey: 'items.w1.description',
        price: '$380',
        image:
          'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
        tagKey: 'items.w1.tag',
      },
      {
        id: 'w2',
        nameKey: 'items.w2.name',
        descriptionKey: 'items.w2.description',
        price: '$14',
        image:
          'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300&h=300&fit=crop',
      },
      {
        id: 'w3',
        nameKey: 'items.w3.name',
        descriptionKey: 'items.w3.description',
        price: '$28',
        image:
          'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop',
      },
    ],
  },
  {
    key: 'hookah',
    labelKey: 'categories.hookah',
    items: [
      {
        id: 'h1',
        nameKey: 'items.h1.name',
        descriptionKey: 'items.h1.description',
        price: '$35',
        image:
          'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=300&fit=crop',
      },
      {
        id: 'h2',
        nameKey: 'items.h2.name',
        descriptionKey: 'items.h2.description',
        price: '$40',
        image:
          'https://images.unsplash.com/photo-1534294668821-28a3054f4256?w=300&h=300&fit=crop',
        tagKey: 'items.h2.tag',
      },
      {
        id: 'h3',
        nameKey: 'items.h3.name',
        descriptionKey: 'items.h3.description',
        price: '$42',
        image:
          'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=300&h=300&fit=crop',
      },
    ],
  },
];

type MenuItemRowProps = {
  item: MenuItem;
  tMenu: (key: MenuItemKey) => string;
};

function MenuItemRow({ item, tMenu }: MenuItemRowProps): React.JSX.Element {
  return (
    <Card
      className="mb-3.5 flex-row items-center rounded-[18px] p-3"
      testID={`menu-item-${item.id}`}
    >
      <Image
        className="size-20 rounded-[14px]"
        contentFit="cover"
        recyclingKey={`menu-item-${item.id}`}
        source={{ uri: item.image }}
      />
      <View className="ml-3.5 flex-1">
        <View className="mb-1 flex-row items-center">
          <Text
            className="shrink text-base font-bold text-text dark:text-text-primary-dark"
            numberOfLines={1}
          >
            {tMenu(item.nameKey)}
          </Text>
          {item.tagKey ? (
            <Badge
              className="ml-2 rounded-md px-2 py-0.75"
              label={tMenu(item.tagKey)}
              labelClassName="text-[10px] font-bold tracking-[0.3px]"
              tone="primary"
            />
          ) : null}
        </View>
        <Text
          className="mb-1.5 text-xs leading-4.25 text-text-secondary dark:text-text-secondary-dark"
          numberOfLines={2}
        >
          {tMenu(item.descriptionKey)}
        </Text>
        <Text className="text-[17px] font-extrabold text-secondary dark:text-secondary-bright">
          {item.price}
        </Text>
      </View>
    </Card>
  );
}

const getTabStyles = (active: boolean, isDark: boolean) => {
  if (active) {
    return {
      backgroundColor: isDark ? Colors.textPrimaryDark : Colors.text,
      borderColor: isDark ? Colors.textPrimaryDark : Colors.text,
      color: isDark ? Colors.darkBg : '#fff',
    };
  }
  return {
    backgroundColor: isDark ? Colors.darkBgCard : Colors.surface,
    borderColor: isDark ? Colors.darkBorder : Colors.border,
    color: isDark ? Colors.textSecondaryDark : Colors.textSecondary,
  };
};

function MenuScreenContent(): React.JSX.Element {
  const tMenu = useMenuTranslation();
  const isDark = useColorScheme() === 'dark';
  const [activeCategory, setActiveCategory] = useState<string>('cocktails');
  const { contentStyle } = useScreenEntry();
  const { menuCategories: menuCategoryRecords, menuItems: menuItemRecords } =
    useMenuContentData();

  const resolvedCategories = useMemo<MenuCategory[]>(() => {
    if (menuCategoryRecords.length === 0 || menuItemRecords.length === 0) {
      return MENU_DATA;
    }

    return menuCategoryRecords.map((category) => ({
      key: category.key,
      labelKey: category.label_key as MenuCategoryKey,
      items: menuItemRecords
        .filter((item) => item.category_key === category.key)
        .map((item) => ({
          descriptionKey: item.description_key as MenuItemKey,
          id: item.id,
          image: item.image,
          nameKey: item.name_key as MenuItemKey,
          price: item.price,
          tagKey: item.tag_key as MenuItemKey | undefined,
        })),
    }));
  }, [menuCategoryRecords, menuItemRecords]);

  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  useEffect(() => {
    const categoryExists = resolvedCategories.some(
      (category) => category.key === activeCategoryRef.current
    );
    if (resolvedCategories.length > 0 && !categoryExists) {
      setActiveCategory(resolvedCategories[0].key);
    }
  }, [resolvedCategories]);

  const currentItems = useMemo(
    () => resolvedCategories.find((c) => c.key === activeCategory)?.items ?? [],
    [activeCategory, resolvedCategories]
  );

  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 18 }),
    []
  );

  const renderMenuItem = useCallback(
    ({ item }: ListRenderItemInfo<MenuItem>): React.JSX.Element => (
      <MenuItemRow item={item} tMenu={tMenu} />
    ),
    [tMenu]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <View className="border-b border-border pt-3 dark:border-dark-border">
        <ScrollView
          contentContainerClassName="gap-1.5 px-4 pb-3"
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        >
          {resolvedCategories.map((cat) => {
            const active = activeCategory === cat.key;
            const tabStyles = getTabStyles(active, isDark);

            return (
              <Pressable
                accessibilityRole="button"
                key={cat.key}
                className="rounded-full px-5 py-2.5"
                onPress={() => setActiveCategory(cat.key)}
                style={{
                  backgroundColor: tabStyles.backgroundColor,
                  borderColor: tabStyles.borderColor,
                  borderWidth: 1.5,
                }}
                testID={`tab-${cat.key}`}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: tabStyles.color }}
                >
                  {tMenu(cat.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Animated.View className="flex-1" style={contentStyle}>
        <FlashList
          contentContainerStyle={listContentContainerStyle}
          data={currentItems}
          keyExtractor={(item) => item.id}
          renderItem={renderMenuItem}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}

export default function MenuScreen(): React.JSX.Element {
  return (
    <MenuContentDataProvider>
      <MenuScreenContent />
    </MenuContentDataProvider>
  );
}
