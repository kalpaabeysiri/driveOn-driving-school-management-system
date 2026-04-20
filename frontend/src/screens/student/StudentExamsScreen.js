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
  getStudentExams, 
  getStudentExamById, 
  getStudentExamStatus 
} from '../../services/studentExamApi';

export default function StudentExamsScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);
  const [examStatus, setExamStatus] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [examsData, statusData] = await Promise.all([
        getStudentExams(),
        getStudentExamStatus()
      ]);
      
      setExams(examsData.data.exams || []);
      setExamStatus(statusData.data.status);
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
    const isUpcoming = new Date(exam.date) > new Date();
    
    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => navigation.navigate('StudentExamDetails', { examId: exam._id, examType: exam.type })}
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
          <View style={styles.seatInfo}>
            <Text style={styles.seatLabel}>Seats</Text>
            <Text style={styles.seatCount}>
              {exam.seatsUsed}/{exam.maxSeats}
            </Text>
          </View>
          <View style={styles.seatBar}>
            <View style={[
              styles.seatFill,
              { 
                width: `${(exam.seatsUsed / exam.maxSeats) * 100}%`,
                backgroundColor: exam.seatsUsed >= exam.maxSeats ? COLORS.red : COLORS.brandOrange
              }
            ]} />
          </View>
        </View>
        
        {isUpcoming && (
          <View style={styles.upcomingBadge}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
            <Text style={styles.upcomingText}>Upcoming</Text>
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

      {/* Exam Status Summary */}
      {examStatus && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Exam Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{examStatus.totalAssignedExams}</Text>
              <Text style={styles.statusLabel}>Total Assigned</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{examStatus.upcomingExams}</Text>
              <Text style={styles.statusLabel}>Upcoming</Text>
            </View>
            {examStatus.nextExam && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Next Exam</Text>
                <Text style={styles.nextExamText}>
                  {examStatus.nextExam.type === 'theory' ? examStatus.nextExam.examName : `${examStatus.nextExam.vehicleCategory} Exam`}
                </Text>
                <Text style={styles.nextExamDate}>
                  {new Date(examStatus.nextExam.date).toLocaleDateString()}
                </Text>
              </View>
            )}
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
            <Text style={styles.emptyText}>No assigned exams</Text>
            <Text style={styles.emptySubtext}>
              You haven't been assigned to any exams yet
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
  statusCard: {
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
  statusTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
  statusGrid: { flexDirection: 'row', gap: 16 },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 16
  },
  statusValue: { fontSize: 24, fontWeight: '700', color: COLORS.brandOrange, marginBottom: 4 },
  statusLabel: { fontSize: 12, color: COLORS.textMuted },
  nextExamText: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginTop: 4 },
  nextExamDate: { fontSize: 12, color: COLORS.textMuted },
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
  examTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: COLORS.black, 
    marginBottom: 4,
    flex: 1,
    flexWrap: 'wrap'
  },
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
  detailText: { 
    fontSize: 14, 
    color: COLORS.textMuted, 
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap'
  },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  seatInfo: { flex: 1 },
  seatLabel: { fontSize: 12, color: COLORS.textMuted },
  seatCount: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  seatBar: {
    height: 4,
    backgroundColor: COLORS.bgLight,
    borderRadius: 2,
    marginBottom: 6
  },
  seatFill: { height: '100%', borderRadius: 2 },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  upcomingText: { color: COLORS.white, fontSize: 10, fontWeight: '600', marginLeft: 4 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: { fontSize: 18, color: COLORS.textMuted, textAlign: 'center', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' }
});
