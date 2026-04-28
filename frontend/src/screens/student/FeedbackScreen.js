import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { submitFeedback, getFeedbackTemplates } from '../../services/feedbackApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

export default function FeedbackScreen({ route, navigation }) {
  const { sessionId, sessionInfo } = route.params;
  const { user } = useAuth();
  const studentId = user?._id;

  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getFeedbackTemplates().then(({ data }) => setTemplates(data)).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      return Alert.alert('Error', 'Please select a rating');
    }
    try {
      setLoading(true);
      await submitFeedback({ session: sessionId, student: studentId, rating, comment });
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>Feedback Submitted!</Text>
          <Text style={styles.successText}>Thank you for your feedback. It helps us improve our sessions.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Session</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Session Info */}
        {sessionInfo && (
          <View style={styles.sessionCard}>
            <Text style={styles.sessionType}>{sessionInfo.sessionType} Session</Text>
            <Text style={styles.sessionDate}>{new Date(sessionInfo.date).toDateString()}</Text>
            <Text style={styles.sessionTime}>{sessionInfo.startTime} – {sessionInfo.endTime}</Text>
          </View>
        )}

        {/* Star Rating */}
        <Text style={styles.sectionLabel}>Your Rating *</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FFB800' : COLORS.borderLight}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
        </Text>

        {/* Quick Templates */}
        {templates.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Quick Comments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
              {templates.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  style={[styles.templateChip, comment === t.comment && styles.templateChipActive]}
                  onPress={() => setComment(comment === t.comment ? '' : t.comment)}
                >
                  <Text style={[styles.templateText, comment === t.comment && styles.templateTextActive]}>
                    {t.comment}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Comment */}
        <Text style={styles.sectionLabel}>Comment (optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience about this session..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Submit Feedback</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  sessionCard: { backgroundColor: COLORS.brandYellow, borderRadius: 16, padding: 16, marginBottom: 24, gap: 4 },
  sessionType: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  sessionDate: { fontSize: 13, color: COLORS.textDark },
  sessionTime: { fontSize: 13, color: COLORS.textMuted },
  sectionLabel:{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 12 },
  starsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: COLORS.textMuted, marginBottom: 24 },
  templatesScroll: { marginBottom: 20 },
  templateChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: COLORS.bgLight },
  templateChipActive: { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  templateText: { fontSize: 13, color: COLORS.textMuted },
  templateTextActive: { color: COLORS.black, fontWeight: '600' },
  commentInput:{ backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, height: 120, marginBottom: 4 },
  charCount:   { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginBottom: 20 },
  submitBtn:   { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnText:{ color: COLORS.white, fontWeight: '700', fontSize: 16 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { marginBottom: 20 },
  successTitle:{ fontSize: 24, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  successText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  doneBtn:     { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48 },
  doneBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
