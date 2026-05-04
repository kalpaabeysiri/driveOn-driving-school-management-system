import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStaffAttendance, getStaff, markStaffAttendance } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../../theme';

const StaffAttendanceScreen = ({ navigation }) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [status, setStatus] = useState('Present');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const attendanceStatuses = ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'];

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      const [staffRes, attendanceRes] = await Promise.all([
        getStaff(),
        getStaffAttendance({
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear()
        })
      ]);
      setStaffMembers(staffRes.data.staff || []);
      setAttendance(attendanceRes.data.attendance || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAttendanceForDate = (staffId, date) => {
    return attendance.find(a => 
      a.staff?._id === staffId && 
      new Date(a.date).toDateString() === date.toDateString()
    );
  };

  const handleDateClick = (staffMember, date) => {
    const existing = getAttendanceForDate(staffMember._id, date);
    setSelectedStaff(staffMember);
    setSelectedDate(date);
    if (existing) {
      setStatus(existing.status);
      setCheckIn(existing.checkIn ? new Date(existing.checkIn) : null);
      setCheckOut(existing.checkOut ? new Date(existing.checkOut) : null);
    } else {
      setStatus('Present');
      setCheckIn(null);
      setCheckOut(null);
    }
    setShowMarkModal(true);
  };

  const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const submitAttendance = async () => {
    const requiresCheckIn = ['Late', 'Half Day'].includes(status);
    if (requiresCheckIn && !checkIn) {
      Alert.alert('Error', 'Check-in time is required for this status');
      return;
    }
    setSubmitting(true);
    try {
      const dateStr = formatLocalDate(selectedDate);
      const attendanceData = {
        staffId: selectedStaff._id,
        date: dateStr,
        status,
      };
      if (checkIn) {
        const h = String(checkIn.getHours()).padStart(2, '0');
        const m = String(checkIn.getMinutes()).padStart(2, '0');
        attendanceData.checkIn = `${dateStr}T${h}:${m}:00`;
      }
      if (checkOut) {
        const h = String(checkOut.getHours()).padStart(2, '0');
        const m = String(checkOut.getMinutes()).padStart(2, '0');
        attendanceData.checkOut = `${dateStr}T${h}:${m}:00`;
      }
      await markStaffAttendance(attendanceData);
      Alert.alert('Success', 'Attendance marked successfully');
      setShowMarkModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
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

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const CalendarGrid = ({ staffMember }) => {
    const days = generateCalendarDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          {dayNames.map(day => (
            <Text key={day} style={styles.dayName}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {days.map((date, index) => {
            if (!date) {
              return <View key={index} style={styles.calendarCellEmpty} />;
            }
            const attendance = getAttendanceForDate(staffMember._id, date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isFuture = date > new Date();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarCell,
                  isToday && styles.calendarCellToday,
                  isFuture && styles.calendarCellFuture,
                  attendance && { backgroundColor: getStatusColor(attendance.status) + '20' }
                ]}
                onPress={() => !isFuture && handleDateClick(staffMember, date)}
                disabled={isFuture}
              >
                <Text style={[
                  styles.calendarCellText,
                  isToday && styles.calendarCellTextToday,
                  isFuture && styles.calendarCellTextFuture
                ]}>
                  {date.getDate()}
                </Text>
                {attendance && (
                  <View style={[styles.attendanceDot, { backgroundColor: getStatusColor(attendance.status) }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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
              style={styles.navBtn}
              onPress={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(newMonth.getMonth() - 1);
                setCurrentMonth(newMonth);
              }}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.black} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(newMonth.getMonth() + 1);
                setCurrentMonth(newMonth);
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
          />
        }
      >
        {staffMembers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No staff members found</Text>
          </View>
        ) : (
          staffMembers.map((staffMember) => (
            <View key={staffMember._id} style={styles.staffCard}>
              <View style={styles.staffHeader}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{staffMember.fullName}</Text>
                  <Text style={styles.staffMeta}>{staffMember.department || 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: staffMember.isActive ? COLORS.greenBg : COLORS.redBg,
                }]}>
                  <Text style={[styles.statusText, {
                    color: staffMember.isActive ? COLORS.green : COLORS.red,
                  }]}>{staffMember.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
              <CalendarGrid staffMember={staffMember} />
            </View>
          ))
        )}
      </ScrollView>

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
            <Text style={styles.modalTitle}>Mark Attendance</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStaff?.fullName} - {selectedDate?.toLocaleDateString()}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusButtons}>
                {attendanceStatuses.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusButton, status === s && styles.statusButtonActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.statusButtonText, status === s && styles.statusButtonTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {['Late', 'Half Day'].includes(status) && (
              <View style={styles.timeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Check In</Text>
                  <TouchableOpacity
                    style={styles.timePickerBtn}
                    onPress={() => setShowCheckInPicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color={COLORS.brandOrange} />
                    <Text style={[styles.timePickerText, !checkIn && { color: COLORS.textMuted }]}>
                      {checkIn ? formatTime(checkIn) : 'Select time'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Check Out</Text>
                  <TouchableOpacity
                    style={styles.timePickerBtn}
                    onPress={() => setShowCheckOutPicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color={COLORS.brandOrange} />
                    <Text style={[styles.timePickerText, !checkOut && { color: COLORS.textMuted }]}>
                      {checkOut ? formatTime(checkOut) : 'Select time'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { marginRight: 8 }]}
                onPress={() => setShowMarkModal(false)}
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
                  <Text style={styles.submitButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
           </ScrollView>
          </View>
        </View>
      </Modal>

      {showCheckInPicker && (
        <DateTimePicker
          value={checkIn || new Date()}
          mode="time"
          display={Platform.OS === 'android' ? 'clock' : 'spinner'}
          is24Hour={true}
          onChange={(event, date) => {
            setShowCheckInPicker(false);
            if (date) setCheckIn(date);
          }}
        />
      )}

      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOut || new Date()}
          mode="time"
          display={Platform.OS === 'android' ? 'clock' : 'spinner'}
          is24Hour={true}
          onChange={(event, date) => {
            setShowCheckOutPicker(false);
            if (date) setCheckOut(date);
          }}
        />
      )}
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
  navBtn: { 
    backgroundColor: COLORS.brandYellow, 
    borderRadius: 12, 
    padding: 8 
  },
  monthHeader: {
    backgroundColor: COLORS.gray,
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  list: { 
    padding: 16, 
    paddingBottom: 40 
  },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  staffMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calendarContainer: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginBottom: 4,
  },
  calendarCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: COLORS.brandOrange,
  },
  calendarCellFuture: {
    opacity: 0.3,
  },
  calendarCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
  },
  calendarCellTextToday: {
    color: COLORS.brandOrange,
  },
  calendarCellTextFuture: {
    color: COLORS.textMuted,
  },
  attendanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
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
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
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
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.bgLight,
  },
  timePickerText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusButtonActive: {
    backgroundColor: COLORS.brandOrange,
    borderColor: COLORS.brandOrange,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  statusButtonTextActive: {
    color: COLORS.white,
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
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
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
  iosPickerWrap: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  iosDoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iosDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.brandOrange,
  },
  iosPicker: {
    height: 150,
  },
});

export default StaffAttendanceScreen;
