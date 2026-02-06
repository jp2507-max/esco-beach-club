import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, PartyPopper, Calendar, Users, ChevronDown, Send } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/providers/DataProvider';
import { submitPrivateEventInquiry } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

const eventTypes = ['Company Party', 'Birthday', 'Wedding', 'Anniversary', 'Corporate Retreat', 'Other'];

export default function PrivateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [eventType, setEventType] = useState<string>('');
  const [showTypePicker, setShowTypePicker] = useState<boolean>(false);
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [estimatedPax, setEstimatedPax] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const { userId } = useData();

  const inquiryMutation = useMutation({
    mutationFn: () => submitPrivateEventInquiry({
      user_id: userId,
      event_type: eventType,
      preferred_date: preferredDate,
      estimated_pax: parseInt(estimatedPax, 10) || 0,
      contact_name: contactName || undefined,
      contact_email: contactEmail || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => console.log('[PrivateEvent] Inquiry submitted'),
    onError: (err) => console.log('[PrivateEvent] Submit error:', err),
  });

  const isValid = eventType.length > 0 && preferredDate.length > 0 && estimatedPax.length > 0;

  const handleSubmit = () => {
    if (!isValid) {
      Alert.alert('Missing Info', 'Please fill in the event type, date, and estimated guests.');
      return;
    }
    inquiryMutation.mutate();
    setSubmitted(true);
    Animated.spring(checkAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} testID="close-inquiry">
          <X size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Private Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!submitted ? (
            <>
              <View style={styles.heroSection}>
                <View style={styles.heroIcon}>
                  <PartyPopper size={32} color={Colors.primary} />
                </View>
                <Text style={styles.heading}>Plan Your Private Party</Text>
                <Text style={styles.subheading}>
                  From intimate birthdays to grand corporate events — let us handle it all.
                </Text>
              </View>

              <Text style={styles.sectionLabel}>EVENT DETAILS</Text>

              <TouchableOpacity
                style={styles.fieldBox}
                onPress={() => setShowTypePicker(!showTypePicker)}
                activeOpacity={0.7}
                testID="event-type-picker"
              >
                <View style={styles.fieldIconWrap}>
                  <PartyPopper size={18} color={Colors.secondary} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Event Type</Text>
                  <Text style={[styles.fieldValue, !eventType && styles.fieldPlaceholder]}>
                    {eventType || 'Select type...'}
                  </Text>
                </View>
                <ChevronDown size={18} color={Colors.textLight} />
              </TouchableOpacity>

              {showTypePicker && (
                <View style={styles.pickerDropdown}>
                  {eventTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.pickerItem,
                        eventType === type && styles.pickerItemActive,
                      ]}
                      onPress={() => {
                        setEventType(type);
                        setShowTypePicker(false);
                      }}
                      testID={`type-${type}`}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          eventType === type && styles.pickerItemTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.fieldBox}>
                <View style={styles.fieldIconWrap}>
                  <Calendar size={18} color={Colors.secondary} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Preferred Date</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. March 15, 2026"
                    placeholderTextColor={Colors.textLight}
                    value={preferredDate}
                    onChangeText={setPreferredDate}
                    testID="date-input"
                  />
                </View>
              </View>

              <View style={styles.fieldBox}>
                <View style={styles.fieldIconWrap}>
                  <Users size={18} color={Colors.secondary} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Estimated Guests</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 50"
                    placeholderTextColor={Colors.textLight}
                    value={estimatedPax}
                    onChangeText={setEstimatedPax}
                    keyboardType="number-pad"
                    testID="pax-input"
                  />
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>CONTACT INFO (optional)</Text>

              <View style={styles.fieldBox}>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Your full name"
                    placeholderTextColor={Colors.textLight}
                    value={contactName}
                    onChangeText={setContactName}
                    testID="name-input"
                  />
                </View>
              </View>

              <View style={styles.fieldBox}>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="you@email.com"
                    placeholderTextColor={Colors.textLight}
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="email-input"
                  />
                </View>
              </View>

              <View style={[styles.fieldBox, { minHeight: 100, alignItems: 'flex-start', paddingTop: 14 }]}>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Additional Notes</Text>
                  <TextInput
                    style={[styles.fieldInput, { minHeight: 60 }]}
                    placeholder="Theme, dietary requirements, special requests..."
                    placeholderTextColor={Colors.textLight}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    textAlignVertical="top"
                    testID="notes-input"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                testID="submit-inquiry"
              >
                <Send size={18} color="#fff" />
                <Text style={styles.submitText}>Send Inquiry</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Our team will get back to you within 24 hours.
              </Text>
            </>
          ) : (
            <Animated.View
              style={[
                styles.successContainer,
                { transform: [{ scale: checkAnim }], opacity: checkAnim },
              ]}
            >
              <Text style={styles.successEmoji}>🎊</Text>
              <Text style={styles.successTitle}>Inquiry Sent!</Text>
              <Text style={styles.successSub}>
                Our events team will review your request and reach out within 24 hours. Get ready for an unforgettable event!
              </Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.back()}
                testID="done-inquiry"
              >
                <Text style={styles.doneBtnText}>Back to Events</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 12,
  },
  fieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.tealLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  fieldPlaceholder: {
    color: Colors.textLight,
    fontWeight: '400' as const,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    padding: 0,
  },
  pickerDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    marginTop: -4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemActive: {
    backgroundColor: Colors.secondary + '12',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  pickerItemTextActive: {
    color: Colors.secondary,
    fontWeight: '700' as const,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  successSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  doneBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
