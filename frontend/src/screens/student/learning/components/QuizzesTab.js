import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../theme';
import { getLearningQuizzes, getStudentQuizHistory } from '../../../../services/learningApi';
import { useAuth } from '../../../../context/AuthContext';

export default function QuizzesTab({ navigation }) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'si'

  const loadData = useCallback(async () => {
    try {
      const [quizzesRes, historyRes] = await Promise.all([
        getLearningQuizzes({ status: 'Published' }),
        getStudentQuizHistory(),
      ]);
      
      setQuizzes(quizzesRes.data || []);
      setQuizHistory(historyRes.data || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getQuizStats = (quizId) => {
    const attempts = quizHistory.filter(attempt => attempt.quiz._id === quizId);
    const lastAttempt = attempts[0]; // Most recent first due to sort
    return {
      attempts: attempts.length,
      lastScore: lastAttempt?.percentage || null,
      lastStatus: lastAttempt?.status || null,
    };
  };

  const renderQuizCard = ({ item }) => {
    const stats = getQuizStats(item._id);
    const questionCount = item.questions?.length || 0;
    const duration = item.timeLimit ? `${item.timeLimit} min` : 'No limit';
    const difficulty = item.difficulty || 'Beginner';

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => navigation.navigate('Quiz', { quizId: item._id, title: item.title })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.brandOrange} />
          </View>
          <View style={styles.quizInfo}>
            <Text style={styles.quizTitle}>{item.title}</Text>
            <Text style={styles.quizDescription}>{item.description || 'Test your knowledge'}</Text>
          </View>
        </View>

        <View style={styles.quizMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="help-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{questionCount} questions</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="bar-chart-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{difficulty}</Text>
          </View>
        </View>

        {stats.lastScore !== null ? (
          <View style={styles.scoreSection}>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Last Score</Text>
              <Text style={styles.scoreValue}>{stats.lastScore}%</Text>
            </View>
            <View style={styles.attemptsInfo}>
              <Text style={styles.attemptsText}>{stats.attempts} attempts</Text>
            </View>
            <TouchableOpacity style={[styles.quizBtn, styles.retakeBtn]}>
              <Text style={styles.retakeBtnText}>Retake Quiz</Text>
              <Ionicons name="refresh-outline" size={16} color={COLORS.brandOrange} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.quizBtn, styles.startBtn]}>
            <Text style={styles.startBtnText}>Start Quiz</Text>
            <Ionicons name="play-outline" size={16} color={COLORS.white} />
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Language Toggle */}
        <View style={styles.languageToggle}>
          <Text style={styles.languageLabel}>Language / භාෂාව</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[styles.languageBtn, language === 'en' && styles.activeLanguageBtn]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.languageBtnText, language === 'en' && styles.activeLanguageBtnText]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageBtn, language === 'si' && styles.activeLanguageBtn]}
              onPress={() => setLanguage('si')}
            >
              <Text style={[styles.languageBtnText, language === 'si' && styles.activeLanguageBtnText]}>
                සිංහල
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {language === 'en' ? 'Available Quizzes' : 'පවතින විමසුම්'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {language === 'en' 
              ? 'Test your knowledge and track your progress' 
              : 'ඔබගේ දැනුම පරීක්ෂා කර ප්‍රගතිය නිරීක්ෂණය කරන්න'
            }
          </Text>
        </View>

        <FlatList
          data={quizzes}
          renderItem={renderQuizCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.quizzesList}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  languageToggle: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activeLanguageBtn: {
    backgroundColor: COLORS.brandOrange,
    borderColor: COLORS.brandOrange,
  },
  languageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeLanguageBtnText: {
    color: COLORS.white,
  },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted },
  quizzesList: { gap: 16 },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.brandOrange + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  quizDescription: { fontSize: 14, color: COLORS.textMuted },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreInfo: { alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: COLORS.textMuted },
  scoreValue: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  attemptsInfo: { alignItems: 'center' },
  attemptsText: { fontSize: 12, color: COLORS.textMuted },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  startBtn: { backgroundColor: COLORS.brandOrange },
  startBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  retakeBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandOrange,
  },
  retakeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.brandOrange },
});
