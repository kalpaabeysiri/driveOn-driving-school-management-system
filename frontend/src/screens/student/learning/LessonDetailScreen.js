import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme';
import { getLearningLessonById, getVideoTutorials, upsertLessonProgress } from '../../../services/learningApi';
import { useAuth } from '../../../context/AuthContext';

export default function LessonDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { topicId, topicTitle, lessons } = route.params || {};
  
  // Debug log
  console.log('LessonDetailScreen params:', { topicId, topicTitle, lessons });
  
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lesson, setLesson] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentLesson = lessons?.[currentLessonIndex];

  const loadLessonData = useCallback(async () => {
    if (!currentLesson?._id) return;
    
    try {
      const [lessonRes, videosRes] = await Promise.all([
        getLearningLessonById(currentLesson._id),
        getVideoTutorials({ lesson: currentLesson._id }),
      ]);
      
      setLesson(lessonRes.data);
      setVideos(videosRes.data || []);
      
      // Check if lesson is completed
      setIsCompleted(lessonRes.data.progressPercentage === 100);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load lesson content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentLesson]);

  useEffect(() => {
    if (currentLesson) {
      setLoading(true);
      loadLessonData();
    }
  }, [currentLesson, loadLessonData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLessonData();
  }, [loadLessonData]);

  const handleMarkComplete = async () => {
    if (!lesson?._id) return;
    
    try {
      await upsertLessonProgress(lesson._id, {
        completionStatus: 'Completed',
        progressPercentage: 100,
      });
      
      setIsCompleted(true);
      Alert.alert('Success', 'Lesson marked as completed!');
      
      // Auto-advance to next lesson if available
      if (currentLessonIndex < lessons.length - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not mark lesson as completed');
    }
  };

  const handleDownloadResource = (resource) => {
    Alert.alert('Download', `Downloading ${resource.title}...`);
    // In real app, implement actual download logic
  };

  const handleStartQuiz = () => {
    if (lesson?.quizzes?.length > 0) {
      const quiz = lesson.quizzes[0];
      navigation.navigate('Quiz', { quizId: quiz._id, title: quiz.title });
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentLesson) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{topicTitle || 'Lesson Detail'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {!lessons || lessons.length === 0 
              ? 'No lessons available in this topic' 
              : 'No lesson selected'}
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{topicTitle}</Text>
        <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
          <Ionicons 
            name={isCompleted ? 'checkmark-circle' : 'radio-button-off'} 
            size={20} 
            color={isCompleted ? COLORS.green : COLORS.textMuted} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Lesson Navigation */}
        {lessons.length > 1 && (
          <View style={styles.lessonNavigation}>
            <TouchableOpacity 
              style={[styles.navBtn, currentLessonIndex === 0 && styles.navBtnDisabled]} 
              onPress={goToPreviousLesson}
              disabled={currentLessonIndex === 0}
            >
              <Ionicons name="chevron-back" size={16} color={currentLessonIndex === 0 ? COLORS.textMuted : COLORS.brandOrange} />
              <Text style={[styles.navBtnText, currentLessonIndex === 0 && styles.navBtnTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <View style={styles.lessonProgress}>
              <Text style={styles.lessonProgressText}>
                Lesson {currentLessonIndex + 1} of {lessons.length}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.navBtn, currentLessonIndex === lessons.length - 1 && styles.navBtnDisabled]} 
              onPress={goToNextLesson}
              disabled={currentLessonIndex === lessons.length - 1}
            >
              <Text style={[styles.navBtnText, currentLessonIndex === lessons.length - 1 && styles.navBtnTextDisabled]}>
                Next
              </Text>
              <Ionicons name="chevron-forward" size={16} color={currentLessonIndex === lessons.length - 1 ? COLORS.textMuted : COLORS.brandOrange} />
            </TouchableOpacity>
          </View>
        )}

        {/* Lesson Info */}
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
          <Text style={styles.lessonDescription}>{currentLesson.description || 'Learn essential driving concepts'}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoText}>{currentLesson.estimatedDuration || 0} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="bar-chart-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoText}>{lesson?.progressPercentage || 0}% complete</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${lesson?.progressPercentage || 0}%` }]} />
          </View>
        </View>

        {/* Video Player Placeholder */}
        {videos.length > 0 && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>Video Lessons</Text>
            {videos.map((video, index) => (
              <TouchableOpacity key={video._id} style={styles.videoCard}>
                <View style={styles.videoThumbnail}>
                  <Ionicons name="play-circle" size={32} color={COLORS.white} />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoDescription}>{video.description}</Text>
                  <Text style={styles.videoDuration}>{video.duration} min</Text>
                </View>
                <Ionicons name="download-outline" size={20} color={COLORS.brandOrange} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Lesson Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Lesson Notes</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Key Concepts</Text>
            <Text style={styles.noteContent}>
              {currentLesson.description || 'This lesson covers important driving concepts and safety practices. ' +
               'Pay attention to all details as they will help you become a safe and responsible driver.'}
            </Text>
          </View>
        </View>

        {/* Learning Resources */}
        {videos.length > 0 && (
          <View style={styles.resourcesSection}>
            <Text style={styles.sectionTitle}>Learning Resources</Text>
            {videos.map((video) => (
              <TouchableOpacity
                key={video._id}
                style={styles.resourceCard}
                onPress={() => handleDownloadResource(video)}
              >
                <View style={styles.resourceIcon}>
                  <Ionicons name="play-circle-outline" size={24} color={COLORS.brandOrange} />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{video.title}</Text>
                  <Text style={styles.resourceSize}>Video Tutorial</Text>
                </View>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Ionicons name="download-outline" size={20} color={COLORS.brandOrange} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quiz CTA */}
        {lesson?.quizzes?.length > 0 && (
          <View style={styles.quizSection}>
            <Text style={styles.sectionTitle}>Test Your Knowledge</Text>
            <TouchableOpacity style={styles.quizCta} onPress={handleStartQuiz}>
              <Ionicons name="help-circle" size={24} color={COLORS.white} />
              <Text style={styles.quizCtaText}>Start Quiz</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.textMuted, marginBottom: 16 },
  backBtn: { backgroundColor: COLORS.brandOrange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: COLORS.white, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.black, textAlign: 'center', marginHorizontal: 16 },
  completeBtn: { padding: 8 },
  content: { padding: 20, paddingBottom: 40 },
  
  // Lesson Navigation
  lessonNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.brandOrange },
  navBtnTextDisabled: { color: COLORS.textMuted },
  lessonProgress: { alignItems: 'center' },
  lessonProgressText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  
  // Lesson Info
  lessonInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  lessonTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  lessonDescription: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: { fontSize: 12, color: COLORS.textMuted },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.bgLight,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 3,
  },
  
  // Video Section
  videoSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 4 },
  videoDescription: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  videoDuration: { fontSize: 12, color: COLORS.textMuted },
  
  // Notes Section
  notesSection: { marginBottom: 32 },
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  noteTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  noteContent: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  
  // Resources Section
  resourcesSection: { marginBottom: 32 },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.brandOrange + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 4 },
  resourceSize: { fontSize: 12, color: COLORS.textMuted },
  downloadBtn: { padding: 8 },
  
  // Quiz Section
  quizSection: { marginBottom: 32 },
  quizCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quizCtaText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
