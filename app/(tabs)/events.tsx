import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Heart,
  PartyPopper,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { mockEvents, mockUser, eventCategories } from '@/mocks/user';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<string>('All Events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const router = useRouter();

  const featuredEvent = mockEvents.find((e) => e.featured);
  const listEvents = mockEvents.filter((e) => !e.featured);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandLabel}>ESCO LIFE</Text>
            <Text style={styles.title}>Upcoming</Text>
            <Text style={styles.title}>Beach Events</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image source={{ uri: mockUser.avatar }} style={styles.avatarImage} />
            <View style={styles.avatarOnline} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, artists..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {eventCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                activeCategory === cat && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(cat)}
              testID={`cat-${cat}`}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {featuredEvent && (
          <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} testID="featured-event" onPress={() => router.push({ pathname: '/event-details', params: { id: featuredEvent.id } })}>
            <Image
              source={{ uri: featuredEvent.image }}
              style={styles.featuredImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.featuredOverlay}
            />
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{featuredEvent.badge}</Text>
            </View>
            <View style={styles.featuredPriceTag}>
              <Text style={styles.featuredPriceLabel}>PRICE</Text>
              <Text style={styles.featuredPriceValue}>{featuredEvent.price}</Text>
            </View>
            <View style={styles.featuredInfo}>
              <View style={styles.featuredDateRow}>
                <Calendar size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.featuredDateText}>
                  {featuredEvent.date} • {featuredEvent.time}
                </Text>
              </View>
              <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
              <Text style={styles.featuredDesc}>{featuredEvent.description}</Text>
            </View>
          </TouchableOpacity>
        )}

        {listEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.listCard}
            activeOpacity={0.8}
            testID={`event-${event.id}`}
            onPress={() => router.push({ pathname: '/event-details', params: { id: event.id } })}
          >
            <Image
              source={{ uri: event.image }}
              style={styles.listImage}
              contentFit="cover"
            />
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>{event.title}</Text>
              <View style={styles.listDateRow}>
                <Calendar size={12} color={Colors.textSecondary} />
                <Text style={styles.listDateText}>
                  {event.date} • {event.time}
                </Text>
              </View>
              <View style={[styles.listBadge, { backgroundColor: event.badgeColor + '18' }]}>
                <Text style={[styles.listBadgeText, { color: event.badgeColor }]}>
                  {event.badge}
                </Text>
              </View>
            </View>
            <View style={styles.listRight}>
              <TouchableOpacity style={styles.heartButton}>
                <Heart size={18} color={Colors.textLight} />
              </TouchableOpacity>
              <Text style={styles.listPrice}>{event.price}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.inquiryBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/private-event')}
          testID="private-event-btn"
        >
          <View style={styles.inquiryIconWrap}>
            <PartyPopper size={22} color={Colors.secondary} />
          </View>
          <View style={styles.inquiryContent}>
            <Text style={styles.inquiryTitle}>Plan a Private Party?</Text>
            <Text style={styles.inquirySubtitle}>Birthdays, weddings, corporate — we do it all</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  brandLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 36,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarOnline: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesRow: {
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryTextActive: {
    color: '#fff',
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 260,
    marginBottom: 20,
    backgroundColor: Colors.surface,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  featuredPriceTag: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  featuredPriceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  featuredPriceValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800' as const,
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    padding: 18,
  },
  featuredDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  featuredDateText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  featuredDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400' as const,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  listContent: {
    flex: 1,
    marginLeft: 14,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  listDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  listDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  listBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  listBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  listRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingVertical: 4,
  },
  heartButton: {
    padding: 4,
  },
  listPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  inquiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tealLight + '30',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.secondary + '25',
    gap: 14,
  },
  inquiryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary + '20',
  },
  inquiryContent: {
    flex: 1,
  },
  inquiryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  inquirySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});
