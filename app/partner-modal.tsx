import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Copy, X, Star, Percent, Award } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { usePartnerById } from '@/providers/DataProvider';

export default function PartnerModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const partner = usePartnerById(id);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handleCopy = async () => {
    if (partner) {
      try {
        await Clipboard.setStringAsync(partner.code);
        console.log('Code copied:', partner.code);
      } catch (e) {
        console.log('Copy error', e);
      }
    }
  };

  if (!partner) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Partner not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: partner.image }} style={styles.bgImage} contentFit="cover" blurRadius={20} />
      <View style={styles.overlay} />

      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        testID="close-modal"
      >
        <X size={20} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconCircle}>
            <View style={styles.iconRing}>
              <Star size={32} color="#F9A825" fill="#F9A825" />
            </View>
            <Text style={styles.unlockedLabel}>UNLOCKED</Text>
          </View>

          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.titleAccent}>{partner.discount_label}!</Text>
          <Text style={styles.subtitle}>
            Enjoy exclusive benefits at {partner.name}. {partner.description}.
          </Text>

          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <Award size={24} color={Colors.primary} />
              <Text style={styles.perkLabel}>Exclusive</Text>
            </View>
            <View style={styles.perkItem}>
              <Percent size={24} color={Colors.primary} />
              <Text style={styles.perkLabel}>Discount</Text>
            </View>
            <View style={styles.perkItem}>
              <Star size={24} color={Colors.primary} />
              <Text style={styles.perkLabel}>VIP Perk</Text>
            </View>
          </View>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>YOUR DISCOUNT CODE</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{partner.code}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} testID="copy-discount">
                <Copy size={18} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Enjoy my Perks</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.laterText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#F9A825',
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  unlockedLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#F9A825',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  titleAccent: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  perksRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  perkItem: {
    width: 90,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  perkLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  codeBox: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  laterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});
