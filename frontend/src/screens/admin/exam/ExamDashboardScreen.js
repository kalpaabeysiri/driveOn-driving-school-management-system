import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { 
  getUpcomingTheoryExams, 
  getUpcomingPracticalExams,
  getProgressStats,
  getStudentProgress,
  getStudentResults
} from '../../../services/examApi';
import { useAuth } from '../../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const renderStatCard = (title, value, icon, color, subtitle = '') => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statIcon}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

export default function ExamDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState({
    theory: [],
    practical: []
  });
  const [studentStatus, setStudentStatus] = useState(null);

  // Defensive coding for user data
  const safeUser = user || {};
  const userName = safeUser.name || 'Admin';
  const userRole = safeUser.role || 'admin';

  const loadData = useCallback(async () => {
    try {
      if (userRole === 'admin' || userRole === 'instructor') {
        const [theoryExamsData, practicalExamsData] = await Promise.all([
          getUpcomingTheoryExams(),
          getUpcomingPracticalExams()
        ]);
        
        setUpcomingExams({
          theory: theoryExamsData.data || [],
          practical: practicalExamsData.data || []
        });

        // Try to load stats with error handling
        try {
          const statsData = await getProgressStats();
          setStats(statsData.data);
        } catch (statsError) {
          // Set default stats so dashboard doesn't fail completely
          setStats({
            statusDistribution: {},
            theoryPassRate: 0,
            practicalPassRate: 0,
            totalStudents: 0
          });
        }
      } else if (userRole === 'student') {
        const [theoryExamsData, practicalExamsData, progressData, resultsData] = await Promise.all([
          getUpcomingTheoryExams(),
          getUpcomingPracticalExams(),
          getStudentProgress(safeUser.studentId),
          getStudentResults(safeUser.studentId)
        ]);
        
        setUpcomingExams({
          theory: theoryExamsData.data || [],
          practical: practicalExamsData.data || []
        });
        setStudentStatus({
          progress: progressData.data,
          results: resultsData.data
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole, safeUser.studentId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const renderStatCard = (title, value, icon, color, subtitle = '') => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderExamCard = (exam, type) => {
    const seatsUsed = exam.enrolledStudents?.length || 0;
    const seatsAvailable = exam.maxSeats - seatsUsed;
    const isFull = seatsAvailable === 0;
    const utilizationRate = Math.round((seatsUsed / exam.maxSeats) * 100);

    return (
      <TouchableOpacity
        key={exam._id}
        style={styles.examCard}
        onPress={() => navigation.navigate('ExamDetails', { examType: type, examId: exam._id })}
      >
        <View style={styles.examHeader}>
          <View style={styles.examInfo}>
            <Text style={styles.examTitle}>
              {type === 'theory' ? exam.examName : `${exam.vehicleCategory} Practical`}
            </Text>
            <Text style={styles.examDate}>
              {new Date(exam.date).toLocaleDateString()} • {exam.startTime}
            </Text>
          </View>
          <View style={[
            styles.seatBadge,
            { backgroundColor: isFull ? COLORS.red : COLORS.green }
          ]}>
            <Text style={styles.seatBadgeText}>
              {seatsUsed}/{exam.maxSeats}
            </Text>
          </View>
        </View>
        
        <View style={styles.examDetails}>
          <Text style={styles.examLocation}>
            {type === 'theory' ? exam.locationOrHall : exam.trialLocation}
          </Text>
          {type === 'theory' && exam.language && (
            <Text style={styles.examLanguage}>Language: {exam.language}</Text>
          )}
        </View>

        <View style={styles.examFooter}>
          <View style={styles.utilizationBar}>
            <View style={[
              styles.utilizationFill,
              { width: `${utilizationRate}%`, backgroundColor: isFull ? COLORS.red : COLORS.brandOrange }
            ]} />
          </View>
          <Text style={styles.utilizationText}>{utilizationRate}% full</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentStatus = () => {
    if (!studentStatus) return null;

    const { progress, results } = studentStatus;
    const isAssignedToTheory = progress.overallStatus === 'Assigned for Theory Exam';
    const isAssignedToPractical = progress.overallStatus === 'Assigned for Practical Exam';

    return (
      <View style={styles.studentStatusCard}>
        <Text style={styles.sectionTitle}>My Status</Text>
        
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Overall Progress</Text>
            <Text style={styles.statusValue}>{progress.overallStatus}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Theory Status</Text>
            <Text style={styles.statusValue}>{progress.theoryExamStatus}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Practical Status</Text>
            <Text style={styles.statusValue}>{progress.practicalExamStatus}</Text>
          </View>
        </View>

        {(isAssignedToTheory || isAssignedToPractical) && (
          <View style={styles.assignmentAlert}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.brandOrange} />
            <Text style={styles.assignmentText}>
              You are assigned to {isAssignedToTheory ? 'Theory' : 'Practical'} exam
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
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
        <Text style={styles.title}>Exam Schedule</Text>
        {userRole === 'admin' ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateExam')}
          >
            <Ionicons name="add-circle-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {(userRole === 'admin' || userRole === 'instructor') && stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatCard(
                'Upcoming Theory',
                upcomingExams.theory?.length || 0,
                'book-outline',
                COLORS.blue
              )}
              {renderStatCard(
                'Upcoming Practical',
                upcomingExams.practical?.length || 0,
                'car-outline',
                COLORS.green
              )}
              {renderStatCard(
                'Total Students',
                stats.totalStudents || 0,
                'people-outline',
                COLORS.purple
              )}
              {renderStatCard(
                'Theory Pass Rate',
                `${stats.theoryPassRate || 0}%`,
                'checkmark-circle-outline',
                COLORS.brandOrange
              )}
            </View>
          </View>
        )}

        {/* Student Status */}
        {userRole === 'student' && renderStudentStatus()}

        {/* Upcoming Theory Exams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Theory Exams</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('TheoryExamList')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingExams.theory?.length > 0 ? (
            upcomingExams.theory.slice(0, 3).map(exam => renderExamCard(exam, 'theory'))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming theory exams</Text>
            </View>
          )}
        </View>

        {/* Upcoming Practical Exams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Practical Exams</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('PracticalExamList')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingExams.practical?.length > 0 ? (
            upcomingExams.practical.slice(0, 3).map(exam => renderExamCard(exam, 'practical'))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming practical exams</Text>
            </View>
          )}
        </View>

        {/* Progress Tracking — admin only */}
        {userRole === 'admin' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.progressTrackingBtn}
              onPress={() => navigation.navigate('ProgressTracking')}
            >
              <Ionicons name="bar-chart-outline" size={24} color={COLORS.white} />
              <Text style={styles.progressTrackingText}>View Progress Tracking</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
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
  container: { flex: 1 },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.black, flex: 1, textAlign: 'center' },
  createBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  importBtnText: { color: COLORS.white, fontWeight: '600', marginLeft: 4, fontSize: 12 },
  statsSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: COLORS.bgLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  statIcon: { marginBottom: 4 },
  statContent: {},
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  statTitle: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  statSubtitle: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },
  section: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  progressTrackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    padding: 16,
    gap: 12
  },
  progressTrackingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  viewAllBtn: {},
  viewAllText: { color: COLORS.brandOrange, fontWeight: '600', fontSize: 13 },
  examCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  examInfo: { flex: 1 },
  examTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  examDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  seatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8
  },
  seatBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  examDetails: { marginBottom: 8 },
  examLocation: { fontSize: 12, color: COLORS.textMuted },
  examLanguage: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  utilizationBar: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.bgLight,
    borderRadius: 2,
    marginRight: 8
  },
  utilizationFill: { height: '100%', borderRadius: 2 },
  utilizationText: { fontSize: 10, color: COLORS.textMuted },
  studentStatusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statusItem: { flex: 1 },
  statusLabel: { fontSize: 11, color: COLORS.textMuted },
  statusValue: { fontSize: 12, fontWeight: '600', color: COLORS.black, marginTop: 2 },
  assignmentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8ED',
    padding: 8,
    borderRadius: 8,
    marginTop: 6
  },
  assignmentText: { fontSize: 12, color: COLORS.brandOrange, marginLeft: 6 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 }
});
