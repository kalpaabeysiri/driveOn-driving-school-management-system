import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  getStaffAttendance,
  markStaffAttendance,
} from '../../../services/api';

import { COLORS } from '../../../theme';

const StaffAttendanceScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [staffAttendance, setStaffAttendance] = useState([]);
  const [instructorAttendance, setInstructorAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = date => {
    const d = new Date(date);
    const year = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${mon}-${day}`;
  };

  const getPersonName = person => {
    return person?.fullName || person?.name || 'N/A';
  };

  const getInstructorId = instructor => {
    return (
      instructor?.instructorId ||
      instructor?.employeeId ||
      instructor?._id ||
      'N/A'
    );
  };

  const loadAttendance = useCallback(async () => {
    try {
      const date = formatDate(selectedDate);

      const response = await getStaffAttendance({ date });

      const data = response.data;

      setStaffAttendance(data.staffAttendance || []);
      setInstructorAttendance(data.instructorAttendance || []);
    } catch (error) {
      console.error('Load attendance error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load attendance data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleStaffAttendance = staffId => {
    setStaffAttendance(prev =>
      prev.map(item => {
        const currentStaffId = item.staff?._id || item.staff;

        if (currentStaffId === staffId) {
          return {
            ...item,
            attended: !item.attended,
          };
        }

        return item;
      })
    );
  };

  const toggleInstructorAttendance = instructorId => {
    setInstructorAttendance(prev =>
      prev.map(item => {
        const currentInstructorId = item.instructor?._id || item.instructor;

        if (currentInstructorId === instructorId) {
          return {
            ...item,
            attended: !item.attended,
          };
        }

        return item;
      })
    );
  };

  const handleSubmitAttendance = async () => {
    try {
      setSaving(true);

      const payload = {
        date: formatDate(selectedDate),

        staffAttendance: staffAttendance.map(item => ({
          staffId: item.staff?._id || item.staff,
          attended: Boolean(item.attended),
        })),

        instructorAttendance: instructorAttendance.map(item => ({
          instructorId: item.instructor?._id || item.instructor,
          attended: Boolean(item.attended),
        })),
      };

      await markStaffAttendance(payload);

      Alert.alert('Success', 'Attendance saved successfully');
      loadAttendance();
    } catch (error) {
      console.error('Save attendance error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save attendance'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
        onChange={handleDateChange}
      />
    );
  };

  const renderCheckBox = checked => (
    <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
      {checked && (
        <Ionicons name="checkmark" size={18} color={COLORS.white} />
      )}
    </View>
  );

  const renderStaffTable = () => (
    <View style={styles.tableCard}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.idColumn]}>Staff ID</Text>
        <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
        <Text style={[styles.headerCell, styles.attendedColumn]}>Attended</Text>
      </View>

      {staffAttendance.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No staff members found</Text>
        </View>
      ) : (
        staffAttendance.map(item => {
          const staff = item.staff;
          const staffId = staff?._id || staff;

          return (
            <View key={staffId} style={styles.tableRow}>
              <Text style={[styles.rowText, styles.idColumn]}>
                {staff?.employeeId || 'N/A'}
              </Text>

              <Text style={[styles.rowText, styles.nameColumn]}>
                {getPersonName(staff)}
              </Text>

              <TouchableOpacity
                style={styles.attendedColumn}
                onPress={() => toggleStaffAttendance(staffId)}
              >
                {renderCheckBox(item.attended)}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  const renderInstructorTable = () => (
    <View style={styles.tableCard}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.idColumn]}>Instructor ID</Text>
        <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
        <Text style={[styles.headerCell, styles.attendedColumn]}>Attended</Text>
      </View>

      {instructorAttendance.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No instructors found</Text>
        </View>
      ) : (
        instructorAttendance.map(item => {
          const instructor = item.instructor;
          const instructorId = instructor?._id || instructor;

          return (
            <View key={instructorId} style={styles.tableRow}>
              <Text style={[styles.rowText, styles.idColumn]}>
                {getInstructorId(instructor)}
              </Text>

              <Text style={[styles.rowText, styles.nameColumn]}>
                {getPersonName(instructor)}
              </Text>

              <TouchableOpacity
                style={styles.attendedColumn}
                onPress={() => toggleInstructorAttendance(instructorId)}
              >
                {renderCheckBox(item.attended)}
              </TouchableOpacity>
            </View>
          );
        })
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

          <TouchableOpacity
            style={styles.insightBtn}
            onPress={() => navigation.navigate('StaffPerformance')}
          >
            <Ionicons name="bar-chart-outline" size={18} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAttendance();
            }}
          />
        }
      >
        <Text style={styles.mainTitle}>Mark employee attendance</Text>

        <TouchableOpacity
          style={styles.dateBox}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formatDate(selectedDate)}
          </Text>

          <Ionicons
            name="calendar-outline"
            size={24}
            color={COLORS.black}
          />
        </TouchableOpacity>

        {renderDatePicker()}

        {renderStaffTable()}

        {renderInstructorTable()}

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmitAttendance}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              Complete attendance taking
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  topSafeArea: {
    backgroundColor: COLORS.gray,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },

  insightBtn: {
    backgroundColor: COLORS.brandYellow,
    padding: 8,
    borderRadius: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 20,
  },

  dateBox: {
    backgroundColor: COLORS.gray,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateText: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  tableCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 28,
    backgroundColor: COLORS.white,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 68,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  headerCell: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  rowText: {
    fontSize: 13,
    color: COLORS.black,
  },

  idColumn: {
    flex: 1.25,
  },

  nameColumn: {
    flex: 1.45,
  },

  attendedColumn: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  checkBoxActive: {
    backgroundColor: COLORS.brandOrange,
    borderColor: COLORS.brandOrange,
  },

  emptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  submitButton: {
    backgroundColor: COLORS.darkGray || '#777',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default StaffAttendanceScreen;