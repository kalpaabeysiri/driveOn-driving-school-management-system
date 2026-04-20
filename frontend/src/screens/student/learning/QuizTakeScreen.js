import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getLearningQuizById, submitLearningQuizAttempt } from '../../../services/learningApi';

export default function QuizTakeScreen({ route, navigation }) {
  const { quizId, attemptId } = route.params || {};

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Validate required params
  React.useEffect(() => {
    if (!quizId) {
      Alert.alert('Error', 'Quiz ID is required');
      navigation.goBack();
    }
  }, [quizId, navigation]);

  useEffect(() => {
    const load = async () => {
      if (!quizId) return;
      try {
        const { data } = await getLearningQuizById(quizId);
        setQuiz(data);
        setAnswers((data.questions || []).map(() => null));
      } catch {
        Alert.alert('Error', 'Could not load quiz');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, navigation]);

  const totalQ = quiz?.questions?.length || 0;
  const question = quiz?.questions?.[currentQ];
  const selectedOptionId = answers[currentQ];

  const canNext = useMemo(() => selectedOptionId !== null, [selectedOptionId]);

  const setSelected = (optId) => {
    const updated = [...answers];
    updated[currentQ] = optId;
    setAnswers(updated);
  };

  const next = () => {
    if (currentQ < totalQ - 1) setCurrentQ(currentQ + 1);
    else finish();
  };

  const prev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const finish = async () => {
    try {
      setSubmitting(true);
      const payload = {
        attemptId,
        answers: (quiz.questions || []).map((q, i) => ({
          questionId: q._id,
          selectedOptionId: answers[i],
        })),
      };
      const { data } = await submitLearningQuizAttempt(quizId, payload);
      navigation.replace('LearningQuizResult', { result: data, quizTitle: quiz.title });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;
  if (!quiz || !question) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={COLORS.black} />
          <Text style={styles.backText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{quiz.title}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Q {currentQ + 1} / {totalQ}</Text>
          <Text style={styles.progressPct}>{Math.round(((currentQ + 1) / totalQ) * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((currentQ + 1) / totalQ) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        <Text style={styles.questionText}>{question.questionText}</Text>

        {(question.options || []).map((opt) => {
          const isSelected = selectedOptionId === opt._id;
          return (
            <TouchableOpacity
              key={opt._id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setSelected(opt._id)}
              disabled={submitting}
            >
              <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                  {isSelected ? '✓' : ''}
                </Text>
              </View>
              <Text style={styles.optionText}>{opt.optionText}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.navButtons}>
        {currentQ > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={prev} disabled={submitting}>
            <Text style={styles.prevBtnText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, (!canNext || submitting) && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!canNext || submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <>
                <Text style={styles.nextBtnText}>{currentQ === totalQ - 1 ? 'Submit' : 'Next'}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black, marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, color: COLORS.textMuted },
  progressPct: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  progressTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: COLORS.brandOrange, borderRadius: 3 },
  quizContent: { padding: 20, paddingBottom: 20 },
  questionText: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 20, lineHeight: 24 },
  option: {
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  optionSelected: { backgroundColor: '#FFF8ED', borderColor: COLORS.brandOrange },
  optionCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  optionCircleSelected: { backgroundColor: COLORS.brandYellow },
  optionLetter: { fontSize: 14, fontWeight: '900', color: COLORS.black },
  optionLetterSelected: { color: COLORS.black },
  optionText: { fontSize: 14, color: COLORS.black, flex: 1 },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  prevBtn: { flex: 1, backgroundColor: '#F3F3F3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  nextBtn: { flex: 2, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  nextBtnDisabled: { backgroundColor: '#E0E0E0' },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});

