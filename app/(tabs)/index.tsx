import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UtensilsCrossed,
  Wine,
  Clock,
  MapPin,
  Wifi,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useData, useHomeEvents } from '@/providers/DataProvider';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardScale, cardOpacity, fadeIn, slideUp]);

  const { profile, news } = useData();
  const homeEvents = useHomeEvents();

  const userName = profile?.full_name ?? 'Guest';
  const userTier = profile?.tier_label ?? 'Member';
  const userPoints = profile?.points ?? 0;
  const userMaxPoints = profile?.max_points ?? 5000;
  const userAvatar = profile?.avatar_url ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';
  const tierLevel = profile?.tier ?? 'STANDARD';
  const vipStatus = tierLevel === 'VIP' || tierLevel === 'OWNER' ? 'VIP Status' : '';

  const progressWidth = (userPoints / userMaxPoints) * 100;

  const quickActions = [
    { icon: UtensilsCrossed, label: 'Book Table', color: Colors.secondary, route: '/booking-modal' as const },
    { icon: Wine, label: 'Menu', color: Colors.primary, route: '/menu' as const },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bgDecorTop}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer} testID="profile-avatar">
            <Image
              source={{ uri: userAvatar }}
              style={styles.avatarImage}
            />
            <View style={styles.avatarOnline} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.cardWrapper,
            { transform: [{ scale: cardScale }], opacity: cardOpacity },
          ]}
        >
          <LinearGradient
            colors={['#E91E63', '#F06292', '#FF9800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.memberCard}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.cardBrand}>ESCO LIFE</Text>
              <Wifi size={24} color="rgba(255,255,255,0.8)" />
            </View>

            <View style={styles.cardTierRow}>
              <View>
                <Text style={styles.cardTierName}>{userTier}</Text>
                <Text style={styles.cardPointsLabel}>Points Balance</Text>
              </View>
              <Text style={styles.cardVipLabel}>{vipStatus}</Text>
            </View>

            <View style={styles.cardPointsRow}>
              <Text style={styles.cardPointsValue}>{userPoints.toLocaleString()}</Text>
              <Text style={styles.cardPointsMax}>/ {userMaxPoints.toLocaleString()} pts</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
            </View>

            <View style={styles.cardBottomRow}>
              <View>
                <Text style={styles.cardMemberLabel}>MEMBER NAME</Text>
                <Text style={styles.cardMemberName}>{userName}</Text>
              </View>
              <View style={styles.qrMini}>
                <View style={styles.qrGrid}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <View key={i} style={[styles.qrDot, i % 3 === 0 && styles.qrDotFilled]} />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.cardCircleDecor} />
            <View style={styles.cardCircleDecor2} />
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[styles.quickActionsRow, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionPill}
                activeOpacity={0.7}
                testID={`action-${action.label}`}
                onPress={() => router.push(action.route)}
              >
                <action.icon size={18} color={action.color} />
                <Text style={[styles.quickActionText, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View
          style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Happening This Week</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {homeEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              activeOpacity={0.9}
              testID={`event-${event.id}`}
              onPress={() => router.push({ pathname: '/event-details', params: { id: event.id } })}
            >
              <Image
                source={{ uri: event.image }}
                style={styles.eventImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.eventOverlay}
              />
              <View style={styles.eventDayBadge}>
                <Text style={styles.eventDayText}>{event.day_label ?? event.date}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventMeta}>
                  <Clock size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.eventMetaText}>{event.time}</Text>
                  <Text style={styles.eventMetaDot}>·</Text>
                  <MapPin size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.eventMetaText}>{event.location}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.eventArrow} activeOpacity={0.8}>
                <ArrowRight size={18} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest News</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {news.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsCard}
              activeOpacity={0.8}
              testID={`news-${item.id}`}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.newsThumb}
                contentFit="cover"
              />
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.newsSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                <Text style={styles.newsTime}>{item.time_label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

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
  bgDecorTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 180,
    height: 180,
    backgroundColor: '#E91E6310',
    top: -40,
    right: -20,
  },
  blob2: {
    width: 120,
    height: 120,
    backgroundColor: '#00968812',
    top: 30,
    right: 80,
  },
  blob3: {
    width: 100,
    height: 100,
    backgroundColor: '#FF980010',
    top: 10,
    left: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  welcomeLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
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
  cardWrapper: {
    marginBottom: 16,
  },
  memberCard: {
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
  },
  cardTierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTierName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
  },
  cardPointsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500' as const,
    marginTop: 2,
  },
  cardVipLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  cardPointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 8,
  },
  cardPointsValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#fff',
  },
  cardPointsMax: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
    marginLeft: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    marginBottom: 16,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardMemberLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    fontWeight: '600' as const,
  },
  cardMemberName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700' as const,
    marginTop: 3,
  },
  qrMini: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrGrid: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  qrDot: {
    width: 6,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 1,
  },
  qrDotFilled: {
    backgroundColor: '#333',
  },
  quickActionsRow: {
    marginBottom: 24,
  },
  quickActionsScroll: {
    gap: 10,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  eventCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 200,
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  eventDayBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  eventDayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 60,
    padding: 18,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  eventMetaDot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  eventArrow: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCircleDecor: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -30,
  },
  cardCircleDecor2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: 50,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  newsThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  newsContent: {
    flex: 1,
    marginLeft: 14,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  newsSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  newsTime: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
});
