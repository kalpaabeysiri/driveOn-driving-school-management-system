import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../theme';
import { getStudentPerformance } from '../../../../services/learningApi';
import { useAuth } from '../../../../context/AuthContext';

export default function PerformanceTab({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  const loadPerformanceData = useCallback(async () => {
    try {
      const res = await getStudentPerformance();
      setPerformanceData(res.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPerformanceData();
  }, [loadPerformanceData]);

  const generateReport = async () => {
    try {
      const reportData = {
        student: user.name,
        date: new Date().toLocaleDateString(),
        performance: performanceData,
      };
      
      await Share.share({
        message: `📊 Performance Report for ${user.name}\n\n` +
                 `Average Score: ${performanceData.overallStats.averageScore}%\n` +
                 `Quizzes Passed: ${performanceData.overallStats.passedQuizzes}/${performanceData.overallStats.totalQuizzes}\n` +
                 `Study Time: ${performanceData.overallStats.studyTime} hours\n` +
                 `Attendance: Theory ${performanceData.attendance.theory.percentage}%, Practical ${performanceData.attendance.practical.percentage}%\n\n` +
                 `Generated on ${new Date().toLocaleDateString()}`,
        title: 'Learning Performance Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not generate report');
    }
  };

  const renderStatCard = (icon, label, value, color = COLORS.brandOrange) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderQuizScoreItem = (item) => (
    <View key={item.quiz} style={styles.scoreItem}>
      <View style={styles.scoreInfo}>
        <Text style={styles.scoreQuizTitle}>{item.quiz}</Text>
        <Text style={styles.scoreAverage}>Avg: {item.average.toFixed(1)}%</Text>
      </View>
      <View style={styles.scoreTrend}>
        {item.trend === 'up' && <Ionicons name="trending-up" size={16} color={COLORS.green} />}
        {item.trend === 'down' && <Ionicons name="trending-down" size={16} color={COLORS.red} />}
        {item.trend === 'stable' && <Ionicons name="remove" size={16} color={COLORS.textMuted} />}
        {item.trend === 'not_attempted' && <Ionicons name="help-outline" size={16} color={COLORS.textMuted} />}
      </View>
      <View style={styles.scoreBars}>
        {item.scores.map((score, index) => (
          <View key={index} style={[styles.scoreBar, { height: `${score}%`, backgroundColor: score >= 75 ? COLORS.green : COLORS.brandOrange }]} />
        ))}
        {item.scores.length === 0 && <View style={[styles.scoreBar, { height: 4, backgroundColor: COLORS.bgLight }]} />}
      </View>
    </View>
  );

  const renderActivityItem = (item, index) => (
    <View key={index} style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: item.type === 'quiz' ? COLORS.brandOrange + '20' : COLORS.green + '20' }]}>
        <Ionicons 
          name={item.type === 'quiz' ? 'help-circle-outline' : 'checkmark-circle-outline'} 
          size={16} 
          color={item.type === 'quiz' ? COLORS.brandOrange : COLORS.green} 
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDate}>{item.date}</Text>
      </View>
      {item.type === 'quiz' && (
        <Text style={styles.activityScore}>{item.score}%</Text>
      )}
      {item.type === 'lesson' && (
        <Ionicons name="checkmark" size={16} color={COLORS.green} />
      )}
    </View>
  );

  if (!performanceData) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No performance data available</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadPerformanceData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('analytics-outline', 'Avg Score', `${performanceData.overallStats.averageScore}%`, COLORS.brandOrange)}
            {renderStatCard('help-circle-outline', 'Quizzes Passed', `${performanceData.overallStats.passedQuizzes}/${performanceData.overallStats.totalQuizzes}`, COLORS.green)}
            {renderStatCard('time-outline', 'Study Time', `${performanceData.overallStats.studyTime}h`, COLORS.blue)}
            {renderStatCard('trophy-outline', 'Attempts', performanceData.overallStats.totalAttempts, COLORS.purple)}
          </View>
        </View>

        {/* Quiz Scores Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiz Performance</Text>
          <View style={styles.scoreList}>
            {performanceData.quizScores.map(renderQuizScoreItem)}
          </View>
        </View>

        {/* Attendance Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Tracking</Text>
          <View style={styles.attendanceCards}>
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <Ionicons name="book-outline" size={20} color={COLORS.blue} />
                <Text style={styles.attendanceTitle}>Theory Sessions</Text>
              </View>
              <Text style={styles.attendanceCount}>{performanceData.attendance.theory.attended}/{performanceData.attendance.theory.total}</Text>
              <View style={styles.attendanceBar}>
                <View style={[styles.attendanceFill, { width: `${performanceData.attendance.theory.percentage}%` }]} />
              </View>
              <Text style={styles.attendancePercentage}>{performanceData.attendance.theory.percentage}%</Text>
            </View>

            <View style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <Ionicons name="car-outline" size={20} color={COLORS.green} />
                <Text style={styles.attendanceTitle}>Practical Sessions</Text>
              </View>
              <Text style={styles.attendanceCount}>{performanceData.attendance.practical.attended}/{performanceData.attendance.practical.total}</Text>
              <View style={styles.attendanceBar}>
                <View style={[styles.attendanceFill, { width: `${performanceData.attendance.practical.percentage}%` }]} />
              </View>
              <Text style={styles.attendancePercentage}>{performanceData.attendance.practical.percentage}%</Text>
            </View>
          </View>
        </View>

        {/* Exam Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exam Eligibility Status</Text>
          <View style={[styles.eligibilityCard, { backgroundColor: performanceData.examEligibility.eligible ? COLORS.greenBg : COLORS.redBg }]}>
            <View style={styles.eligibilityHeader}>
              <Ionicons 
                name={performanceData.examEligibility.eligible ? 'checkmark-circle' : 'close-circle'} 
                size={24} 
                color={performanceData.examEligibility.eligible ? COLORS.green : COLORS.red} 
              />
              <Text style={[styles.eligibilityStatus, { color: performanceData.examEligibility.eligible ? COLORS.green : COLORS.red }]}>
                {performanceData.examEligibility.eligible ? 'Eligible for Exam' : 'Not Yet Eligible'}
              </Text>
            </View>
            
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={performanceData.examEligibility.status.quizScoreMet ? 'checkmark' : 'close'} 
                  size={16} 
                  color={performanceData.examEligibility.status.quizScoreMet ? COLORS.green : COLORS.red} 
                />
                <Text style={styles.requirementText}>Minimum quiz score ({performanceData.examEligibility.requirements.minimumQuizScore}%)</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={performanceData.examEligibility.status.attendanceMet ? 'checkmark' : 'close'} 
                  size={16} 
                  color={performanceData.examEligibility.status.attendanceMet ? COLORS.green : COLORS.red} 
                />
                <Text style={styles.requirementText}>Minimum attendance ({performanceData.examEligibility.requirements.minimumAttendance}%)</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={performanceData.examEligibility.status.theoryCompleted ? 'checkmark' : 'close'} 
                  size={16} 
                  color={performanceData.examEligibility.status.theoryCompleted ? COLORS.green : COLORS.red} 
                />
                <Text style={styles.requirementText}>Theory sessions completed ({performanceData.examEligibility.requirements.completedTheory})</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons 
                  name={performanceData.examEligibility.status.practicalCompleted ? 'checkmark' : 'close'} 
                  size={16} 
                  color={performanceData.examEligibility.status.practicalCompleted ? COLORS.green : COLORS.red} 
                />
                <Text style={styles.requirementText}>Practical sessions completed ({performanceData.examEligibility.requirements.completedPractical})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {performanceData.recentActivity.map(renderActivityItem)}
          </View>
        </View>

        {/* Generate Report Button */}
        <TouchableOpacity style={styles.generateReportBtn} onPress={generateReport}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
          <Text style={styles.generateReportText}>Generate Performance Report</Text>
          <Ionicons name="share-outline" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginBottom: 16 },
  retryBtn: { backgroundColor: COLORS.brandOrange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: COLORS.white, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 16 },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.black },
  statLabel: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  
  // Quiz Scores
  scoreList: { gap: 12 },
  scoreItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  scoreInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scoreQuizTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  scoreAverage: { fontSize: 12, color: COLORS.textMuted },
  scoreTrend: { alignItems: 'center' },
  scoreBars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
    height: 20,
  },
  scoreBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  
  // Attendance
  attendanceCards: { gap: 12 },
  attendanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  attendanceTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  attendanceCount: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  attendanceBar: {
    height: 6,
    backgroundColor: COLORS.bgLight,
    borderRadius: 3,
    marginBottom: 4,
  },
  attendanceFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 3,
  },
  attendancePercentage: { fontSize: 12, color: COLORS.textMuted },
  
  // Eligibility
  eligibilityCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  eligibilityStatus: { fontSize: 16, fontWeight: '700' },
  requirementsList: { gap: 8 },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: { fontSize: 12, color: COLORS.black },
  
  // Activity
  activityList: { gap: 8 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  activityDate: { fontSize: 12, color: COLORS.textMuted },
  activityScore: { fontSize: 14, fontWeight: '700', color: COLORS.brandOrange },
  
  // Generate Report
  generateReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  generateReportText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
