import React, { useState, useEffect } from 'react';
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
import { getStudentExamById } from '../../services/studentExamApi';

export default function StudentExamDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { examId, examType } = route.params;
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const response = await getStudentExamById(examId);
      setExam(response.data.exam);
    } catch (error) {
      Alert.alert('Error', 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExam();
    setRefreshing(false);
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!exam) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Exam not found</Text>
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
        <Text style={styles.title}>Exam Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Exam Info Card */}
        <View style={styles.examInfoCard}>
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

          <View style={styles.assignmentStatus}>
            <Ionicons 
              name={exam.isAssigned ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={exam.isAssigned ? COLORS.green : COLORS.textMuted} 
            />
            <Text style={styles.assignmentText}>
              {exam.isAssigned ? 'You are assigned to this exam' : 'You are not assigned to this exam'}
            </Text>
          </View>
        </View>

        {/* Exam Details */}
        <View style={styles.examDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {new Date(exam.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {exam.startTime} - {exam.endTime}
            </Text>
          </View>

          {exam.type === 'theory' && (
            <View style={styles.detailRow}>
              <Ionicons name="book-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.detailText}>
                Language: {exam.language}
              </Text>
            </View>
          )}

          {exam.type === 'theory' && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.detailText}>
                {exam.locationOrHall}
              </Text>
            </View>
          )}

          {exam.type === 'practical' && (
            <View style={styles.detailRow}>
              <Ionicons name="car-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.detailText}>
                Vehicle: {exam.vehicleCategory}
              </Text>
            </View>
          )}

          {exam.type === 'practical' && (
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.detailText}>
                {exam.trialLocation}
              </Text>
            </View>
          )}
        </View>

        {/* Seat Status */}
        <View style={styles.seatStatus}>
          <View style={styles.seatInfo}>
            <Text style={styles.seatLabel}>Seat Availability</Text>
            <Text style={styles.seatCount}>
              {exam.seatsUsed}/{exam.maxSeats} seats used
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

        {/* Created By Info */}
        {exam.createdBy && (
          <View style={styles.createdBySection}>
            <Text style={styles.sectionTitle}>Created By</Text>
            <View style={styles.createdByCard}>
              <Text style={styles.createdByName}>{exam.createdBy.name}</Text>
              <Text style={styles.createdByEmail}>{exam.createdBy.email}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: '600', color: COLORS.black },
  placeholder: { width: 24 },
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  examInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
  assignmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    marginBottom: 16
  },
  assignmentText: { fontSize: 16, color: COLORS.black, marginLeft: 12 },
  examDetails: { marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  detailText: { fontSize: 16, color: COLORS.textMuted, marginLeft: 8 },
  seatStatus: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16
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
  createdBySection: {
    marginTop: 20
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  createdByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 16
  },
  createdByName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  createdByEmail: { fontSize: 14, color: COLORS.textMuted, marginLeft: 8 },
  errorText: { fontSize: 16, color: COLORS.red, textAlign: 'center' }
});
