import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSessionAttendance, confirmAttendance } from '../../services/sessionApi';
import { COLORS } from '../../theme';

const STATUS_COLORS = {
  Present: { bg: COLORS.greenBg, text: COLORS.green, icon: 'checkmark-circle' },
  Late: { bg: '#FFF3CD', text: '#856404', icon: 'time-outline' },
  Absent: { bg: COLORS.redBg, text: COLORS.red, icon: 'close-circle' },
  'Not Marked': { bg: COLORS.bgLight, text: COLORS.textMuted, icon: 'ellipse-outline' },
};

export default function ConfirmAttendanceScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await getSessionAttendance(sessionId);
        setData(res);
      } catch {
        Alert.alert('Error', 'Could not load attendance');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const handleConfirm = async (studentId) => {
    try {
      setConfirming(studentId);
      await confirmAttendance({ sessionId, studentId });
      Alert.alert('Success', 'Attendance confirmed successfully');
      // Refresh data
      const { data: res } = await getSessionAttendance(sessionId);
      setData(res);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not confirm attendance');
    } finally {
      setConfirming(null);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Session summary */}
        <View style={styles.sessionCard}>
          <Text style={styles.sessionType}>{data?.session?.sessionType} Session</Text>
          <Text style={styles.sessionDate}>{new Date(data?.session?.date).toDateString()}</Text>
          <Text style={styles.sessionTime}>{data?.session?.startTime} – {data?.session?.endTime}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total', value: data?.summary?.total || 0, color: COLORS.black, bg: COLORS.gray },
            { label: 'Present', value: data?.summary?.present || 0, color: COLORS.green, bg: COLORS.greenBg },
            { label: 'Absent', value: data?.summary?.absent || 0, color: COLORS.red, bg: COLORS.redBg },
          ].map(s => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Students ({data?.attendanceList?.length || 0})</Text>

        {data?.attendanceList?.map((item, index) => {
          const status = item.status;
          const colors = STATUS_COLORS[status] || STATUS_COLORS['Not Marked'];
          const isConfirmed = item.attendance?.confirmed;
          const canConfirm = item.status !== 'Not Marked' && !isConfirmed;

          return (
            <View key={item.student._id} style={styles.studentCard}>
              <View style={styles.studentNum}>
                <Text style={styles.studentNumText}>{index + 1}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.studentName}>{item.student.firstName} {item.student.lastName}</Text>
                <Text style={styles.studentNIC}>{item.student.NIC}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name={colors.icon} size={16} color={colors.text} />
                <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
              </View>
              {canConfirm && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirm(item.student._id)}
                  disabled={confirming === item.student._id}
                >
                  {confirming === item.student._id
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  }
                </TouchableOpacity>
              )}
              {isConfirmed && (
                <View style={styles.confirmedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  sessionCard: { backgroundColor: COLORS.brandYellow, borderRadius: 16, padding: 16, marginBottom: 16 },
  sessionType: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  sessionDate: { fontSize: 14, color: COLORS.textDark, marginTop: 2 },
  sessionTime: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 10 },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8 },
  studentNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bgLight, alignItems: 'center', justifyContent: 'center' },
  studentNumText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  flex1: { flex: 1 },
  studentName: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  studentNIC: { fontSize: 11, color: COLORS.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  confirmBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.brandOrange, alignItems: 'center', justifyContent: 'center' },
  confirmedBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.greenBg, alignItems: 'center', justifyContent: 'center' },
});
