import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStudentProgress, getStudentAttendance } from '../../services/sessionApi';
import { COLORS } from '../../theme';

export default function StudentProgressScreen({ route, navigation }) {
  const { studentId } = route.params;
  const [progress,    setProgress]    = useState(null);
  const [attendance,  setAttendance]  = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, a] = await Promise.all([
          getStudentProgress(studentId),
          getStudentAttendance(studentId),
        ]);
        setProgress(p.data);
        setAttendance(a.data);
      } catch {
        Alert.alert('Error', 'Could not load progress');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;
  if (!progress) return <View style={styles.center}><Text>No data found</Text></View>;

  const { student, sessions, attendance: attStats, payment } = progress;

  const ProgressBar = ({ value, color }) => (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Student info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student?.firstName?.[0]}{student?.lastName?.[0]}</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.studentName}>{student?.firstName} {student?.lastName}</Text>
            <Text style={styles.studentNIC}>NIC: {student?.NIC}</Text>
          </View>
        </View>

        {/* Completion Status */}
        <Text style={styles.sectionTitle}>Completion Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Session Completion</Text>
            <Text style={[styles.statusPct, { color: sessions.completionRate >= 75 ? COLORS.green : COLORS.red }]}>
              {sessions.completionRate}%
            </Text>
          </View>
          <ProgressBar value={sessions.completionRate} color={sessions.completionRate >= 75 ? COLORS.green : COLORS.brandOrange} />
          <Text style={styles.statusMeta}>{sessions.completed}/{sessions.total} sessions completed</Text>

          <View style={[styles.statusRow, { marginTop: 16 }]}>
            <Text style={styles.statusLabel}>Attendance Rate</Text>
            <Text style={[styles.statusPct, { color: attStats.attendanceRate >= 75 ? COLORS.green : COLORS.red }]}>
              {attStats.attendanceRate}%
            </Text>
          </View>
          <ProgressBar value={attStats.attendanceRate} color={attStats.attendanceRate >= 75 ? COLORS.green : COLORS.red} />
          <Text style={styles.statusMeta}>{attStats.present}/{attStats.total} sessions attended</Text>
        </View>

        {/* Session breakdown */}
        <Text style={styles.sectionTitle}>Session Breakdown</Text>
        <View style={styles.breakdownRow}>
          {[
            { label: 'Total',     value: sessions.total,     bg: COLORS.bgLight    },
            { label: 'Theory',    value: sessions.theory,    bg: COLORS.blueBg     },
            { label: 'Practical', value: sessions.practical, bg: COLORS.brandYellow},
            { label: 'Completed', value: sessions.completed, bg: COLORS.greenBg    },
          ].map(s => (
            <View key={s.label} style={[styles.breakCard, { backgroundColor: s.bg }]}>
              <Text style={styles.breakValue}>{s.value}</Text>
              <Text style={styles.breakLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Payment status */}
        <Text style={styles.sectionTitle}>Payment Status</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentValue}>{payment.totalCourses}</Text>
              <Text style={styles.paymentLabel}>Total Courses</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={[styles.paymentValue, { color: COLORS.green }]}>{payment.fullyPaid}</Text>
              <Text style={styles.paymentLabel}>Fully Paid</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={[styles.paymentValue, { color: payment.pendingPayment > 0 ? COLORS.red : COLORS.green }]}>
                {payment.pendingPayment}
              </Text>
              <Text style={styles.paymentLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Recent Attendance */}
        {attendance?.records?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            {attendance.records.slice(0, 8).map(record => {
              const colors = {
                Present: { bg: COLORS.greenBg, text: COLORS.green },
                Late:    { bg: '#FFF3CD',      text: '#856404'    },
                Absent:  { bg: COLORS.redBg,   text: COLORS.red   },
              };
              const c = colors[record.status] || { bg: COLORS.bgLight, text: COLORS.textMuted };
              return (
                <View key={record._id} style={styles.attendanceRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.attendanceSession}>{record.session?.sessionType} Session</Text>
                    <Text style={styles.attendanceMeta}>
                      {new Date(record.session?.date).toDateString()} · {record.session?.startTime}
                    </Text>
                    <Text style={styles.attendanceMeta}>
                      Instructor: {record.session?.instructor?.fullName || 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.attendanceBadge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.attendanceBadgeText, { color: c.text }]}>{record.status}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.brandYellow, borderRadius: 18, padding: 16, marginBottom: 20 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '800', color: COLORS.black },
  flex1:        { flex: 1 },
  studentName:  { fontSize: 17, fontWeight: '700', color: COLORS.black },
  studentNIC:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 10 },
  statusCard:   { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  statusRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusLabel:  { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  statusPct:    { fontSize: 14, fontWeight: '800' },
  progressTrack:{ height: 8, backgroundColor: COLORS.bgLight, borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  statusMeta:   { fontSize: 12, color: COLORS.textMuted },
  breakdownRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  breakCard:    { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  breakValue:   { fontSize: 22, fontWeight: '800', color: COLORS.black },
  breakLabel:   { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  paymentCard:  { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  paymentRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  paymentItem:  { alignItems: 'center' },
  paymentValue: { fontSize: 24, fontWeight: '800', color: COLORS.black },
  paymentLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  attendanceRow:{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  attendanceSession: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  attendanceMeta:    { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  attendanceBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  attendanceBadgeText: { fontSize: 11, fontWeight: '700' },
});
