import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../theme';
import { getLearningQuizzes, getStudentQuizHistory } from '../../../../services/learningApi';

export default function QuizzesTab({ navigation, onTabChange }) {
  const [quizzes, setQuizzes] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'si' (sinhala)

  const loadData = useCallback(async () => {
    try {
      // Filter quizzes by language - pass selected language to API
      const quizzesRes = await getLearningQuizzes({ status: 'Published', language });
      setQuizzes(quizzesRes.data || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // Load history separately so a failure doesn't block quiz list
    try {
      const historyRes = await getStudentQuizHistory();
      setQuizHistory(historyRes.data || []);
    } catch {
      // history unavailable — quiz list still works
    }
  }, [language]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Reload when language changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setLoading(true);
  };

  // Map quizId → { attempts, lastScore, lastStatus, allScores: [{percentage, status, date}] }
  const historyMap = useMemo(() => {
    const map = {};
    quizHistory.forEach((attempt) => {
      const qid = attempt.quiz?._id || attempt.quiz;
      if (!qid) return;
      const id = String(qid);
      if (!map[id]) map[id] = { attempts: 0, lastScore: null, lastStatus: null, allScores: [] };
      map[id].attempts += 1;
      map[id].allScores.push({
        percentage: attempt.percentage ?? 0,
        status: attempt.status,
        date: attempt.submittedAt,
        attemptNumber: map[id].attempts,
      });
      // history is sorted newest-first, so first occurrence is latest
      if (map[id].lastScore === null) {
        map[id].lastScore = attempt.percentage ?? null;
        map[id].lastStatus = attempt.status ?? null;
      }
    });
    return map;
  }, [quizHistory]);

  // Group quizzes by lesson
  const sections = useMemo(() => {
    const grouped = {};
    quizzes.forEach((q) => {
      const lessonId = q.lesson?._id || q.lesson || 'general';
      const lessonTitle = q.lesson?.title || 'General';
      if (!grouped[lessonId]) grouped[lessonId] = { lessonId, lessonTitle, quizzes: [] };
      grouped[lessonId].quizzes.push(q);
    });
    return Object.values(grouped);
  }, [quizzes]);

  const goToQuiz = (quizId) => {
    navigation.navigate('LearningQuizTake', { quizId });
  };

  const renderQuizCard = (item) => {
    const stats = historyMap[item._id] || { attempts: 0, lastScore: null, lastStatus: null, allScores: [] };
    const questionCount = item.questions?.length || 0;
    const hasPassed = stats.lastStatus === 'Passed';
    const attemptLimit = item.attemptLimit || 0;
    const limitReached = attemptLimit > 0 && stats.attempts >= attemptLimit;

    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.quizCard, limitReached && styles.quizCardDimmed]}
        onPress={() => !limitReached && goToQuiz(item._id)}
        activeOpacity={limitReached ? 1 : 0.75}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, hasPassed && styles.iconContainerPassed]}>
            <Ionicons
              name={hasPassed ? 'checkmark-circle' : 'help-circle-outline'}
              size={24}
              color={hasPassed ? COLORS.white : COLORS.brandOrange}
            />
          </View>
          <View style={styles.quizInfo}>
            <Text style={styles.quizTitle}>{item.title}</Text>
            {!!item.description && (
              <Text style={styles.quizDescription} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
        </View>

        <View style={styles.quizMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="list-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{questionCount} question{questionCount !== 1 ? 's' : ''}</Text>
          </View>
          {item.timeLimit > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.timeLimit} min</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="checkmark-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.passMark || 0}% to pass</Text>
          </View>
        </View>

        {stats.lastScore !== null ? (
          <View style={styles.scoreRow}>
            <View style={styles.scorePill}>
              <Text style={styles.scoreLabel}>Last score</Text>
              <Text style={[styles.scoreValue, { color: hasPassed ? COLORS.green : COLORS.red }]}>
                {stats.lastScore}%
              </Text>
            </View>
            <Text style={styles.attemptsText}>{stats.attempts}{attemptLimit > 0 ? `/${attemptLimit}` : ''} attempt{stats.attempts !== 1 ? 's' : ''}</Text>
            {limitReached ? (
              <View style={styles.limitBadge}>
                <Ionicons name="ban-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.limitBadgeText}>Limit reached</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => goToQuiz(item._id)}
              >
                <Ionicons name="refresh-outline" size={14} color={COLORS.brandOrange} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => goToQuiz(item._id)}
            disabled={limitReached}
          >
            <Ionicons name="play-outline" size={16} color={COLORS.white} />
            <Text style={styles.startBtnText}>Start Quiz</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>Available Quizzes</Text>
      <Text style={styles.pageSubtitle}>Test your knowledge, lesson by lesson</Text>

      {/* Language Toggle */}
      <View style={styles.langToggleContainer}>
        <Text style={styles.langLabel}>Select Language:</Text>
        <View style={styles.langToggleRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'si' && styles.langBtnActive]}
            onPress={() => handleLanguageChange('si')}
          >
            <Text style={[styles.langBtnText, language === 'si' && styles.langBtnTextActive]}>
              සිංහල
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="help-circle-outline" size={52} color={COLORS.brandOrange} />
          <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
          <Text style={styles.emptyText}>Published quizzes will appear here.</Text>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.lessonId} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={14} color={COLORS.brandOrange} />
              <Text style={styles.sectionTitle}>{section.lessonTitle}</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{section.quizzes.length}</Text>
              </View>
            </View>
            {section.quizzes.map(renderQuizCard)}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brandOrange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },

  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.brandOrange + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerPassed: { backgroundColor: COLORS.green },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 2 },
  quizDescription: { fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },

  quizMeta: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: COLORS.textMuted },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scorePill: { flex: 1 },
  scoreLabel: { fontSize: 10, color: COLORS.textMuted },
  scoreValue: { fontSize: 16, fontWeight: '800' },
  attemptsText: { fontSize: 11, color: COLORS.textMuted },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.brandOrange,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retakeBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.brandOrange },
  limitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border },
  limitBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  quizCardDimmed: { opacity: 0.6 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 10,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  langToggleContainer: { marginBottom: 16, backgroundColor: COLORS.bgLight, padding: 12, borderRadius: 12 },
  langLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 },
  langToggleRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center' },
  langBtnActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  langBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  langBtnTextActive: { color: COLORS.white },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  emptyText: { fontSize: 13, color: COLORS.textMuted },
});
