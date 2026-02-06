import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CircleCheck, PartyPopper } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, subtitle } = useLocalSearchParams<{ name?: string; subtitle?: string }>();

  const scale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const confettiY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(confettiY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [scale, fadeIn, confettiY]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.bgDecor}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
          <View style={styles.iconBg}>
            <CircleCheck size={56} color="#fff" />
          </View>
          <View style={styles.confettiWrap}>
            <PartyPopper size={28} color={Colors.primary} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: confettiY }], alignItems: 'center' as const }}>
          <Text style={styles.headline}>You&apos;re all set, {name ?? 'Guest'}!</Text>
          <Text style={styles.subtext}>
            {subtitle ?? 'Your reservation has been confirmed.'}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: fadeIn, paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
          testID="back-home"
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle1: {
    width: 260,
    height: 260,
    backgroundColor: Colors.primary + '08',
    top: -40,
    right: -60,
  },
  circle2: {
    width: 180,
    height: 180,
    backgroundColor: Colors.secondary + '0A',
    bottom: 100,
    left: -40,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: '#FF980010',
    top: '40%',
    right: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconWrap: {
    marginBottom: 32,
    position: 'relative',
  },
  iconBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  confettiWrap: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  homeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
