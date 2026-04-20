import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStaffAttendance, getStaff, markStaffAttendance } from '../../../services/api';
import { COLORS } from '../../../theme';

const { width } = Dimensions.get('window');

const StaffAttendanceScreen = ({ navigation }) => {
  const [attendance, setAttendance] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState('Present');
  const [remarks, setRemarks] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('0');
  const [efficiency, setEfficiency] = useState('0');
  const [customerRating, setCustomerRating] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const attendanceStatuses = ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'];
  const leaveTypes = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Special'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load attendance records
      const attendanceResponse = await getStaffAttendance({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      setAttendance(attendanceResponse.data.attendance || []);

      // Load staff members for dropdown
      const staffResponse = await getStaff();
      setStaffMembers(staffResponse.data.staff || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load attendance data');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAttendance = () => {
    if (!selectedStaff) {
      Alert.alert('Error', 'Please select a staff member');
      return;
    }

    setShowMarkModal(true);
  };

  const submitAttendance = async () => {
    if (!checkIn) {
      Alert.alert('Error', 'Please enter check-in time');
      return;
    }

    setSubmitting(true);
    try {
      const attendanceData = {
        staffId: selectedStaff,
        date: selectedDate,
        checkIn: `${selectedDate}T${checkIn}`,
        checkOut: checkOut ? `${selectedDate}T${checkOut}` : undefined,
        status,
        remarks,
        performanceMetrics: {
          tasksCompleted: parseInt(tasksCompleted) || 0,
          efficiency: parseInt(efficiency) || 0,
          customerRating: parseFloat(customerRating) || 0
        }
      };

      await markStaffAttendance(attendanceData);
      Alert.alert('Success', 'Attendance marked successfully');
      setShowMarkModal(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setCheckIn('');
    setCheckOut('');
    setStatus('Present');
    setRemarks('');
    setTasksCompleted('0');
    setEfficiency('0');
    setCustomerRating('0');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return COLORS.green;
      case 'Absent': return COLORS.red;
      case 'Late': return COLORS.brandOrange;
      case 'Half Day': return COLORS.blue;
      case 'On Leave': return COLORS.purple;
      default: return COLORS.gray;
    }
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.attendanceHeader}>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.staff?.fullName}</Text>
          <Text style={styles.staffId}>{item.staff?.employeeId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.attendanceDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - 
            {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ' N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="hourglass-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.workHours || 0} hours</Text>
        </View>
        {item.overtimeHours > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.brandOrange} />
            <Text style={styles.detailText}>{item.overtimeHours} overtime</Text>
          </View>
        )}
      </View>

      {item.performanceMetrics && (
        <View style={styles.performanceSection}>
          <Text style={styles.performanceTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{item.performanceMetrics.tasksCompleted}</Text>
              <Text style={styles.performanceLabel}>Tasks</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{item.performanceMetrics.efficiency}%</Text>
              <Text style={styles.performanceLabel}>Efficiency</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{item.performanceMetrics.customerRating}</Text>
              <Text style={styles.performanceLabel}>Rating</Text>
            </View>
          </View>
        </View>
      )}

      {item.remarks && (
        <View style={styles.remarksSection}>
          <Text style={styles.remarksText}>{item.remarks}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Attendance</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.perfBtn}
              onPress={() => navigation.navigate('StaffPerformance')}
            >
              <Ionicons name="bar-chart-outline" size={18} color={COLORS.black} />
              <Text style={styles.perfBtnText}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleMarkAttendance}
            >
              <Ionicons name="add" size={22} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={attendance}
        keyExtractor={(item) => item._id}
        renderItem={renderAttendanceItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        }
      />

      {/* Mark Attendance Modal */}
      <Modal
        visible={showMarkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMarkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Mark Staff Attendance</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Staff Member</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    Alert.alert(
                      'Select Staff',
                      '',
                      staffMembers.map(staff => ({
                        text: `${staff.fullName} (${staff.employeeId})`,
                        onPress: () => setSelectedStaff(staff._id)
                      }))
                    );
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {staffMembers.find(s => s._id === selectedStaff)?.fullName || 'Select Staff'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.timeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Check In</Text>
                  <TextInput
                    style={styles.input}
                    value={checkIn}
                    onChangeText={setCheckIn}
                    placeholder="09:00"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Check Out</Text>
                  <TextInput
                    style={styles.input}
                    value={checkOut}
                    onChangeText={setCheckOut}
                    placeholder="17:00"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    Alert.alert(
                      'Select Status',
                      '',
                      attendanceStatuses.map(status => ({
                        text: status,
                        onPress: () => setStatus(status)
                      }))
                    );
                  }}
                >
                  <Text style={styles.dropdownText}>{status}</Text>
                  <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {status === 'On Leave' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Leave Type</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      Alert.alert(
                        'Select Leave Type',
                        '',
                        leaveTypes.map(type => ({
                          text: type,
                          onPress: () => setRemarks(type)
                        }))
                      );
                    }}
                  >
                    <Text style={styles.dropdownText}>{remarks || 'Select Leave Type'}</Text>
                    <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              
              <View style={styles.timeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Tasks Completed</Text>
                  <TextInput
                    style={styles.input}
                    value={tasksCompleted}
                    onChangeText={setTasksCompleted}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Efficiency (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={efficiency}
                    onChangeText={setEfficiency}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer Rating</Text>
                <TextInput
                  style={styles.input}
                  value={customerRating}
                  onChangeText={setCustomerRating}
                  placeholder="0.0 - 5.0"
                  keyboardType="numeric"
                />
              </View>

              {status !== 'On Leave' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Remarks (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder="Add any remarks..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { marginRight: 8 }]}
                  onPress={() => {
                    setShowMarkModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitAttendance}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Mark Attendance</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  topSafeArea: { backgroundColor: COLORS.gray },
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.gray, 
    paddingTop: 8, 
    paddingBottom: 16, 
    paddingHorizontal: 20,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: COLORS.black 
  },
  addBtn: { 
    backgroundColor: COLORS.brandYellow, 
    borderRadius: 12, 
    padding: 8 
  },
  perfBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.brandYellow, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  perfBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  list: { 
    padding: 16, 
    paddingBottom: 40 
  },
  attendanceCard: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  staffId: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  attendanceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  performanceSection: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.brandOrange,
  },
  performanceLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  remarksSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
  },
  remarksText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  empty: { 
    alignItems: 'center', 
    paddingVertical: 60, 
    gap: 12 
  },
  emptyText: { 
    fontSize: 15, 
    color: COLORS.textMuted 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.black,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.brandOrange,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default StaffAttendanceScreen;
