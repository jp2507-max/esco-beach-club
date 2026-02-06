import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  tag?: string;
}

interface MenuCategory {
  key: string;
  label: string;
  items: MenuItem[];
}

const MENU_DATA: MenuCategory[] = [
  {
    key: 'cocktails',
    label: 'Cocktails',
    items: [
      { id: 'c1', name: 'Esco Sunset', description: 'Passion fruit, rum, lime, topped with prosecco & edible flowers', price: '$18', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=300&fit=crop', tag: 'Signature' },
      { id: 'c2', name: 'Tokyo Drift', description: 'Japanese whisky, yuzu, shiso leaf, ginger foam', price: '$22', image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=300&h=300&fit=crop' },
      { id: 'c3', name: 'Velvet Rose', description: 'Gin, rose water, lychee, elderflower tonic', price: '$16', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&h=300&fit=crop', tag: 'Popular' },
      { id: 'c4', name: 'Smoky Old Fashioned', description: 'Bourbon, demerara, angostura, orange peel, smoked tableside', price: '$24', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=300&h=300&fit=crop' },
    ],
  },
  {
    key: 'food',
    label: 'Food',
    items: [
      { id: 'f1', name: 'Truffle Wagyu Sliders', description: 'A5 wagyu, truffle aioli, brioche bun, micro greens', price: '$32', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop', tag: 'Chef\'s Pick' },
      { id: 'f2', name: 'Tuna Tartare', description: 'Bluefin tuna, avocado mousse, sesame crisp, ponzu', price: '$28', image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&h=300&fit=crop' },
      { id: 'f3', name: 'Lobster Tempura', description: 'Crispy lobster tail, wasabi mayo, pickled ginger', price: '$36', image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=300&h=300&fit=crop' },
      { id: 'f4', name: 'Mezze Platter', description: 'Hummus, baba ganoush, falafel, warm pita, za\'atar', price: '$22', image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=300&h=300&fit=crop' },
    ],
  },
  {
    key: 'wine',
    label: 'Wine',
    items: [
      { id: 'w1', name: 'Dom Pérignon 2013', description: 'Champagne, France — Elegant with notes of almond & citrus', price: '$380', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop', tag: 'Premium' },
      { id: 'w2', name: 'Cloudy Bay Sauvignon', description: 'Marlborough, NZ — Crisp, tropical, refreshing', price: '$14', image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300&h=300&fit=crop' },
      { id: 'w3', name: 'Barolo Riserva 2016', description: 'Piedmont, Italy — Full-bodied, cherry, leather notes', price: '$28', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop' },
    ],
  },
  {
    key: 'hookah',
    label: 'Hookah',
    items: [
      { id: 'h1', name: 'Double Apple Classic', description: 'Traditional blend with a sweet anise finish', price: '$35', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=300&fit=crop' },
      { id: 'h2', name: 'Esco Cloud Mix', description: 'Blueberry, mint & grape — our house special', price: '$40', image: 'https://images.unsplash.com/photo-1534294668821-28a3054f4256?w=300&h=300&fit=crop', tag: 'House Special' },
      { id: 'h3', name: 'Tropical Paradise', description: 'Mango, passion fruit & coconut with ice base', price: '$42', image: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=300&h=300&fit=crop' },
    ],
  },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('cocktails');
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  const currentItems = MENU_DATA.find((c) => c.key === activeCategory)?.items ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="menu-back">
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {MENU_DATA.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveCategory(cat.key)}
                testID={`tab-${cat.key}`}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeIn }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {currentItems.map((item) => (
            <View key={item.id} style={styles.menuCard} testID={`menu-item-${item.id}`}>
              <Image source={{ uri: item.image }} style={styles.menuImage} contentFit="cover" />
              <View style={styles.menuInfo}>
                <View style={styles.menuNameRow}>
                  <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
                  {item.tag ? (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.menuPrice}>{item.price}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 14,
  },
  menuNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  tagBadge: {
    backgroundColor: Colors.primary + '18',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  menuDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  menuPrice: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.secondary,
  },
});
