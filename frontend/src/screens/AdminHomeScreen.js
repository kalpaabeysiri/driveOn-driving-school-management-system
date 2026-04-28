import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getSessions } from '../services/sessionApi';
import { getAllStudents } from '../services/studentApi';
import { getAllInstructors } from '../services/instructorVehicleApi';
import { COLORS } from '../theme';

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats,   setStats]   = useState({ sessions: 0, students: 0, instructors: 0 });
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, st, ins] = await Promise.all([
          getSessions(),
          getAllStudents(),
          getAllInstructors(),
        ]);
        const upcomingSessions = s.data.filter(
          x => x.status === 'Scheduled' || x.status === 'Ongoing'
        );
        setUpcoming(upcomingSessions.slice(0, 3));
        setStats({
          sessions:    s.data.length,
          students:    st.data.length,
          instructors: ins.data.length,
        });
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const actionGroups = [
    {
      title: 'People Management',
      icon:  'people-circle-outline',
      items: [
        { icon: 'people-outline',   label: 'Students',    screen: 'StudentList',    color: COLORS.blueBg      },
        { icon: 'person-outline',   label: 'Instructors', screen: 'InstructorList', color: COLORS.brandYellow },
        { icon: 'business-outline', label: 'Staff',       screen: 'StaffList',      color: COLORS.purpleBg    },
      ],
    },
    {
      title: 'Operations',
      icon:  'settings-outline',
      items: [
        { icon: 'calendar-outline',        label: 'Sessions',   screen: 'AdminSessions',       color: COLORS.greenBg    },
        { icon: 'checkmark-done-outline',  label: 'Attendance', screen: 'AttendanceManagement', color: COLORS.brandYellow },
        { icon: 'car-outline',             label: 'Vehicles',   screen: 'VehicleList',          color: COLORS.redBg      },
        { icon: 'card-outline',            label: 'Payments',   screen: 'Payments',             color: COLORS.greenBg    },
      ],
    },
    {
      title: 'Learning & Exams',
      icon:  'school-outline',
      items: [
        { icon: 'school-outline',    label: 'Learning',      screen: 'CreateLearningContent', color: COLORS.blueBg   },
        { icon: 'clipboard-outline', label: 'Exam Schedule', screen: 'ExamDashboard',         color: COLORS.purpleBg },
      ],
    },
    {
      title: 'Communication',
      icon:  'chatbubbles-outline',
      items: [
        { icon: 'megaphone-outline',   label: 'Send Notice', screen: 'SendNotice',        color: COLORS.greenBg },
        { icon: 'chatbubbles-outline', label: 'Inquiries',   screen: 'InquiryManagement', color: COLORS.redBg   },
      ],
    },
  ];

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.white} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}>Hello, {(user?.name || 'Admin').split(' ')[0]} 👋</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Sessions',    value: stats.sessions,    icon: 'calendar-outline' },
            { label: 'Total Students',    value: stats.students,    icon: 'people-outline'   },
            { label: 'Total Instructors', value: stats.instructors, icon: 'person-outline'   },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={20} color={COLORS.brandOrange} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Categorised Quick Actions */}
        {actionGroups.map((group) => (
          <View key={group.title} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <Ionicons name={group.icon} size={16} color={COLORS.brandOrange} />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            <View style={styles.actionsGrid}>
              {group.items.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.actionCard, { backgroundColor: a.color }]}
                  onPress={() => navigation.navigate(a.screen)}
                >
                  <Ionicons name={a.icon} size={24} color={COLORS.black} />
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Upcoming Sessions */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {upcoming.map((s) => (
              <View key={s._id} style={styles.sessionCard}>
                <View style={[styles.sessionTypeBadge, {
                  backgroundColor: s.sessionType === 'Theory' ? COLORS.blueBg : COLORS.brandYellow,
                }]}>
                  <Text style={[styles.sessionTypeText, {
                    color: s.sessionType === 'Theory' ? COLORS.blue : COLORS.black,
                  }]}>{s.sessionType}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.sessionDate}>{new Date(s.date).toDateString()}</Text>
                  <Text style={styles.sessionMeta}>{s.startTime} – {s.endTime}</Text>
                  <Text style={styles.sessionMeta}>
                    Instructor: {s.instructor?.fullName || 'TBA'} ·
                    {s.enrolledStudents?.length || 0}/{s.maxStudents} students
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('AdminSessions')}>
              <Text style={styles.viewAllText}>View All Sessions</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.brandOrange} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  logo:        { fontSize: 28, fontWeight: '800' },
  dateText:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  adminBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandOrange, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  content:     { padding: 20, paddingBottom: 40 },
  welcome:     { fontSize: 22, fontWeight: '700', color: COLORS.black, marginTop: 4, marginBottom: 20 },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:    { flex: 1, backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  statValue:   { fontSize: 22, fontWeight: '800', color: COLORS.black },
  statLabel:   { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  groupBlock:  { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  groupTitle:  { fontSize: 14, fontWeight: '700', color: COLORS.black },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:  { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  sessionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  sessionTypeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  sessionTypeText:  { fontSize: 11, fontWeight: '700' },
  flex1:       { flex: 1 },
  sessionDate: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  sessionMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  viewAllBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.brandOrange },
});
