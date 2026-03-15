import React, { useEffect, useMemo, useState } from 'react';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { rmTiming } from '@/src/lib/animations/motion';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';
import { ScrollView, Text, Pressable, View } from '@/src/tw';

type MenuItem = {
  description: string;
  id: string;
  image: string;
  name: string;
  price: string;
  tag?: string;
};

type MenuCategory = {
  items: MenuItem[];
  key: string;
  label: string;
};

const MENU_DATA: MenuCategory[] = [
  {
    key: 'cocktails',
    label: 'Cocktails',
    items: [
      {
        id: 'c1',
        name: 'Esco Sunset',
        description: 'Passion fruit, rum, lime, topped with prosecco & edible flowers',
        price: '$18',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=300&fit=crop',
        tag: 'Signature',
      },
      {
        id: 'c2',
        name: 'Tokyo Drift',
        description: 'Japanese whisky, yuzu, shiso leaf, ginger foam',
        price: '$22',
        image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=300&h=300&fit=crop',
      },
      {
        id: 'c3',
        name: 'Velvet Rose',
        description: 'Gin, rose water, lychee, elderflower tonic',
        price: '$16',
        image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&h=300&fit=crop',
        tag: 'Popular',
      },
      {
        id: 'c4',
        name: 'Smoky Old Fashioned',
        description: 'Bourbon, demerara, angostura, orange peel, smoked tableside',
        price: '$24',
        image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=300&h=300&fit=crop',
      },
    ],
  },
  {
    key: 'food',
    label: 'Food',
    items: [
      {
        id: 'f1',
        name: 'Truffle Wagyu Sliders',
        description: 'A5 wagyu, truffle aioli, brioche bun, micro greens',
        price: '$32',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
        tag: "Chef's Pick",
      },
      {
        id: 'f2',
        name: 'Tuna Tartare',
        description: 'Bluefin tuna, avocado mousse, sesame crisp, ponzu',
        price: '$28',
        image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&h=300&fit=crop',
      },
      {
        id: 'f3',
        name: 'Lobster Tempura',
        description: 'Crispy lobster tail, wasabi mayo, pickled ginger',
        price: '$36',
        image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=300&h=300&fit=crop',
      },
      {
        id: 'f4',
        name: 'Mezze Platter',
        description: "Hummus, baba ganoush, falafel, warm pita, za'atar",
        price: '$22',
        image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=300&h=300&fit=crop',
      },
    ],
  },
  {
    key: 'wine',
    label: 'Wine',
    items: [
      {
        id: 'w1',
        name: 'Dom Pérignon 2013',
        description: 'Champagne, France — Elegant with notes of almond & citrus',
        price: '$380',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
        tag: 'Premium',
      },
      {
        id: 'w2',
        name: 'Cloudy Bay Sauvignon',
        description: 'Marlborough, NZ — Crisp, tropical, refreshing',
        price: '$14',
        image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300&h=300&fit=crop',
      },
      {
        id: 'w3',
        name: 'Barolo Riserva 2016',
        description: 'Piedmont, Italy — Full-bodied, cherry, leather notes',
        price: '$28',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop',
      },
    ],
  },
  {
    key: 'hookah',
    label: 'Hookah',
    items: [
      {
        id: 'h1',
        name: 'Double Apple Classic',
        description: 'Traditional blend with a sweet anise finish',
        price: '$35',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=300&fit=crop',
      },
      {
        id: 'h2',
        name: 'Esco Cloud Mix',
        description: 'Blueberry, mint & grape — our house special',
        price: '$40',
        image: 'https://images.unsplash.com/photo-1534294668821-28a3054f4256?w=300&h=300&fit=crop',
        tag: 'House Special',
      },
      {
        id: 'h3',
        name: 'Tropical Paradise',
        description: 'Mango, passion fruit & coconut with ice base',
        price: '$42',
        image: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=300&h=300&fit=crop',
      },
    ],
  },
];

export default function MenuScreen(): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>('cocktails');
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.set(withTiming(1, rmTiming(400)));
  }, [fade]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
  }));

  const currentItems = useMemo(
    () => MENU_DATA.find((c) => c.key === activeCategory)?.items ?? [],
    [activeCategory]
  );

  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 18 }),
    []
  );

  function renderItem({ item }: ListRenderItemInfo<MenuItem>): React.JSX.Element {
    return (
      <View
        className="mb-3.5 flex-row items-center rounded-[18px] border border-border bg-white p-3 dark:border-dark-border dark:bg-dark-bg-card"
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
              {item.name}
            </Text>
            {item.tag ? (
              <View
                className="ml-2 rounded-md px-2 py-[3px]"
                style={{ backgroundColor: `${Colors.primary}18` }}
              >
                <Text className="text-[10px] font-bold tracking-[0.3px] text-primary">
                  {item.tag}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            className="mb-1.5 text-xs leading-[17px] text-text-secondary dark:text-text-secondary-dark"
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text className="text-[17px] font-extrabold text-secondary">{item.price}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <View className="border-b border-border pt-3 dark:border-dark-border">
        <ScrollView
          contentContainerClassName="gap-1.5 px-4 pb-3"
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        >
          {MENU_DATA.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                className="rounded-full px-5 py-2.5"
                onPress={() => setActiveCategory(cat.key)}
                style={{
                  backgroundColor: active ? Colors.text : Colors.surface,
                  borderColor: active ? Colors.text : Colors.border,
                  borderWidth: 1.5,
                }}
                testID={`tab-${cat.key}`}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: active ? '#fff' : Colors.textSecondary }}
                >
                  {cat.label}
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
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}
