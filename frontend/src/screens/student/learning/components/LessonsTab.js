import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../theme';
import { getLearningCatalog, getStudentLessonProgress } from '../../../../services/learningApi';

export default function LessonsTab({ navigation, onTabChange }) {
  const [catalog, setCatalog] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [catalogRes, progressRes] = await Promise.all([
        getLearningCatalog(),
        getStudentLessonProgress(),
      ]);
      setCatalog(catalogRes.data || []);
      setLessonProgress(progressRes.data || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load learning content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const getProgressForLesson = useCallback((lessonId) => {
    return lessonProgress.find(p => p.lesson?._id === lessonId) || { completionStatus: 'Not Started', progressPercentage: 0 };
  }, [lessonProgress]);

  const enrichedCatalog = useMemo(() => {
    return catalog.map(topic => {
      const lessons = topic.lessons || [];
      const completedLessons = lessons.filter(lesson => {
        const progress = getProgressForLesson(lesson._id);
        return progress.completionStatus === 'Completed';
      }).length;
      const totalLessons = lessons.length;
      const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const nextLesson = lessons.find(l => getProgressForLesson(l._id).completionStatus !== 'Completed') || lessons[0];
      return { ...topic, totalLessons, completedLessons, overallProgress, nextLesson };
    });
  }, [catalog, getProgressForLesson]);

  const openTopic = (topic) => {
    if (!topic.totalLessons) {
      Alert.alert('No Lessons', 'This topic has no lessons available yet.');
      return;
    }
    navigation.navigate('LessonDetail', {
      topicId: topic._id,
      topicTitle: topic.title,
      lessons: topic.lessons,
    });
  };

  const renderTopicCard = (topic) => (
    <TouchableOpacity
      key={topic._id}
      style={styles.topicCard}
      onPress={() => openTopic(topic)}
      activeOpacity={0.75}
    >
      <View style={styles.topicHeader}>
        <View style={styles.topicIcon}>
          <Ionicons name="folder-outline" size={22} color={COLORS.brandOrange} />
        </View>
        <View style={styles.topicProgress}>
          <Text style={styles.progressPercent}>{topic.overallProgress}%</Text>
          <Text style={styles.progressLabel}>{topic.completedLessons}/{topic.totalLessons} lessons</Text>
        </View>
      </View>

      <Text style={styles.topicTitle}>{topic.title}</Text>
      <Text style={styles.topicDesc}>{topic.description || 'Master essential driving skills'}</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${topic.overallProgress}%` }]} />
      </View>

      <View style={styles.topicFooter}>
        <View style={styles.nextLesson}>
          <Ionicons name="play-circle" size={12} color={COLORS.textMuted} />
          <Text style={styles.nextLessonText}>
            {topic.nextLesson ? `Next: ${topic.nextLesson.title}` : 'All completed!'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.brandOrange} />
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Learning Path</Text>
        <Text style={styles.headerSubtitle}>Continue your driving education journey</Text>
      </View>

      {enrichedCatalog.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color={COLORS.brandOrange} />
          <Text style={styles.emptyTitle}>No Courses Available</Text>
          <Text style={styles.emptyText}>Check back later for new learning content.</Text>
        </View>
      ) : (
        enrichedCatalog.map(renderTopicCard)
      )}

      <TouchableOpacity
        style={styles.quizCta}
        onPress={() => onTabChange?.('quizzes')}
      >
        <Ionicons name="help-circle" size={20} color={COLORS.white} />
        <Text style={styles.quizCtaText}>Take a Quiz</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted },

  topicCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.brandOrange + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicProgress: { flex: 1 },
  progressPercent: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  topicDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 18 },
  progressBar: {
    height: 5,
    backgroundColor: COLORS.bgLight,
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.brandOrange, borderRadius: 3 },
  topicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextLesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  nextLessonText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  quizCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 20,
  },
  quizCtaText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  emptyText: { fontSize: 13, color: COLORS.textMuted },
});
