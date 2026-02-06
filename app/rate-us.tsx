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
import { X, Star, Send } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/providers/DataProvider';
import { submitReview } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

const starLabels = ['Terrible', 'Poor', 'Okay', 'Great', 'Amazing!'];

export default function RateUsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const scaleAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const { userId } = useData();

  const reviewMutation = useMutation({
    mutationFn: () => submitReview(userId, rating, comment || null),
    onSuccess: () => {
      console.log('[RateUs] Review submitted successfully');
    },
    onError: (err) => {
      console.log('[RateUs] Review submit error:', err);
    },
  });

  const handleStarPress = (star: number) => {
    setRating(star);
    Animated.sequence([
      Animated.timing(scaleAnims[star - 1], {
        toValue: 1.4,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[star - 1], {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    reviewMutation.mutate();
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
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} testID="close-rate">
          <X size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Rate Your Experience</Text>
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
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>
                  {rating === 0 ? '🏖️' : rating <= 2 ? '😕' : rating === 3 ? '😊' : '🤩'}
                </Text>
              </View>

              <Text style={styles.heading}>How was your visit?</Text>
              <Text style={styles.subheading}>
                Your feedback helps us create the best beach club experience.
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarPress(star)}
                    activeOpacity={0.7}
                    testID={`star-${star}`}
                  >
                    <Animated.View style={{ transform: [{ scale: scaleAnims[star - 1] }] }}>
                      <Star
                        size={42}
                        color={star <= rating ? '#FFB300' : Colors.border}
                        fill={star <= rating ? '#FFB300' : 'transparent'}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.starLabel}>{starLabels[rating - 1]}</Text>
              )}

              <View style={styles.commentBox}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Tell us more about your experience..."
                  placeholderTextColor={Colors.textLight}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  testID="comment-input"
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                testID="submit-review"
              >
                <Send size={18} color="#fff" />
                <Text style={styles.submitText}>Submit Review</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View
              style={[
                styles.successContainer,
                { transform: [{ scale: checkAnim }], opacity: checkAnim },
              ]}
            >
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Thank You!</Text>
              <Text style={styles.successSub}>
                Your feedback means the world to us. We will keep making Esco Life even better.
              </Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.back()}
                testID="done-btn"
              >
                <Text style={styles.doneBtnText}>Done</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  emojiContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: {
    fontSize: 40,
  },
  heading: {
    fontSize: 26,
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
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  starLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFB300',
    marginBottom: 28,
    marginTop: 6,
  },
  commentBox: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
    minHeight: 130,
  },
  commentInput: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 90,
    padding: 0,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
