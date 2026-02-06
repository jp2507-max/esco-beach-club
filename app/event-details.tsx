import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Crown,
  Star,
  UserCheck,
  PartyPopper,
  Share2,
  Heart,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useEventById } from '@/providers/DataProvider';

interface PriceTier {
  label: string;
  price: string;
  highlight: boolean;
  icon: React.ElementType;
  perks: string[];
}

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const foundEvent = useEventById(id);

  const event = foundEvent ?? {
    id: id ?? '',
    title: 'Event',
    description: null,
    time: '',
    date: '',
    day_label: null,
    location: '',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
    attendees: 0,
    price: '$0',
    badge: null,
    badge_color: null,
    featured: false,
    category: null,
    vip_price: null,
    member_price: null,
    guest_price: null,
    created_at: '',
  };

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, [headerOpacity, fadeAnim, slideAnim]);

  const priceTiers: PriceTier[] = [
    {
      label: 'VIP',
      price: event.vip_price ?? '$85',
      highlight: true,
      icon: Crown,
      perks: ['Priority seating', 'Welcome drink', 'Backstage access'],
    },
    {
      label: 'Member',
      price: event.member_price ?? event.price ?? '$45',
      highlight: false,
      icon: Star,
      perks: ['Reserved area', 'Complimentary snacks'],
    },
    {
      label: 'Guest',
      price: event.guest_price ?? '$65',
      highlight: false,
      icon: UserCheck,
      perks: ['General admission', 'Cash bar'],
    },
  ];

  const handleBook = () => {
    Alert.alert(
      'Booking Confirmed! 🎉',
      `You're all set for "${event.title}" on ${event.date}.\n\nA confirmation has been sent to your email.`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroSection, { opacity: headerOpacity }]}>
        <Image
          source={{ uri: event.image }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.4, 1]}
          style={styles.heroOverlay}
        />

        <View style={[styles.heroNav, { top: insets.top + 8 }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} testID="back-btn">
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.navBtn}>
              <Share2 size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn}>
              <Heart size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{event.badge ?? ''}</Text>
        </View>

        <View style={styles.heroInfo}>
          <Text style={styles.heroTitle}>{event.title}</Text>
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Calendar size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>{event.date}</Text>
            </View>
            <View style={styles.heroMetaDot} />
            <View style={styles.heroMetaItem}>
              <Clock size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>{event.time}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <MapPin size={16} color={Colors.secondary} />
              <Text style={styles.infoChipText}>{event.location}</Text>
            </View>
            <View style={styles.infoChip}>
              <Users size={16} color={Colors.primary} />
              <Text style={styles.infoChipText}>{event.attendees} attending</Text>
            </View>
          </View>

          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.descText}>
              Join us for an unforgettable evening at {event.location}. {event.description || 'Experience the best of Esco Life with live entertainment, premium drinks, and an incredible atmosphere.'} Perfect for making memories with friends and meeting new people.
            </Text>
          </View>

          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose Your Experience</Text>
            <Text style={styles.pricingSub}>Select a tier that fits your vibe</Text>

            {priceTiers.map((tier) => (
              <View
                key={tier.label}
                style={[
                  styles.priceTierCard,
                  tier.highlight && styles.priceTierHighlight,
                ]}
              >
                {tier.highlight && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.tierHeader}>
                  <View style={styles.tierLeft}>
                    <View style={[styles.tierIcon, tier.highlight && styles.tierIconHighlight]}>
                      <tier.icon size={20} color={tier.highlight ? '#fff' : Colors.secondary} />
                    </View>
                    <View>
                      <Text style={[styles.tierLabel, tier.highlight && styles.tierLabelHighlight]}>
                        {tier.label}
                      </Text>
                      <Text style={styles.tierPerPerson}>per person</Text>
                    </View>
                  </View>
                  <Text style={[styles.tierPrice, tier.highlight && styles.tierPriceHighlight]}>
                    {tier.price}
                  </Text>
                </View>

                <View style={styles.tierDivider} />

                {tier.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <View style={[styles.perkDot, tier.highlight && styles.perkDotHighlight]} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.privateBanner}
            activeOpacity={0.85}
            onPress={() => router.push('/private-event')}
            testID="private-party-link"
          >
            <View style={styles.privateBannerIcon}>
              <PartyPopper size={20} color={Colors.secondary} />
            </View>
            <View style={styles.privateBannerContent}>
              <Text style={styles.privateBannerTitle}>Plan a Private Party instead?</Text>
              <Text style={styles.privateBannerSub}>Birthdays, corporate events & more</Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomFromLabel}>From</Text>
          <Text style={styles.bottomPrice}>{event.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={handleBook}
          activeOpacity={0.85}
          testID="book-now-btn"
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    height: 320,
    position: 'relative' as const,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroNav: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 10,
  },
  heroBadge: {
    position: 'absolute' as const,
    top: 100,
    right: 16,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  heroInfo: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroMetaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
  },
  heroMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  descSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  pricingSection: {
    marginBottom: 24,
  },
  pricingSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  priceTierCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceTierHighlight: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFF5F8',
  },
  recommendedBadge: {
    position: 'absolute' as const,
    top: -10,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.tealLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierIconHighlight: {
    backgroundColor: Colors.primary,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tierLabelHighlight: {
    color: Colors.primary,
  },
  tierPerPerson: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  tierPrice: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  tierPriceHighlight: {
    color: Colors.primary,
  },
  tierDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  perkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  perkDotHighlight: {
    backgroundColor: Colors.primary,
  },
  perkText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  privateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tealLight + '25',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '20',
    gap: 14,
  },
  privateBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary + '20',
  },
  privateBannerContent: {
    flex: 1,
  },
  privateBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  privateBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomLeft: {},
  bottomFromLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 36,
    paddingVertical: 16,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
