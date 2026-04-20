import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getStudentById, toggleReminders } from '../services/studentApi';
import { COLORS } from '../theme';

export default function StudentHomeScreen({ navigation, route }) {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdminView = route?.params?.isAdminView ?? false;
  const studentId = route?.params?.studentId || user?._id;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await getStudentById(studentId);
        setStudent(data);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchStudent();
    else setLoading(false);
  }, [studentId]);

  const handleToggleReminders = async () => {
    try {
      await toggleReminders(studentId);
      setStudent(prev => ({ ...prev, reminderNotifications: !prev.reminderNotifications }));
    } catch {}
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  const upcomingSessions =
    student?.bookedSessions?.filter(
      s => s.status === 'Scheduled' || s.status === 'Pending'
    ) || [];

  const completedSessions =
    student?.bookedSessions?.filter(
      s => s.status === 'Completed'
    ) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {!isAdminView && (
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('StudentNotifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.black} />
            </TouchableOpacity>
          )}

          <View style={styles.studentBadge}>
            <Ionicons
              name={isAdminView ? 'person' : 'school'}
              size={14}
              color={COLORS.black}
            />
            <Text style={styles.studentBadgeText}>
              {isAdminView ? 'Admin View' : 'Student'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}>
          Hello, {(student?.firstName || user?.name || 'Student').split(' ')[0]} 👋
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(student?.firstName || user?.name || 'S')[0].toUpperCase()}
            </Text>
          </View>

          <View style={styles.flex1}>
            <Text style={styles.profileName}>
              {student?.firstName ? `${student.firstName} ${student.lastName}` : user?.name}
            </Text>
            <Text style={styles.profileEmail}>{student?.email || user?.email}</Text>
            {student?.NIC && <Text style={styles.profileNIC}>NIC: {student.NIC}</Text>}
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  student?.accountStatus === 'Suspended' ? COLORS.redBg : COLORS.greenBg,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: student?.accountStatus === 'Suspended' ? COLORS.red : COLORS.green,
                },
              ]}
            >
              {student?.accountStatus || 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            {
              label: 'Sessions Done',
              value: completedSessions.length,
              icon: 'checkmark-circle-outline',
            },
            {
              label: 'Upcoming',
              value: upcomingSessions.length,
              icon: 'calendar-outline',
            },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={20} color={COLORS.brandOrange} />
              <Text style={styles.statValue} numberOfLines={1}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

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

        {[
          {
            title: 'Learning',
            icon: 'school-outline',
            items: [
              {
                icon: 'school-outline',
                label: 'Take Quiz',
                screen: 'LearningCatalog',
                color: COLORS.blueBg,
              },
              {
                icon: 'calendar-outline',
                label: 'Book Session',
                screen: 'AvailableSessions',
                color: COLORS.redBg,
              },
            ],
          },
          {
            title: 'Account & Support',
            icon: 'person-circle-outline',
            items: [
              {
                icon: 'card-outline',
                label: 'Payments',
                screen: 'Payments',
                color: COLORS.greenBg,
                tab: true,
              },
              {
                icon: 'notifications-outline',
                label: 'Notices',
                screen: 'StudentNotifications',
                color: COLORS.brandYellow,
              },
              {
                icon: 'chatbubbles-outline',
                label: 'My Inquiries',
                screen: 'StudentInquiry',
                color: COLORS.purpleBg,
              },
            ],
          },
        ].map((group) => {
          const filteredItems = isAdminView
            ? group.items.filter(
                item =>
                  item.screen !== 'AvailableSessions' &&
                  item.screen !== 'LearningCatalog' &&
                  item.screen !== 'StudentNotifications' &&
                  item.screen !== 'StudentInquiry'
              )
            : group.items;

          if (filteredItems.length === 0) return null;

          return (
            <View key={group.title} style={styles.groupBlock}>
              <View style={styles.groupHeader}>
                <Ionicons name={group.icon} size={15} color={COLORS.brandOrange} />
                <Text style={styles.groupTitle}>{group.title}</Text>
              </View>

              <View style={styles.actionsGrid}>
                {filteredItems.map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    style={[styles.actionCard, { backgroundColor: a.color }]}
                    onPress={() =>
                      a.tab ? navigation.jumpTo(a.screen) : navigation.navigate(a.screen)
                    }
                  >
                    <Ionicons name={a.icon} size={24} color={COLORS.black} />
                    <Text style={styles.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {student?.enrolledCourses?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Courses</Text>
            {student.enrolledCourses.map((course) => (
              <View key={course._id} style={styles.courseCard}>
                <Text style={styles.courseCategory}>
                  {course.licenseCategory?.licenseCategoryName || 'Course'}
                </Text>
                <View style={styles.courseRow}>
                  <Text style={styles.courseFee}>
                    LKR {course.courseFee?.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.balanceBadge,
                      {
                        backgroundColor:
                          course.remainingBalance > 0 ? COLORS.redBg : COLORS.greenBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.balanceText,
                        {
                          color: course.remainingBalance > 0 ? COLORS.red : COLORS.green,
                        },
                      ]}
                    >
                      {course.remainingBalance > 0
                        ? `LKR ${course.remainingBalance?.toLocaleString()} due`
                        : 'Fully Paid ✓'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logo: { fontSize: 28, fontWeight: '800' },
  dateText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  bellBtn: { backgroundColor: COLORS.white, borderRadius: 10, padding: 8 },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  studentBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  welcome: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 4,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  flex1: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  profileEmail: { fontSize: 12, color: COLORS.textMuted },
  profileNIC: { fontSize: 11, color: COLORS.textMuted },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  reminderSub: { fontSize: 12, color: COLORS.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  groupBlock: { marginBottom: 20 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  groupTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  courseCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseFee: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  balanceBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  balanceText: { fontSize: 12, fontWeight: '600' },
});