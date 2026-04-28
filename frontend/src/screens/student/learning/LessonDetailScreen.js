import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme';
import { getLearningLessonById, getVideoTutorials, upsertLessonProgress } from '../../../services/learningApi';
import { useAuth } from '../../../context/AuthContext';

export default function LessonDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { topicId, topicTitle, lessons } = route.params || {};
  
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lesson, setLesson] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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

  const handlePlayVideo = (video) => {
    if (video.videoUrl) {
      Linking.openURL(video.videoUrl).catch(() => {
        Alert.alert('Error', 'Could not open video URL');
      });
    } else {
      Alert.alert('Video Info', 'This video is available for download only.');
    }
  };

  
  const handleStartQuiz = () => {
    if (lesson?.quizzes?.length > 0) {
      const quiz = lesson.quizzes[0];
      navigation.navigate('LearningQuizTake', { quizId: quiz._id });
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

  const handleMarkComplete = async () => {
    if (!lesson?._id) return;
    
    try {
      await upsertLessonProgress(lesson._id, {
        completionStatus: 'Completed',
        progressPercentage: 100,
      });
      
      setIsCompleted(true);
      Alert.alert('✅ Lesson Complete!', 'Great job! You can move to the next lesson.');
      
      // Auto-advance to next lesson if available
      if (currentLessonIndex < lessons.length - 1) {
        setTimeout(() => setCurrentLessonIndex(currentLessonIndex + 1), 1500);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not mark lesson as completed');
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
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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

        {/* Video Lessons */}
        {videos.length > 0 && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>📹 Video Tutorials</Text>
            {videos.map((video, index) => (
              <TouchableOpacity key={video._id} style={styles.videoCard} onPress={() => handlePlayVideo(video)}>
                <View style={styles.videoThumbnail}>
                  <Ionicons name="play-circle" size={32} color={COLORS.white} />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoMeta}>{video.duration} min • {video.status || 'Available'}</Text>
                  {video.videoUrl && (
                    <Text style={styles.videoUrlHint}>🔗 External video</Text>
                  )}
                </View>
                <View style={styles.playBtn}>
                  <Ionicons name="play-outline" size={20} color={COLORS.brandOrange} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completion Steps */}
        <View style={styles.completionSection}>
          <Text style={styles.sectionTitle}>✅ Complete This Lesson</Text>
          <View style={styles.completionSteps}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, isCompleted && styles.stepCompleted]}>
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.stepText}>Watch all videos</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNumber, isCompleted && styles.stepCompleted]}>
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.stepText}>Review lesson content</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNumber, isCompleted && styles.stepCompleted]}>
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.stepText}>Take the quiz (if available)</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.completeLessonBtn, isCompleted && styles.completedBtn]} 
            onPress={handleMarkComplete}
            disabled={isCompleted}
          >
            <Ionicons 
              name={isCompleted ? 'checkmark-circle' : 'radio-button-off'} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.completeBtnText}>
              {isCompleted ? 'Lesson Completed!' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quiz CTA */}
        {lesson?.quizzes?.length > 0 && !isCompleted && (
          <View style={styles.quizSection}>
            <Text style={styles.sectionTitle}>🎯 Test Your Knowledge</Text>
            <TouchableOpacity style={styles.quizCta} onPress={handleStartQuiz}>
              <Ionicons name="help-circle" size={20} color={COLORS.white} />
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
  videoSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  videoThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 4 },
  videoMeta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  videoUrlHint: { fontSize: 10, color: COLORS.brandOrange, fontWeight: '500' },
  playBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 8,
    padding: 8,
  },

  // Completion Section
  completionSection: { marginBottom: 24 },
  completionSteps: { gap: 12, marginBottom: 16 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: { backgroundColor: COLORS.green },
  stepText: { fontSize: 14, color: COLORS.black, fontWeight: '500' },
  completeLessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  completedBtn: { backgroundColor: COLORS.green },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  // Quiz Section
  quizSection: { marginBottom: 24 },
  quizCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  quizCtaText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
