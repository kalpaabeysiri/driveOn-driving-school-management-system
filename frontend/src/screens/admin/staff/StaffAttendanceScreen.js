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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  getAttendanceMembers,
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
  const [generatingReport, setGeneratingReport] = useState(false);

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
    return instructor?.licenseNo || instructor?._id || 'N/A';
  };

  const loadAttendance = useCallback(async () => {
    try {
      const date = formatDate(selectedDate);

      const [membersResponse, attendanceResponse] = await Promise.all([
        getAttendanceMembers(),
        getStaffAttendance({ date }),
      ]);

      const membersData = membersResponse.data;
      const attendanceData = attendanceResponse.data;

      const allStaff = membersData.staff || [];
      const allInstructors = membersData.instructors || [];

      const savedStaffAttendance = attendanceData.staffAttendance || [];
      const savedInstructorAttendance = attendanceData.instructorAttendance || [];

      const preparedStaffAttendance = allStaff.map(staff => {
        const existing = savedStaffAttendance.find(item => {
          const savedStaffId = item.staff?._id || item.staff;
          return savedStaffId === staff._id;
        });

        return {
          staff,
          attended: existing ? Boolean(existing.attended) : false,
        };
      });

      const preparedInstructorAttendance = allInstructors.map(instructor => {
        const existing = savedInstructorAttendance.find(item => {
          const savedInstructorId = item.instructor?._id || item.instructor;
          return savedInstructorId === instructor._id;
        });

        return {
          instructor,
          attended: existing ? Boolean(existing.attended) : false,
        };
      });

      setStaffAttendance(preparedStaffAttendance);
      setInstructorAttendance(preparedInstructorAttendance);
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

  const generateReportHtml = () => {
    const date = formatDate(selectedDate);

    const totalStaff = staffAttendance.length;
    const presentStaff = staffAttendance.filter(item => item.attended).length;
    const absentStaff = totalStaff - presentStaff;

    const totalInstructors = instructorAttendance.length;
    const presentInstructors = instructorAttendance.filter(item => item.attended).length;
    const absentInstructors = totalInstructors - presentInstructors;

    const staffRows = staffAttendance
      .map((item, index) => {
        const staff = item.staff;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${staff?.employeeId || 'N/A'}</td>
            <td>${getPersonName(staff)}</td>
            <td>${staff?.position || 'N/A'}</td>
            <td class="${item.attended ? 'present' : 'absent'}">
              ${item.attended ? 'Present' : 'Absent'}
            </td>
          </tr>
        `;
      })
      .join('');

    const instructorRows = instructorAttendance
      .map((item, index) => {
        const instructor = item.instructor;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${getInstructorId(instructor)}</td>
            <td>${getPersonName(instructor)}</td>
            <td>${instructor?.contactNumber || 'N/A'}</td>
            <td class="${item.attended ? 'present' : 'absent'}">
              ${item.attended ? 'Present' : 'Absent'}
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #222;
            }

            h1 {
              text-align: center;
              margin-bottom: 4px;
            }

            .date {
              text-align: center;
              color: #666;
              margin-bottom: 24px;
            }

            .summary {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
            }

            .summary-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 12px;
              width: 48%;
            }

            .summary-card h3 {
              margin: 0 0 8px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 28px;
            }

            th {
              background-color: #f2f2f2;
              text-align: left;
            }

            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              font-size: 13px;
            }

            .section-title {
              margin-top: 24px;
              margin-bottom: 8px;
              font-size: 18px;
              font-weight: bold;
            }

            .present {
              color: #0a8f3c;
              font-weight: bold;
            }

            .absent {
              color: #d32f2f;
              font-weight: bold;
            }

            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #777;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <h1>Daily Attendance Report</h1>
          <div class="date">Date: ${date}</div>

          <div class="summary">
            <div class="summary-card">
              <h3>Staff Summary</h3>
              <p>Total Staff: ${totalStaff}</p>
              <p>Present: ${presentStaff}</p>
              <p>Absent: ${absentStaff}</p>
            </div>

            <div class="summary-card">
              <h3>Instructor Summary</h3>
              <p>Total Instructors: ${totalInstructors}</p>
              <p>Present: ${presentInstructors}</p>
              <p>Absent: ${absentInstructors}</p>
            </div>
          </div>

          <div class="section-title">Staff Attendance</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                staffRows ||
                `<tr><td colspan="5" style="text-align:center;">No staff records found</td></tr>`
              }
            </tbody>
          </table>

          <div class="section-title">Instructor Attendance</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>License No</th>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                instructorRows ||
                `<tr><td colspan="5" style="text-align:center;">No instructor records found</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            Generated by DriveOn Driving School Management System
          </div>
        </body>
      </html>
    `;
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);

      const html = generateReportHtml();

      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Report Generated', `PDF file created: ${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Attendance Report - ${formatDate(selectedDate)}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Generate report error:', error);
      Alert.alert('Error', 'Failed to generate attendance report');
    } finally {
      setGeneratingReport(false);
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Staff Attendance</Text>

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
    </View>
  );

  const renderInstructorTable = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Instructor Attendance</Text>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.idColumn]}>License No</Text>
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

          <Text style={styles.title}>Attendance</Text>

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
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>

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
          style={[styles.submitButton, saving && styles.submitButtonPressed]}
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

        <TouchableOpacity
          style={[
            styles.reportButton,
            generatingReport && styles.reportButtonDisabled,
          ]}
          onPress={handleGenerateReport}
          disabled={generatingReport}
        >
          {generatingReport ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color={COLORS.white} />
              <Text style={styles.reportButtonText}>
                Download daily attendance report
              </Text>
            </>
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
    fontSize: 22,
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
    paddingHorizontal: 20,
    paddingTop: 28,
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

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 10,
  },

  tableCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  headerCell: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  rowText: {
    fontSize: 13,
    color: COLORS.black,
  },

  idColumn: {
    flex: 1.2,
  },

  nameColumn: {
    flex: 1.5,
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
    backgroundColor: COLORS.blue || '#2563EB',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 4,
  },

  submitButtonPressed: {
    backgroundColor: '#1D4ED8',
    opacity: 0.9,
  },

  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },

  reportButton: {
    backgroundColor: COLORS.green || '#16A34A',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },

  reportButtonDisabled: {
    opacity: 0.7,
  },

  reportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default StaffAttendanceScreen;