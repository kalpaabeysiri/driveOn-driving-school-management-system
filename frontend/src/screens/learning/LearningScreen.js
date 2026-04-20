import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getQuizzes, getProgress } from '../../services/api';
import { COLORS } from '../../theme';

export default function LearningScreen({ navigation }) {
  const [quizzes,  setQuizzes]  = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('quizzes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [q, p] = await Promise.all([getQuizzes(), getProgress()]);
        setQuizzes(q.data);
        setProgress(p.data);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getLastScore = (quizId) => {
    const records = progress.filter(p => p.quiz?._id === quizId);
    if (!records.length) return null;
    return records.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0].score;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const avgScore = progress.length
    ? Math.round(progress.reduce((a, b) => a + b.score, 0) / progress.length)
    : 0;
  const passed   = progress.filter(p => p.passed).length;
  const attempts = progress.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning & Exams</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {['quizzes', 'performance'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'quizzes' ? (
          <>
            <Text style={styles.sectionTitle}>Available Quizzes</Text>
            {quizzes.length === 0 ? (
              <Text style={styles.empty}>No quizzes available yet.</Text>
            ) : (
              quizzes.map((quiz) => {
                const lastScore = getLastScore(quiz._id);
                return (
                  <View key={quiz._id} style={styles.quizCard}>
                    <View style={styles.quizTop}>
                      <View style={styles.quizIcon}>
                        <Ionicons name="document-text-outline" size={20} color={COLORS.black} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.quizTitle}>{quiz.title}</Text>
                        <Text style={styles.quizMeta}>
                          {quiz.questions?.length || 0} questions · {quiz.duration} mins
                        </Text>
                        {lastScore !== null && (
                          <Text style={[styles.quizMeta, { color: lastScore >= 60 ? COLORS.green : COLORS.red }]}>
                            Last score: {lastScore}%
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => navigation.navigate('Quiz', { quizId: quiz._id, title: quiz.title })}
                    >
                      <Ionicons name={lastScore !== null ? 'refresh-outline' : 'play-outline'} size={14} color={COLORS.black} />
                      <Text style={styles.startBtnText}>
                        {lastScore !== null ? 'Retake Quiz' : 'Start Quiz'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.perfSummaryRow}>
              {[
                { label: 'Avg Score',   value: `${avgScore}%` },
                { label: 'Passed',      value: passed },
                { label: 'Total Tries', value: attempts },
              ].map((s) => (
                <View key={s.label} style={styles.perfCard}>
                  <Text style={styles.perfValue}>{s.value}</Text>
                  <Text style={styles.perfLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Quiz History</Text>
            {progress.length === 0 ? (
              <Text style={styles.empty}>No quiz attempts yet.</Text>
            ) : (
              progress.map((p) => (
                <View key={p._id} style={styles.historyCard}>
                  <View style={styles.flex1}>
                    <Text style={styles.historyTitle}>{p.quiz?.title || 'Quiz'}</Text>
                    <Text style={styles.historyMeta}>
                      {new Date(p.completedAt).toLocaleDateString()} ·
                      {p.correctAnswers}/{p.totalQuestions} correct
                    </Text>
                  </View>
                  <View style={[styles.scoreBadge, {
                    backgroundColor: p.passed ? COLORS.greenBg : COLORS.redBg,
                  }]}>
                    <Text style={[styles.scoreText, { color: p.passed ? COLORS.green : COLORS.red }]}>
                      {p.score}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title:         { fontSize: 24, fontWeight: '600', color: COLORS.black },
  tabRow:        { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.bgLight },
  tabActive:     { backgroundColor: COLORS.brandYellow },
  tabText:       { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.black },
  content:       { padding: 20, paddingTop: 12, paddingBottom: 40 },
  sectionTitle:  { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  empty:         { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  flex1:         { flex: 1 },
  quizCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  quizTop:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  quizIcon:  { backgroundColor: COLORS.brandYellow, borderRadius: 8, padding: 8 },
  quizTitle: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  quizMeta:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  startBtn: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  startBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  perfSummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  perfCard: {
    flex: 1,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  perfValue: { fontSize: 22, fontWeight: '700', color: COLORS.black },
  perfLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  historyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  historyMeta:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  scoreBadge:   { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  scoreText:    { fontSize: 14, fontWeight: '700' },
});
