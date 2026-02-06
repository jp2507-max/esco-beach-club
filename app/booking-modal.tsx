import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Minus, Plus, CalendarDays, Users, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/providers/DataProvider';

const TIME_SLOTS = [
  { time: '18:00', available: true },
  { time: '18:30', available: true },
  { time: '19:00', available: true },
  { time: '19:30', available: false },
  { time: '20:00', available: true },
  { time: '20:30', available: false },
  { time: '21:00', available: true },
  { time: '21:30', available: true },
];

const OCCASIONS = ['Date Night', 'Birthday', 'Business', 'Casual', 'Celebration'];

function getNext7Days(): { label: string; day: string; date: Date; full: string }[] {
  const days: { label: string; day: string; date: Date; full: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: i === 0 ? 'Today' : dayNames[d.getDay()],
      day: String(d.getDate()),
      date: d,
      full: `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`,
    });
  }
  return days;
}

export default function BookingModalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventTitle } = useLocalSearchParams<{ eventTitle?: string }>();
  const { profile } = useData();

  const dates = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pax, setPax] = useState<number>(2);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideUp]);

  const canConfirm = selectedTime !== null && occasion !== null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    console.log('[Booking] Submitting reservation...');
    setTimeout(() => {
      const name = profile?.full_name?.split(' ')[0] ?? 'Guest';
      router.replace({
        pathname: '/success',
        params: {
          name,
          subtitle: `Your table is reserved for ${dates[selectedDate].full} at ${selectedTime}.`,
        },
      });
    }, 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reserve your Spot</Text>
          {eventTitle ? <Text style={styles.headerSub}>{eventTitle}</Text> : null}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} testID="close-booking">
          <X size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <CalendarDays size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Select Date</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
              {dates.map((d, i) => {
                const active = selectedDate === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    onPress={() => setSelectedDate(i)}
                    testID={`date-${i}`}
                  >
                    <Text style={[styles.dateDayName, active && styles.dateDayNameActive]}>{d.label}</Text>
                    <Text style={[styles.dateDay, active && styles.dateDayActive]}>{d.day}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <Sparkles size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Pick a Time</Text>
            </View>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const active = selectedTime === slot.time;
                return (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.timeChip,
                      active && styles.timeChipActive,
                      !slot.available && styles.timeChipDisabled,
                    ]}
                    onPress={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    testID={`time-${slot.time}`}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        active && styles.timeTextActive,
                        !slot.available && styles.timeTextDisabled,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {!slot.available && <Text style={styles.fullLabel}>Full</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionLabel}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Number of Guests</Text>
            </View>
            <View style={styles.paxRow}>
              <TouchableOpacity
                style={[styles.paxBtn, pax <= 1 && styles.paxBtnDisabled]}
                onPress={() => setPax(Math.max(1, pax - 1))}
                disabled={pax <= 1}
                testID="pax-minus"
              >
                <Minus size={20} color={pax <= 1 ? Colors.textLight : Colors.text} />
              </TouchableOpacity>
              <View style={styles.paxDisplay}>
                <Text style={styles.paxValue}>{pax}</Text>
                <Text style={styles.paxLabel}>guests</Text>
              </View>
              <TouchableOpacity
                style={[styles.paxBtn, pax >= 20 && styles.paxBtnDisabled]}
                onPress={() => setPax(Math.min(20, pax + 1))}
                disabled={pax >= 20}
                testID="pax-plus"
              >
                <Plus size={20} color={pax >= 20 ? Colors.textLight : Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Occasion</Text>
            <View style={styles.occasionRow}>
              {OCCASIONS.map((o) => {
                const active = occasion === o;
                return (
                  <TouchableOpacity
                    key={o}
                    style={[styles.occasionChip, active && styles.occasionChipActive]}
                    onPress={() => setOccasion(o)}
                    testID={`occasion-${o}`}
                  >
                    <Text style={[styles.occasionText, active && styles.occasionTextActive]}>{o}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          activeOpacity={0.85}
          testID="confirm-booking"
        >
          {isSubmitting ? (
            <Text style={styles.confirmBtnText}>Reserving...</Text>
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Reservation</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dateRow: {
    gap: 10,
    paddingRight: 20,
  },
  dateChip: {
    width: 68,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dateChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  dateDayNameActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  dateDayActive: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    width: '23%' as unknown as number,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipDisabled: {
    backgroundColor: Colors.sand,
    borderColor: Colors.sandDark,
    opacity: 0.6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  timeTextActive: {
    color: '#fff',
  },
  timeTextDisabled: {
    color: Colors.textLight,
  },
  fullLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  paxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paxBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paxBtnDisabled: {
    opacity: 0.4,
  },
  paxDisplay: {
    alignItems: 'center',
  },
  paxValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  paxLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  occasionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  occasionChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  occasionChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  occasionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  occasionTextActive: {
    color: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
