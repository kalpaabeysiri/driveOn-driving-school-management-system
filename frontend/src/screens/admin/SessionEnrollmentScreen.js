import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSessionById, removeStudentFromSession } from '../../services/sessionApi';
import { getStudentProgress } from '../../services/sessionApi';
import { COLORS } from '../../theme';

export default function SessionEnrollmentScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [session,    setSession]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await getSessionById(sessionId);
      setSession(data);
    } catch {
      Alert.alert('Error', 'Could not load session');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const handleRemoveStudent = (student) => {
    Alert.alert(
      'Remove Student',
      `Remove ${student.firstName} ${student.lastName} from this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await removeStudentFromSession(sessionId, student._id);
              fetchSession();
            } catch {
              Alert.alert('Error', 'Could not remove student');
            }
          },
        },
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;
  if (!session) return <View style={styles.center}><Text>Session not found</Text></View>;

  const spots = session.maxStudents - (session.enrolledStudents?.length || 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enrolled Students</Text>
        <TouchableOpacity
          style={styles.attendanceBtn}
          onPress={() => navigation.navigate('TakeAttendance', { sessionId })}
        >
          <Ionicons name="checkbox-outline" size={20} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSession(); }} />}
      >
        {/* Session Info */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <View style={[styles.typeBadge, {
              backgroundColor: session.sessionType === 'Theory' ? COLORS.blueBg : COLORS.brandYellow,
            }]}>
              <Text style={[styles.typeBadgeText, {
                color: session.sessionType === 'Theory' ? COLORS.blue : COLORS.black,
              }]}>{session.sessionType}</Text>
            </View>
            <Text style={styles.sessionDate}>{new Date(session.date).toDateString()}</Text>
          </View>
          <Text style={styles.sessionTime}>{session.startTime} – {session.endTime}</Text>
          <Text style={styles.sessionMeta}>Instructor: {session.instructor?.fullName || 'TBA'}</Text>
          {session.vehicle && (
            <Text style={styles.sessionMeta}>
              Vehicle: {session.vehicle.brand} {session.vehicle.model}
            </Text>
          )}
          <View style={styles.spotsRow}>
            <View style={[styles.spotsBadge, { backgroundColor: spots === 0 ? COLORS.redBg : COLORS.greenBg }]}>
              <Text style={[styles.spotsText, { color: spots === 0 ? COLORS.red : COLORS.green }]}>
                {session.enrolledStudents?.length || 0}/{session.maxStudents} enrolled · {spots} spots left
              </Text>
            </View>
          </View>
        </View>

        {/* Enrolled Students */}
        <Text style={styles.sectionTitle}>
          Enrolled Students ({session.enrolledStudents?.length || 0})
        </Text>

        {session.enrolledStudents?.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No students enrolled yet</Text>
          </View>
        ) : (
          session.enrolledStudents?.map((student, index) => (
            <View key={student._id} style={styles.studentCard}>
              <View style={styles.studentNum}>
                <Text style={styles.studentNumText}>{index + 1}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
                <Text style={styles.studentMeta}>{student.email}</Text>
                {student.NIC && <Text style={styles.studentMeta}>NIC: {student.NIC}</Text>}
                {student.contactNo && <Text style={styles.studentMeta}>{student.contactNo}</Text>}
              </View>
              <View style={styles.studentActions}>
                <TouchableOpacity
                  style={styles.progressBtn}
                  onPress={() => navigation.navigate('StudentProgress', { studentId: student._id })}
                >
                  <Ionicons name="bar-chart-outline" size={16} color={COLORS.blue} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveStudent(student)}
                >
                  <Ionicons name="person-remove-outline" size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Take Attendance Button */}
        {session.enrolledStudents?.length > 0 && (
          <TouchableOpacity
            style={styles.takeAttendanceBtn}
            onPress={() => navigation.navigate('TakeAttendance', { sessionId })}
          >
            <Ionicons name="checkbox-outline" size={20} color={COLORS.white} />
            <Text style={styles.takeAttendanceBtnText}>Take Attendance</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle:    { fontSize: 18, fontWeight: '600', color: COLORS.black },
  attendanceBtn:  { backgroundColor: COLORS.brandYellow, borderRadius: 10, padding: 8 },
  content:        { padding: 20, paddingBottom: 40 },
  sessionCard:    { backgroundColor: COLORS.bgLight, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight },
  sessionRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  typeBadge:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText:  { fontSize: 12, fontWeight: '700' },
  sessionDate:    { fontSize: 15, fontWeight: '700', color: COLORS.black },
  sessionTime:    { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  sessionMeta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  spotsRow:       { marginTop: 10 },
  spotsBadge:     { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  spotsText:      { fontSize: 12, fontWeight: '700' },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  empty:          { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText:      { fontSize: 14, color: COLORS.textMuted },
  studentCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  studentNum:     { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center' },
  studentNumText: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  flex1:          { flex: 1 },
  studentName:    { fontSize: 14, fontWeight: '600', color: COLORS.black },
  studentMeta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  studentActions: { flexDirection: 'row', gap: 8 },
  progressBtn:    { backgroundColor: COLORS.blueBg, borderRadius: 8, padding: 8 },
  removeBtn:      { backgroundColor: COLORS.redBg, borderRadius: 8, padding: 8 },
  takeAttendanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  takeAttendanceBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
