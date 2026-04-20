import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../theme';
import { getLearningCatalog, getStudentLessonProgress, getLearningLessons } from '../../../../services/learningApi';
import { useAuth } from '../../../../context/AuthContext';

export default function LessonsTab({ navigation }) {
  const { user } = useAuth();
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleCoursePress = async (item) => {
    try {
      // If lessons are already loaded, navigate directly
      if (item.lessons && item.lessons.length > 0) {
        navigation.navigate('LessonDetail', { 
          topicId: item._id, 
          topicTitle: item.title,
          lessons: item.lessons
        });
        return;
      }

      // Otherwise, fetch lessons for this topic
      Alert.alert('Loading', 'Fetching lessons...');
      const lessonsRes = await getLearningLessons({ topic: item._id });
      
      if (lessonsRes.data && lessonsRes.data.length > 0) {
        navigation.navigate('LessonDetail', { 
          topicId: item._id, 
          topicTitle: item.title,
          lessons: lessonsRes.data
        });
      } else {
        Alert.alert('No Lessons', 'This topic has no lessons available yet.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load lessons for this topic');
    }
  };

  const getProgressForLesson = (lessonId) => {
    const progress = lessonProgress.find(p => p.lesson._id === lessonId);
    return progress || { completionStatus: 'Not Started', progressPercentage: 0 };
  };

  const renderCourseCard = ({ item }) => {
    const totalLessons = item.lessons?.length || 0;
    const completedLessons = item.lessons?.filter(lesson => {
      const progress = getProgressForLesson(lesson._id);
      return progress.completionStatus === 'Completed';
    }).length || 0;
    
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.courseCard}
        onPress={() => handleCoursePress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.brandOrange + '20' }]}>
            <Ionicons name="book-outline" size={24} color={COLORS.brandOrange} />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{overallProgress}% Complete</Text>
            <Text style={styles.lessonCount}>
              {completedLessons}/{totalLessons} lessons
            </Text>
          </View>
        </View>

        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseDescription}>{item.description || 'Learn essential driving concepts'}</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
        </View>

        <TouchableOpacity 
          style={styles.continueBtn}
          onPress={() => handleCoursePress(item)}
        >
          <Text style={styles.continueBtnText}>Continue Learning</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderResourceCard = (resource, lessonTitle) => (
    <TouchableOpacity 
      key={resource._id} 
      style={styles.resourceCard}
      onPress={() => navigation.navigate('ResourceDetail', { resourceId: resource._id })}
    >
      <Ionicons name="document-text-outline" size={32} color={COLORS.brandOrange} />
      <Text style={styles.resourceTitle}>{resource.title}</Text>
      <Text style={styles.resourceSubtitle}>{lessonTitle}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  // Collect all resources from all lessons
  const allResources = [];
  catalog.forEach(topic => {
    topic.lessons?.forEach(lesson => {
      lesson.videoTutorials?.forEach(video => {
        allResources.push({ ...video, lessonTitle: lesson.title });
      });
    });
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Courses</Text>
          <Text style={styles.headerSubtitle}>Continue your driving education journey</Text>
        </View>

        <FlatList
          data={catalog}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.coursesList}
          scrollEnabled={false}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Resources</Text>
          <View style={styles.resourcesGrid}>
            {allResources.slice(0, 3).map(resource => renderResourceCard(resource, resource.lessonTitle))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.quizCta}
          onPress={() => navigation.navigate('LearningCatalog')}
        >
          <Ionicons name="help-circle" size={24} color={COLORS.white} />
          <Text style={styles.quizCtaText}>Test Your Knowledge</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted },
  coursesList: { gap: 16 },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressInfo: { flex: 1 },
  progressText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  lessonCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  courseTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  courseDescription: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.bgLight,
    borderRadius: 3,
    marginBottom: 16,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  continueBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  resourceTitle: { fontSize: 12, fontWeight: '600', color: COLORS.black, textAlign: 'center' },
  resourceSubtitle: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  quizCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 32,
  },
  quizCtaText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
