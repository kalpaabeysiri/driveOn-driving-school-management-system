import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStudentById, toggleReminders, studentBookSession } from '../../services/studentApi';
import { COLORS } from '../../theme';

export default function StudentDashboardScreen({ navigation, route }) {
  const isAdminView = route?.params?.isAdminView ?? false;
  const studentId = route?.params?.studentId ?? null;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = async () => {
    if (!studentId) {
      Alert.alert('Error', 'Student ID not found');
      setLoading(false);
      return;
    }

    try {
      const { data } = await getStudentById(studentId);
      setStudent(data);
    } catch {
      Alert.alert('Error', 'Could not load your profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  const handleToggleReminders = async () => {
    try {
      await toggleReminders(studentId);
      fetchStudent();
    } catch {
      Alert.alert('Error', 'Could not update reminders');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text>Student not found</Text>
      </View>
    );
  }

  const totalPaid = student.enrolledCourses?.reduce((sum, c) => {
    const paid = (c.courseFee - (c.discount || 0)) - c.remainingBalance;
    return sum + paid;
  }, 0) || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                student.accountStatus === 'Active' ? COLORS.greenBg : COLORS.redBg,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: student.accountStatus === 'Active' ? COLORS.green : COLORS.red,
              },
            ]}
          >
            {student.accountStatus}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {student.firstName[0]}{student.lastName[0]}
            </Text>
          </View>
          <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
          <Text style={styles.studentNIC}>NIC: {student.NIC}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Courses', value: student.enrolledCourses?.length || 0 },
            { label: 'Sessions', value: student.bookedSessions?.length || 0 },
            { label: 'Paid', value: `LKR ${totalPaid.toLocaleString()}` },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Reminders Toggle */}
        {!isAdminView && (
          <View style={styles.reminderCard}>
            <View style={styles.flex1}>
              <Text style={styles.reminderTitle}>Session Reminders</Text>
              <Text style={styles.reminderSub}>Get notified before your sessions</Text>
            </View>
            <Switch
              value={student?.reminderNotifications || false}
              onValueChange={handleToggleReminders}
              trackColor={{ false: COLORS.borderLight, true: COLORS.brandOrange }}
              thumbColor={COLORS.white}
            />
          </View>
        )}

        {/* Enrolled Courses */}
        <Text style={styles.sectionTitle}>My Courses</Text>
        {student.enrolledCourses?.length === 0 ? (
          <Text style={styles.emptyText}>No courses enrolled yet.</Text>
        ) : (
          student.enrolledCourses?.map((course) => (
            <View key={course._id} style={styles.courseCard}>
              <Text style={styles.courseCategory}>
                {course.licenseCategory?.licenseCategoryName}
              </Text>
              <View style={styles.courseRow}>
                <View>
                  <Text style={styles.courseFee}>LKR {course.courseFee?.toLocaleString()}</Text>
                  {course.discount > 0 && (
                    <Text style={styles.courseDiscount}>
                      Discount: LKR {course.discount?.toLocaleString()}
                    </Text>
                  )}
                </View>
                <View style={styles.balanceBox}>
                  <Text style={styles.balanceLabel}>Remaining</Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      {
                        color: course.remainingBalance > 0 ? COLORS.red : COLORS.green,
                      },
                    ]}
                  >
                    LKR {course.remainingBalance?.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Booked Sessions */}
        <Text style={styles.sectionTitle}>My Sessions</Text>
        {student.bookedSessions?.length === 0 ? (
          <>
            <Text style={styles.emptyText}>No sessions booked yet.</Text>
            {!isAdminView && (
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => navigation.navigate('BookSession')}
              >
                <Text style={styles.bookBtnText}>Book a Session</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          student.bookedSessions?.map((session) => (
            <View key={session._id} style={styles.sessionCard}>
              <View style={styles.flex1}>
                <Text style={styles.sessionType}>{session.type} Session</Text>
                <Text style={styles.sessionMeta}>
                  {new Date(session.date).toDateString()} · {session.startTime}
                </Text>
                <Text style={styles.sessionMeta}>
                  Instructor: {session.instructor?.name || 'TBA'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: COLORS.blueBg }]}>
                <Text style={[styles.badgeText, { color: COLORS.blue }]}>
                  {session.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logo: { fontSize: 28, fontWeight: '800' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },

  content: { padding: 20, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.brandYellow,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.black },
  studentName: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  studentEmail: { fontSize: 13, color: COLORS.textMuted },
  studentNIC: { fontSize: 12, color: COLORS.textMuted },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.brandOrange },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  flex1: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  reminderSub: { fontSize: 12, color: COLORS.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },

  courseCard: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  courseCategory: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseFee: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  courseDiscount: { fontSize: 12, color: COLORS.green },
  balanceBox: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 11, color: COLORS.textMuted },
  balanceValue: { fontSize: 15, fontWeight: '700' },

  bookBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  bookBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sessionType: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  sessionMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});