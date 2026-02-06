
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Star,
  QrCode,
  Settings,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  ChevronRight,
  Users,
  Crown,
  Headphones,
  Ticket,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { mockUser } from '@/mocks/user';

const menuItems = [
  { icon: Users, label: 'Invite & Earn', color: Colors.primary, route: '/invite' as const },
  { icon: Star, label: 'Rate Us', color: '#FFB300', route: '/rate-us' as const },
  { icon: CreditCard, label: 'Membership', color: Colors.primary, route: null },
  { icon: Gift, label: 'Rewards', color: '#FF9800', route: null },
  { icon: Settings, label: 'Settings', color: Colors.secondary, route: null },
  { icon: HelpCircle, label: 'Help & Support', color: '#7C4DFF', route: null },
  { icon: LogOut, label: 'Log Out', color: '#EF5350', route: null },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const [showVoucher, setShowVoucher] = useState(!mockUser.hasSeenWelcomeVoucher);
  const voucherScale = useRef(new Animated.Value(0.9)).current;
  const voucherOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showVoucher) {
      Animated.parallel([
        Animated.spring(voucherScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(voucherOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [showVoucher, voucherScale, voucherOpacity]);

  const isVIP = mockUser.tierLevel === 'VIP' || mockUser.tierLevel === 'OWNER';

  const handleConcierge = () => {
    const whatsappUrl = 'https://wa.me/1234567890?text=Hi%20Esco%20Life%20VIP%20Concierge';
    Linking.openURL(whatsappUrl).catch(() => console.log('Could not open WhatsApp'));
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@escolife.com').catch(() => console.log('Could not open mail'));
  };

  const earnedProgress = (mockUser.earned / 2000) * 100;
  const savedProgress = (mockUser.saved / 300) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bgBlur}>
        <View style={[styles.bgBlob, styles.bgBlob1]} />
        <View style={[styles.bgBlob, styles.bgBlob2]} />
        <View style={[styles.bgBlob, styles.bgBlob3]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerAvatar}>
              <Image source={{ uri: mockUser.avatar }} style={styles.headerAvatarImg} />
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.headerName}>{mockUser.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn} testID="notification-bell">
            <Bell size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tierBadgeRow}>
          <View style={styles.tierBadge}>
            <Star size={14} color={Colors.primary} />
            <Text style={styles.tierBadgeText}>{mockUser.tierBadge}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.accessCard,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          <View style={styles.accessCardInner}>
            <View style={styles.accessHeader}>
              <Text style={styles.accessBrand}>
                Esco<Text style={styles.accessBrandAccent}>Life</Text>
              </Text>
              <Text style={styles.accessPassLabel}>ACCESS PASS</Text>
            </View>

            <View style={styles.qrWrapper}>
              <LinearGradient
                colors={['#E91E63', '#9C27B0', '#00BCD4']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.qrBorder}
              >
                <View style={styles.qrInner}>
                  <QrCode size={100} color={Colors.text} />
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.scanText}>Scan at table for 10% off</Text>
            <Text style={styles.refText}>Ref: {mockUser.memberId}</Text>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statRing}>
              <View style={[styles.statRingTrack, { borderColor: Colors.primary + '25' }]}>
                <View style={[styles.statRingProgress, { borderColor: Colors.primary, borderTopColor: 'transparent', transform: [{ rotate: `${(earnedProgress / 100) * 360}deg` }] }]} />
              </View>
            </View>
            <Text style={styles.statLabel}>EARNED</Text>
            <Text style={styles.statValue}>{mockUser.earned.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statRing}>
              <View style={[styles.statRingTrack, { borderColor: Colors.secondary + '25' }]}>
                <View style={[styles.statRingProgress, { borderColor: Colors.secondary, borderTopColor: 'transparent', transform: [{ rotate: `${(savedProgress / 100) * 360}deg` }] }]} />
              </View>
            </View>
            <Text style={styles.statLabel}>SAVED</Text>
            <Text style={styles.statValue}>${mockUser.saved}</Text>
          </View>
        </View>

        {showVoucher && (
          <Animated.View style={[styles.voucherCard, { transform: [{ scale: voucherScale }], opacity: voucherOpacity }]}>
            <View style={styles.voucherInner}>
              <View style={styles.voucherCircleLeft} />
              <View style={styles.voucherCircleRight} />
              <View style={styles.voucherHeader}>
                <Ticket size={22} color={Colors.primary} />
                <Text style={styles.voucherBadge}>WELCOME GIFT</Text>
              </View>
              <Text style={styles.voucherDiscount}>10% OFF</Text>
              <Text style={styles.voucherLabel}>Your First Visit</Text>
              <View style={styles.voucherDivider} />
              <Text style={styles.voucherCode}>CODE: WELCOME10</Text>
              <Text style={styles.voucherExpiry}>Valid for 30 days from signup</Text>
              <TouchableOpacity style={styles.voucherDismiss} onPress={() => setShowVoucher(false)}>
                <Text style={styles.voucherDismissText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {isVIP ? (
          <TouchableOpacity
            style={styles.conciergeBtn}
            activeOpacity={0.8}
            onPress={handleConcierge}
            testID="vip-concierge"
          >
            <Crown size={20} color="#fff" />
            <Text style={styles.conciergeBtnText}>Contact VIP Concierge</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.supportBtn}
            activeOpacity={0.8}
            onPress={handleSupport}
            testID="contact-support"
          >
            <Headphones size={20} color={Colors.secondary} />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        )}

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
              onPress={() => item.route && router.push(item.route)}
              testID={`menu-${item.label}`}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F8',
  },
  bgBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 500,
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgBlob1: {
    width: 250,
    height: 250,
    backgroundColor: '#F8BBD020',
    top: -50,
    right: -40,
  },
  bgBlob2: {
    width: 200,
    height: 200,
    backgroundColor: '#B2EBF220',
    top: 100,
    left: -60,
  },
  bgBlob3: {
    width: 160,
    height: 160,
    backgroundColor: '#F3E5F520',
    top: 50,
    right: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.primary + '40',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierBadgeRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 1.5,
  },
  accessCard: {
    marginBottom: 20,
  },
  accessCardInner: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accessHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  accessBrand: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  accessBrandAccent: {
    color: Colors.primary,
  },
  accessPassLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginTop: 4,
  },
  qrWrapper: {
    marginBottom: 20,
  },
  qrBorder: {
    width: 180,
    height: 180,
    borderRadius: 20,
    padding: 5,
  },
  qrInner: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  refText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statRing: {
    width: 60,
    height: 60,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statRingTrack: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
  },
  statRingProgress: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    top: -5,
    left: -5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  voucherCard: {
    marginBottom: 20,
  },
  voucherInner: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  voucherCircleLeft: {
    position: 'absolute',
    left: -14,
    top: '45%' as unknown as number,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F0F8',
  },
  voucherCircleRight: {
    position: 'absolute',
    right: -14,
    top: '45%' as unknown as number,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F0F8',
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  voucherBadge: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: 2,
  },
  voucherDiscount: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  voucherLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  voucherDivider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  voucherCode: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.secondary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  voucherExpiry: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 16,
  },
  voucherDismiss: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  voucherDismissText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  conciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#C8A24D',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#C8A24D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  conciergeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.secondary,
    paddingVertical: 14,
    marginBottom: 20,
  },
  supportBtnText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
