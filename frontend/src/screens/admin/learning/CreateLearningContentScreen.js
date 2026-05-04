import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getLearningTopics, getLearningLessons } from '../../../services/learningApi';

export default function CreateLearningContentScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [topicCount, setTopicCount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);

  const loadCounts = useCallback(async () => {
    try {
      const [topics, lessons] = await Promise.all([
        getLearningTopics(),
        getLearningLessons(),
      ]);
      setTopicCount(topics.data?.length || 0);
      setLessonCount(lessons.data?.length || 0);
    } catch {
      // counts stay at 0
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  const contentTypes = [
    {
      id: 'topic',
      title: 'Create Topic',
      description: 'Create a new learning topic with lessons and quizzes',
      icon: 'folder-outline',
      color: COLORS.blue,
      screen: 'AdminTopics',
    },
    {
      id: 'lesson',
      title: 'Create Lesson',
      description: 'Select a topic, then add lessons inside it',
      icon: 'book-outline',
      color: COLORS.green,
      screen: 'AdminTopics',
    },
    {
      id: 'quiz',
      title: 'Create Quiz',
      description: 'Pick a lesson directly and build or manage its quizzes',
      icon: 'help-circle-outline',
      color: COLORS.brandOrange,
      screen: 'AdminQuizLessons',
    },
    {
      id: 'video',
      title: 'Upload Video',
      description: 'Pick a lesson directly and upload a video tutorial',
      icon: 'videocam-outline',
      color: COLORS.red,
      screen: 'AdminVideoUpload',
    },
    {
      id: 'material',
      title: 'Add Study Material',
      description: 'Select a topic → lesson, then add materials',
      icon: 'document-text-outline',
      color: COLORS.purple,
      screen: 'AdminTopics',
    },
  ];

  const handleContentCreation = (contentType) => {
    // Navigate to the appropriate screen
    navigation.navigate(contentType.screen);
  };

  const quickActions = [
    {
      title: 'Manage Topics',
      subtitle: 'View, create and organise learning topics',
      icon: 'folder-outline',
      action: () => navigation.navigate('AdminTopics'),
    },
    {
      title: 'All Lessons',
      subtitle: 'Browse all lessons across every topic',
      icon: 'library-outline',
      action: () => navigation.navigate('AdminTopics'),
    },
    {
      title: 'Progress Tracking',
      subtitle: 'Monitor student exam progress',
      icon: 'bar-chart-outline',
      action: () => navigation.navigate('ProgressTracking'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Learning Content</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="school-outline" size={32} color={COLORS.brandOrange} />
          </View>
          <Text style={styles.welcomeTitle}>Learning Content Creator</Text>
          <Text style={styles.welcomeDesc}>
            Create engaging learning materials including topics, lessons, quizzes, and video tutorials
          </Text>
        </View>

        {/* Content Creation Options */}
        <Text style={styles.sectionTitle}>Create New Content</Text>
        <View style={styles.contentGrid}>
          {contentTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.contentCard}
              onPress={() => handleContentCreation(type)}
            >
              <View style={[styles.contentIcon, { backgroundColor: `${type.color}20` }]}>
                <Ionicons name={type.icon} size={28} color={type.color} />
              </View>
              <Text style={styles.contentTitle}>{type.title}</Text>
              <Text style={styles.contentDesc}>{type.description}</Text>
              <View style={styles.contentArrow}>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.action}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={20} color={COLORS.brandOrange} />
              </View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Section */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Content Overview</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.brandOrange} style={{ marginTop: 8 }} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{topicCount}</Text>
                <Text style={styles.statLabel}>Topics</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{lessonCount}</Text>
                <Text style={styles.statLabel}>Lessons</Text>
              </View>
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.helpText}>
            Start by creating topics, then add lessons and quizzes to build comprehensive learning modules for all students.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  
  // Welcome Section
  welcomeCard: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },

  // Content Grid
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  contentCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    position: 'relative',
  },
  contentIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
  },
  contentDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  contentArrow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },

  // Quick Actions
  quickActions: {
    marginBottom: 24,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Stats
  statsCard: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.brandOrange,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },

  // Help
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
