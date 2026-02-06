import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Upload,
  Zap,
  Wine,
  Award,
  Shield,
  Users,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { referralCode, referralProgress, mockReferrals } from '@/mocks/partners';

const milestones = [
  { icon: Wine, label: 'Free Cocktail', sub: 'Unlocked', unlocked: true },
  { icon: Award, label: 'VIP Badge', sub: '2 more invites', unlocked: false, isGoal: true },
  { icon: Shield, label: 'Priority Entry', sub: 'Locked', unlocked: false },
];

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: referralProgress.current / referralProgress.goal,
        duration: 800,
        delay: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progressAnim, fadeAnim]);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      console.log('Referral code copied');
    } catch (e) {
      console.log('Copy failed', e);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Esco Life with my referral code: ${referralCode}\nhttps://escolife.app/invite/${referralCode}`,
      });
    } catch (e) {
      console.log('Share failed', e);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bgGlow} />

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="back-btn">
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Invite & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.heroTitle}>
            Unlock the{'\n'}
            <Text style={styles.heroAccent}>VIP Life</Text>
          </Text>
          <Text style={styles.heroSub}>
            Invite friends to Esco Life and start{'\n'}earning exclusive perks today.
          </Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <View style={styles.codeRow}>
              <View style={styles.codeIconWrap}>
                <Users size={18} color={Colors.primary} />
              </View>
              <Text style={styles.codeText}>{referralCode}</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} testID="copy-code">
                <Copy size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.goalLabel}>GOAL: VIP STATUS</Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalTitle}>
                {referralProgress.current} of {referralProgress.goal} Friends Joined
              </Text>
              <Zap size={22} color={Colors.primary} />
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              <Animated.View
                style={[
                  styles.progressThumb,
                  {
                    left: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.milestonesRow}>
            {milestones.map((m) => (
              <View key={m.label} style={styles.milestone}>
                <View
                  style={[
                    styles.milestoneCircle,
                    m.unlocked && styles.milestoneUnlocked,
                    m.isGoal && styles.milestoneGoal,
                  ]}
                >
                  {m.isGoal && <View style={styles.goalBadge}><Text style={styles.goalBadgeText}>GOAL</Text></View>}
                  <m.icon
                    size={22}
                    color={m.unlocked ? '#4CAF50' : m.isGoal ? '#fff' : Colors.textLight}
                  />
                </View>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                <Text
                  style={[
                    styles.milestoneSub,
                    m.unlocked && { color: '#4CAF50' },
                  ]}
                >
                  {m.sub}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.referralsSection}>
            <View style={styles.referralsHeader}>
              <Text style={styles.referralsTitle}>Recent Referrals</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {mockReferrals.map((ref) => (
              <View key={ref.id} style={styles.referralCard}>
                <View style={styles.referralLeft}>
                  <View style={styles.referralAvatarWrap}>
                    <Image source={{ uri: ref.avatar }} style={styles.referralAvatar} />
                    <View style={styles.referralDot} />
                  </View>
                  <View>
                    <Text style={styles.referralName}>{ref.name}</Text>
                    <Text style={styles.referralSub}>Joined via your link</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{ref.status}</Text>
                </View>
              </View>
            ))}
            {mockReferrals.length === 0 && (
              <Text style={styles.emptyText}>No referrals yet. Share your code!</Text>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85} testID="share-btn">
          <Upload size={20} color="#fff" />
          <Text style={styles.shareBtnText}>Share Invite Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#FCE4EC40',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 40,
  },
  heroAccent: {
    color: Colors.primary,
  },
  heroSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 28,
  },
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  codeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  codeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 1,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalSection: {
    marginBottom: 24,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FCE4EC',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative' as const,
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressThumb: {
    position: 'absolute' as const,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.primary,
    marginLeft: -8,
  },
  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  milestone: {
    alignItems: 'center',
    flex: 1,
  },
  milestoneCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneUnlocked: {
    backgroundColor: '#E8F5E9',
  },
  milestoneGoal: {
    backgroundColor: Colors.primary,
  },
  goalBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFF8F5',
  },
  goalBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  milestoneSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  referralsSection: {
    marginBottom: 20,
  },
  referralsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  referralsTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  referralLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralAvatarWrap: {
    width: 44,
    height: 44,
  },
  referralAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  referralDot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  referralName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  referralSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#4CAF50',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFF8F5',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
