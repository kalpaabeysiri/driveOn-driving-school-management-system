import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';
import { 
  getInstructorUpcomingExams, 
  getInstructorUpcomingExamCounts 
} from '../../services/instructorExamApi';

export default function InstructorExamsScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);
  const [examCounts, setExamCounts] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [examsData, countsData] = await Promise.all([
        getInstructorUpcomingExams(),
        getInstructorUpcomingExamCounts()
      ]);
      
      setExams(examsData.data.exams || []);
      setExamCounts(countsData.data.counts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load your exams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return COLORS.blue;
      case 'Completed':
        return COLORS.green;
      case 'Cancelled':
        return COLORS.red;
      default:
        return COLORS.textMuted;
    }
  };

  const renderExamCard = (exam) => {
    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => navigation.navigate('InstructorExamDetails', { examId: exam._id, examType: exam.type })}
      >
        <View style={styles.examHeader}>
          <View style={styles.examInfo}>
            <Text style={styles.examTitle}>
              {exam.type === 'theory' ? exam.examName : `${exam.vehicleCategory} Practical Exam`}
            </Text>
            <Text style={styles.examDate}>
              {new Date(exam.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) }]}>
            <Text style={styles.statusText}>{exam.status}</Text>
          </View>
        </View>
        
        <View style={styles.examDetails}>
          <View style={styles.detailRow}>
            <Ionicons 
              name={exam.type === 'theory' ? 'book-outline' : 'car-outline'} 
              size={20} 
              color={COLORS.textMuted} 
            />
            <Text style={styles.detailText}>
              {exam.type === 'theory' ? exam.language : exam.vehicleCategory}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {exam.type === 'theory' ? exam.locationOrHall : exam.trialLocation}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {exam.startTime} - {exam.endTime}
            </Text>
          </View>
        </View>
        
        <View style={styles.examFooter}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentLabel}>Students</Text>
            <Text style={styles.studentCount}>
              {exam.enrolledStudents}/{exam.maxSeats}
            </Text>
          </View>
          <View style={styles.seatBar}>
            <View style={[
              styles.seatFill,
              { 
                width: `${(exam.enrolledStudents / exam.maxSeats) * 100}%`,
                backgroundColor: exam.enrolledStudents >= exam.maxSeats ? COLORS.red : COLORS.brandOrange
              }
            ]} />
          </View>
        </View>

        {/* Practical Exam Specific Info */}
        {exam.type === 'practical' && (
          <View style={styles.practicalInfo}>
            {exam.examiner && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.textMuted} />
                <Text style={styles.detailText}>
                  Examiner: {exam.examiner.fullName}
                </Text>
              </View>
            )}
            {exam.assignedVehicle && (
              <View style={styles.detailRow}>
                <Ionicons name="car-outline" size={20} color={COLORS.textMuted} />
                <Text style={styles.detailText}>
                  Vehicle: {exam.assignedVehicle.vehicleNumber}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
        <Text style={styles.title}>My Exam Schedule</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Exam Counts Summary */}
      {examCounts && (
        <View style={styles.countsCard}>
          <Text style={styles.countsTitle}>Exam Overview</Text>
          <View style={styles.countsGrid}>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{examCounts.totalExams}</Text>
              <Text style={styles.countLabel}>Total Exams</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{examCounts.theoryExams}</Text>
              <Text style={styles.countLabel}>Theory</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{examCounts.practicalExams}</Text>
              <Text style={styles.countLabel}>Practical</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{examCounts.totalAssignedStudents}</Text>
              <Text style={styles.countLabel}>Total Students</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {exams.length > 0 ? (
          exams.map(exam => renderExamCard(exam))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No upcoming exams</Text>
            <Text style={styles.emptySubtext}>
              You don't have any scheduled exams
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.black, flex: 1, textAlign: 'center' },
  placeholder: { width: 24 },
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  countsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  countsTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
  countsGrid: { flexDirection: 'row', gap: 16 },
  countItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 16
  },
  countValue: { fontSize: 24, fontWeight: '700', color: COLORS.brandOrange, marginBottom: 4 },
  countLabel: { fontSize: 12, color: COLORS.textMuted },
  examCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  examInfo: { flex: 1 },
  examTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 4 },
  examDate: { fontSize: 14, color: COLORS.textMuted },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  examDetails: { marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  detailText: { fontSize: 14, color: COLORS.textMuted, marginLeft: 8 },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  studentInfo: { flex: 1 },
  studentLabel: { fontSize: 12, color: COLORS.textMuted },
  studentCount: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  seatBar: {
    height: 4,
    backgroundColor: COLORS.bgLight,
    borderRadius: 2,
    marginBottom: 6
  },
  seatFill: { height: '100%', borderRadius: 2 },
  practicalInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: { fontSize: 18, color: COLORS.textMuted, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' }
});
