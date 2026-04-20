import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput, RefreshControl, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import {
  getTheoryExamById,
  getPracticalExamById,
  getAssignableStudents,
  getAssignablePracticalStudents,
  assignStudentToTheoryExam,
  unassignStudentFromTheoryExam,
  assignStudentToPracticalExam,
  unassignStudentFromPracticalExam
} from '../../../services/examApi';
import { useAuth } from '../../../context/AuthContext';

export default function ExamDetailsScreen({ route, navigation }) {
  const { examType, examId } = route.params;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exam, setExam] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignableStudents, setAssignableStudents] = useState([]);
  const [nonAssignableStudents, setNonAssignableStudents] = useState([]);
  const [searchStudents, setSearchStudents] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const examData = examType === 'theory' 
        ? await getTheoryExamById(examId)
        : await getPracticalExamById(examId);
      
      setExam(examData.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load exam details');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examType, examId, navigation]);

  const loadAssignableStudents = useCallback(async () => {
    try {
      const response = examType === 'theory'
        ? await getAssignableStudents(examId)
        : await getAssignablePracticalStudents(examId);
      
      setAssignableStudents(response.data.assignableStudents);
      setNonAssignableStudents(response.data.nonAssignableStudents);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load assignable students');
    }
  }, [examType, examId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const openAssignModal = () => {
    if (exam.status !== 'Scheduled') {
      Alert.alert('Cannot Assign', 'Only scheduled exams can have students assigned');
      return;
    }
    
    if (exam.isFull) {
      Alert.alert('Exam Full', 'This exam has no available seats');
      return;
    }

    loadAssignableStudents();
    setShowAssignModal(true);
  };

  const handleAssignStudent = async (studentId) => {
    try {
      setAssigning(true);
      
      if (examType === 'theory') {
        await assignStudentToTheoryExam(examId, studentId);
      } else {
        await assignStudentToPracticalExam(examId, studentId);
      }

      Alert.alert('Success', 'Student assigned successfully');
      setShowAssignModal(false);
      loadData(); // Refresh exam data
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not assign student');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    Alert.alert(
      'Unassign Student',
      'Are you sure you want to unassign this student from the exam?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              if (examType === 'theory') {
                await unassignStudentFromTheoryExam(examId, studentId);
              } else {
                await unassignStudentFromPracticalExam(examId, studentId);
              }

              Alert.alert('Success', 'Student unassigned successfully');
              loadData(); // Refresh exam data
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Could not unassign student');
            }
          }
        }
      ]
    );
  };

  const renderStudentCard = (student, isEnrolled = false, key) => {
    const canAssign = user.role === 'admin' && !isEnrolled && !exam.isFull && exam.status === 'Scheduled';
    
    return (
      <View key={String(key || student._id || student.studentId)} style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <View style={styles.studentAvatar}>
            <Text style={styles.avatarText}>
              {(student.fullName || 'S').split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{student.fullName}</Text>
            <Text style={styles.studentEmail}>{student.email}</Text>
            <Text style={styles.studentContact}>{student.contactNo}</Text>
            {student.reasons && (
              <View style={styles.reasonsContainer}>
                {student.reasons.map((reason, index) => (
                  <Text key={index} style={styles.reasonText}>• {reason}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
        
        {canAssign && (
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={() => handleAssignStudent(student.studentId)}
            disabled={assigning}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.brandOrange} />
          </TouchableOpacity>
        )}
        
        {isEnrolled && user.role === 'admin' && (
          <TouchableOpacity
            style={styles.unassignBtn}
            onPress={() => handleUnassignStudent(student._id || student.studentId)}
          >
            <Ionicons name="remove-circle-outline" size={20} color={COLORS.red} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAssignModal = () => {
    const filteredAssignable = assignableStudents.filter(student =>
      student.fullName.toLowerCase().includes(searchStudents.toLowerCase()) ||
      student.email.toLowerCase().includes(searchStudents.toLowerCase())
    );

    const filteredNonAssignable = nonAssignableStudents.filter(student =>
      student.fullName.toLowerCase().includes(searchStudents.toLowerCase()) ||
      student.email.toLowerCase().includes(searchStudents.toLowerCase())
    );

    return (
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Students</Text>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalInfo}>
            <Text style={styles.modalInfoText}>
              {exam.seatsAvailable} of {exam.maxSeats} seats available
            </Text>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                value={searchStudents}
                onChangeText={setSearchStudents}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {filteredAssignable.length > 0 && (
              <View style={styles.studentSection}>
                <Text style={styles.sectionTitle}>
                  Available Students ({filteredAssignable.length})
                </Text>
                {filteredAssignable.map(student => renderStudentCard(student, false, student._id || student.studentId))}
              </View>
            )}

            {filteredNonAssignable.length > 0 && (
              <View style={styles.studentSection}>
                <Text style={styles.sectionTitle}>
                  Not Available ({filteredNonAssignable.length})
                </Text>
                {filteredNonAssignable.map(student => renderStudentCard(student, false, student._id || student.studentId))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return COLORS.blue;
      case 'Completed': return COLORS.green;
      case 'Cancelled': return COLORS.red;
      default: return COLORS.textMuted;
    }
  };

  const isUserAssigned = exam.enrolledStudents?.some(student => 
    user.role === 'student' && student._id === user.studentId
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header - fixed outside ScrollView */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Exam Details</Text>
        {user.role === 'admin' ? (
          <TouchableOpacity onPress={openAssignModal}>
            <Ionicons name="person-add-outline" size={24} color={COLORS.brandOrange} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Exam Info */}
        <View style={styles.examInfoCard}>
          <View style={styles.examHeader}>
            <Text style={styles.examTitle}>
              {examType === 'theory' ? exam.examName : `${exam.vehicleCategory} Practical Exam`}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) }]}>
              <Text style={styles.statusText}>{exam.status}</Text>
            </View>
          </View>

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
              <Text style={styles.detailText}>{exam.startTime} - {exam.endTime}</Text>
            </View>

            {examType === 'theory' ? (
              <>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color={COLORS.textMuted} />
                  <Text style={styles.detailText}>{exam.locationOrHall}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="language-outline" size={20} color={COLORS.brandOrange} />
                  <Text style={styles.detailText}>Language: {exam.language}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Ionicons name="map-outline" size={20} color={COLORS.textMuted} />
                  <Text style={styles.detailText}>{exam.trialLocation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="car-outline" size={20} color={COLORS.green} />
                  <Text style={styles.detailText}>Category: {exam.vehicleCategory}</Text>
                </View>
              </>
            )}
          </View>

          {/* Seat Status */}
          <View style={styles.seatStatus}>
            <View style={styles.seatInfo}>
              <Text style={styles.seatLabel}>Seat Availability</Text>
              <Text style={styles.seatCount}>
                {exam.seatsUsed} / {exam.maxSeats} seats used
              </Text>
            </View>
            <View style={styles.seatBar}>
              <View style={[
                styles.seatFill,
                { 
                  width: `${(exam.seatsUsed / exam.maxSeats) * 100}%`,
                  backgroundColor: exam.isFull ? COLORS.red : COLORS.brandOrange
                }
              ]} />
            </View>
          </View>
        </View>

        {/* Student Status for logged-in student */}
        {user.role === 'student' && (
          <View style={styles.studentStatusCard}>
            <Text style={styles.sectionTitle}>Your Status</Text>
            {isUserAssigned ? (
              <View style={styles.assignedStatus}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
                <Text style={styles.assignedText}>You are assigned to this exam</Text>
              </View>
            ) : (
              <View style={styles.notAssignedStatus}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                <Text style={styles.notAssignedText}>You are not assigned to this exam</Text>
              </View>
            )}
          </View>
        )}

        {/* Enrolled Students */}
        <View style={styles.studentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Enrolled Students ({exam.enrolledStudents?.length || 0})
            </Text>
            {user.role === 'instructor' && (
              <Text style={styles.instructorNote}>
                Total assigned: {exam.enrolledStudents?.length || 0}
              </Text>
            )}
          </View>
          
          {exam.enrolledStudents?.length > 0 ? (
            exam.enrolledStudents.map(student => renderStudentCard(student, true, student._id || student.studentId))
          ) : (
            <View style={styles.emptyStudents}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No students enrolled yet</Text>
              {user.role === 'admin' && (
                <TouchableOpacity style={styles.addFirstBtn} onPress={openAssignModal}>
                  <Text style={styles.addFirstBtnText}>Assign First Student</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {renderAssignModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
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
  examInfoCard: {
    margin: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  examTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginRight: 16
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  examDetails: { marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  detailText: { fontSize: 16, color: COLORS.textMuted, flex: 1, marginLeft: 12 },
  seatStatus: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16
  },
  seatInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  seatLabel: { fontSize: 14, fontWeight: '500', color: COLORS.black },
  seatCount: { fontSize: 14, color: COLORS.textMuted },
  seatBar: {
    height: 6,
    backgroundColor: COLORS.bgLight,
    borderRadius: 3
  },
  seatFill: { height: '100%', borderRadius: 3 },
  studentStatusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  assignedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  assignedText: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '500',
    marginLeft: 12
  },
  notAssignedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  notAssignedText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginLeft: 12
  },
  studentsSection: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  instructorNote: { fontSize: 12, color: COLORS.textMuted },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80
  },
  studentInfo: { flex: 1, flexDirection: 'column', alignItems: 'flex-start' },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  },
  studentDetails: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  studentEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  studentContact: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  reasonsContainer: { marginTop: 4 },
  reasonText: { fontSize: 11, color: COLORS.red, marginTop: 2 },
  assignBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8ED'
  },
  unassignBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F5'
  },
  emptyStudents: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 16
  },
  addFirstBtn: {
    backgroundColor: COLORS.brandOrange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  addFirstBtnText: { color: COLORS.white, fontWeight: '500' },
  modalSafe: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  modalInfo: {
    backgroundColor: '#FFF8ED',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8
  },
  modalInfoText: {
    fontSize: 14,
    color: COLORS.brandOrange,
    fontWeight: '500',
    textAlign: 'center'
  },
  searchSection: { padding: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.black
  },
  modalContent: { flex: 1 },
  studentSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginHorizontal: 20,
    marginBottom: 12
  }
});
