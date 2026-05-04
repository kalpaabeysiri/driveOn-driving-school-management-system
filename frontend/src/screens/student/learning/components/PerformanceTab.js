import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

  const generatePDFReport = async () => {
    try {
      const studentName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';
      const date = new Date().toLocaleDateString();
      
      // Build quiz performance HTML
      let quizPerformanceHTML = '';
      if (performanceData.quizPerformanceByLesson?.length > 0) {
        quizPerformanceHTML = performanceData.quizPerformanceByLesson.map(lesson => {
          const quizzesHTML = lesson.quizzes.map(quiz => {
            const attemptsHTML = quiz.attempts.map(attempt => `
              <span class="attempt-badge ${attempt.status === 'Passed' ? 'attempt-passed' : 'attempt-failed'}">
                #${attempt.attemptNumber}: ${attempt.score}%
              </span>
            `).join('');
            
            return `
              <div class="quiz-item">
                <div class="quiz-header">
                  <span class="quiz-title">${quiz.quizTitle}</span>
                  <span class="best-score ${quiz.passed ? 'score-passed' : 'score-failed'}">Best: ${quiz.bestScore}%</span>
                </div>
                <div class="attempts-row">${attemptsHTML}</div>
              </div>
            `;
          }).join('');
          
          return `
            <div class="lesson-card">
              <div class="lesson-header">
                <span class="lesson-title">${lesson.lesson}</span>
                <span class="lesson-summary">${lesson.totalQuizzes} quizzes • ${lesson.totalAttempts} attempts</span>
              </div>
              <div class="quiz-list">${quizzesHTML}</div>
            </div>
          `;
        }).join('');
      } else {
        quizPerformanceHTML = '<p style="text-align: center; color: #666;">No quiz attempts yet</p>';
      }
      
      // Build recent activity HTML
      let activityHTML = '';
      if (performanceData.recentActivity?.length > 0) {
        activityHTML = performanceData.recentActivity.map(item => `
          <div class="activity-item">
            <span class="activity-icon">${item.type === 'quiz' ? '📝' : '✅'}</span>
            <div class="activity-content">
              <span class="activity-title">${item.title}</span>
              <span class="activity-date">${item.date}</span>
            </div>
            ${item.type === 'quiz' ? `<span class="activity-score">${item.score}%</span>` : ''}
          </div>
        `).join('');
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Performance Report - ${studentName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 40px;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #F97316;
            }
            .header h1 {
              color: #F97316;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .student-name {
              font-size: 22px;
              font-weight: bold;
              color: #333;
            }
            .report-date {
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #eee;
            }
            .stats-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              flex: 1;
              min-width: 120px;
              background: #f9f9f9;
              border-radius: 12px;
              padding: 15px;
              text-align: center;
              border: 1px solid #eee;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #F97316;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .lesson-card {
              background: #fff;
              border: 1px solid #eee;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 15px;
            }
            .lesson-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .lesson-title {
              font-weight: bold;
              font-size: 16px;
              color: #333;
            }
            .lesson-summary {
              font-size: 12px;
              color: #666;
            }
            .quiz-item {
              background: #f9f9f9;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 10px;
            }
            .quiz-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            .quiz-title {
              font-weight: 600;
              font-size: 14px;
            }
            .best-score {
              font-size: 12px;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
            }
            .score-passed {
              background: #DCFCE7;
              color: #16A34A;
            }
            .score-failed {
              background: #FEE2E2;
              color: #DC2626;
            }
            .attempts-row {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .attempt-badge {
              font-size: 11px;
              padding: 4px 8px;
              border-radius: 12px;
              font-weight: 600;
            }
            .attempt-passed {
              background: #DCFCE7;
              color: #16A34A;
            }
            .attempt-failed {
              background: #FEE2E2;
              color: #DC2626;
            }
            .attendance-card {
              background: #f9f9f9;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 15px;
            }
            .attendance-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 10px;
            }
            .attendance-title {
              font-weight: 600;
            }
            .attendance-bar {
              height: 8px;
              background: #eee;
              border-radius: 4px;
              margin: 10px 0;
            }
            .attendance-fill {
              height: 100%;
              background: #22C55E;
              border-radius: 4px;
            }
            .attendance-percentage {
              font-size: 14px;
              font-weight: bold;
              color: #22C55E;
            }
            .eligibility-card {
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .eligibility-pass {
              background: #DCFCE7;
              border: 2px solid #86EFAC;
            }
            .eligibility-fail {
              background: #FEE2E2;
              border: 2px solid #FECACA;
            }
            .eligibility-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 15px;
            }
            .eligibility-status {
              font-size: 18px;
              font-weight: bold;
            }
            .requirement-item {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .check-pass { color: #16A34A; }
            .check-fail { color: #DC2626; }
            .activity-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .activity-icon {
              font-size: 20px;
            }
            .activity-content {
              flex: 1;
            }
            .activity-title {
              font-weight: 600;
              font-size: 14px;
            }
            .activity-date {
              font-size: 12px;
              color: #666;
            }
            .activity-score {
              font-weight: bold;
              color: #F97316;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #999;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Performance Report</h1>
            <div class="student-name">${studentName}</div>
            <div class="report-date">Generated on ${date}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Overall Performance</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${performanceData.overallStats.averageScore}%</div>
                <div class="stat-label">Average Score</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${performanceData.overallStats.passedQuizzes}/${performanceData.overallStats.totalQuizzes}</div>
                <div class="stat-label">Quizzes Passed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${performanceData.overallStats.studyTime}h</div>
                <div class="stat-label">Study Time</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${performanceData.overallStats.totalAttempts}</div>
                <div class="stat-label">Total Attempts</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Quiz Performance by Lesson</div>
            ${quizPerformanceHTML}
          </div>
          
          <div class="section">
            <div class="section-title">Attendance Tracking</div>
            <div class="attendance-card">
              <div class="attendance-header">
                <span>Theory</span>
                <span class="attendance-title">Theory Sessions</span>
              </div>
              <div>${performanceData.attendance.theory.attended}/${performanceData.attendance.theory.total} attended</div>
              <div class="attendance-bar">
                <div class="attendance-fill" style="width: ${performanceData.attendance.theory.percentage}%"></div>
              </div>
              <div class="attendance-percentage">${performanceData.attendance.theory.percentage}%</div>
            </div>
            <div class="attendance-card">
              <div class="attendance-header">
                <span>Practical</span>
                <span class="attendance-title">Practical Sessions</span>
              </div>
              <div>${performanceData.attendance.practical.attended}/${performanceData.attendance.practical.total} attended</div>
              <div class="attendance-bar">
                <div class="attendance-fill" style="width: ${performanceData.attendance.practical.percentage}%"></div>
              </div>
              <div class="attendance-percentage">${performanceData.attendance.practical.percentage}%</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Exam Eligibility Status</div>
            <div class="eligibility-card ${performanceData.examEligibility.eligible ? 'eligibility-pass' : 'eligibility-fail'}">
              <div class="eligibility-header">
                <span style="font-size: 24px;">${performanceData.examEligibility.eligible ? 'Eligible' : 'Not Eligible'}</span>
                <span class="eligibility-status" style="color: ${performanceData.examEligibility.eligible ? '#16A34A' : '#DC2626'}">
                  ${performanceData.examEligibility.eligible ? 'Eligible for Exam' : 'Not Yet Eligible'}
                </span>
              </div>
              <div class="requirement-item">
                <span class="${performanceData.examEligibility.status.quizScoreMet ? 'check-pass' : 'check-fail'}">
                  ${performanceData.examEligibility.status.quizScoreMet ? 'Yes' : 'No'}
                </span>
                <span>Minimum quiz score (${performanceData.examEligibility.requirements.minimumQuizScore}%)</span>
              </div>
              <div class="requirement-item">
                <span class="${performanceData.examEligibility.status.attendanceMet ? 'check-pass' : 'check-fail'}">
                  ${performanceData.examEligibility.status.attendanceMet ? 'Yes' : 'No'}
                </span>
                <span>Minimum attendance (${performanceData.examEligibility.requirements.minimumAttendance}%)</span>
              </div>
              <div class="requirement-item">
                <span class="${performanceData.examEligibility.status.theoryCompleted ? 'check-pass' : 'check-fail'}">
                  ${performanceData.examEligibility.status.theoryCompleted ? 'Yes' : 'No'}
                </span>
                <span>Theory sessions completed (${performanceData.examEligibility.requirements.completedTheory})</span>
              </div>
              <div class="requirement-item">
                <span class="${performanceData.examEligibility.status.practicalCompleted ? 'check-pass' : 'check-fail'}">
                  ${performanceData.examEligibility.status.practicalCompleted ? 'Yes' : 'No'}
                </span>
                <span>Practical sessions completed (${performanceData.examEligibility.requirements.completedPractical})</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Recent Activity</div>
            ${activityHTML || '<p style="color: #666;">No recent activity</p>'}
          </div>
          
          <div class="footer">
            <p>This report was generated automatically by the DriveOn Learning Management System.</p>
            <p>For any questions, please contact your instructor or administrator.</p>
          </div>
        </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Performance Report',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not generate PDF report');
    }
  };

  const renderStatCard = (icon, label, value, color = COLORS.brandOrange) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderAttemptBadge = (attempt) => (
    <View key={attempt.attemptNumber} style={[styles.attemptBadge, attempt.status === 'Passed' ? styles.attemptPassed : styles.attemptFailed]}>
      <Text style={styles.attemptNumber}>#{attempt.attemptNumber}</Text>
      <Text style={styles.attemptScore}>{attempt.score}%</Text>
    </View>
  );

  const renderQuizItem = (quiz) => (
    <View key={quiz.quizTitle} style={styles.quizItem}>
      <View style={styles.quizHeader}>
        <Ionicons name="help-circle-outline" size={16} color={quiz.passed ? COLORS.green : COLORS.brandOrange} />
        <Text style={styles.quizTitle}>{quiz.quizTitle}</Text>
        <View style={[styles.bestScoreBadge, quiz.passed ? styles.bestScorePassed : styles.bestScoreFailed]}>
          <Text style={styles.bestScoreText}>Best: {quiz.bestScore}%</Text>
        </View>
      </View>
      <Text style={styles.attemptCount}>{quiz.totalAttempts} attempt{quiz.totalAttempts !== 1 ? 's' : ''}</Text>
      <View style={styles.attemptsRow}>
        {quiz.attempts.map(renderAttemptBadge)}
      </View>
    </View>
  );

  const renderLessonItem = (lesson) => (
    <View key={lesson.lesson} style={styles.lessonCard}>
      <View style={styles.lessonHeader}>
        <Ionicons name="book-outline" size={20} color={COLORS.brandOrange} />
        <Text style={styles.lessonTitle}>{lesson.lesson}</Text>
        <View style={styles.lessonSummary}>
          <Text style={styles.lessonSummaryText}>{lesson.totalQuizzes} quizzes</Text>
          <Text style={styles.lessonSummaryDot}>•</Text>
          <Text style={styles.lessonSummaryText}>{lesson.totalAttempts} attempts</Text>
        </View>
      </View>
      <View style={styles.quizList}>
        {lesson.quizzes.map(renderQuizItem)}
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

        {/* Quiz Performance by Lesson */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiz Performance by Lesson</Text>
          <View style={styles.lessonList}>
            {performanceData.quizPerformanceByLesson?.length > 0 ? (
              performanceData.quizPerformanceByLesson.map(renderLessonItem)
            ) : (
              <Text style={styles.emptySectionText}>No quiz attempts yet</Text>
            )}
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
        <TouchableOpacity style={styles.generateReportBtn} onPress={generatePDFReport}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
          <Text style={styles.generateReportText}>Generate PDF Report</Text>
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
  
  // Hierarchical: Lessons → Quizzes → Attempts
  lessonList: { gap: 16 },
  lessonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lessonTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black, flex: 1 },
  lessonSummary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonSummaryText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  lessonSummaryDot: { fontSize: 12, color: COLORS.textMuted },
  quizList: { gap: 12 },
  quizItem: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 12,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  quizTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, flex: 1 },
  bestScoreBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestScorePassed: { backgroundColor: '#DCFCE7' },
  bestScoreFailed: { backgroundColor: '#FEE2E2' },
  bestScoreText: { fontSize: 11, fontWeight: '700', color: COLORS.black },
  attemptCount: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  attemptsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attemptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  attemptPassed: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  attemptFailed: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  attemptNumber: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  attemptScore: { fontSize: 12, fontWeight: '800', color: COLORS.black },
  emptySectionText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
  
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
