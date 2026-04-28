import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { selfMarkAttendance } from '../../services/sessionApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

const STATUS_OPTIONS = ['Present', 'Late', 'Absent'];
const STATUS_COLORS = {
  Present: { bg: COLORS.greenBg, text: COLORS.green, icon: 'checkmark-circle' },
  Late: { bg: '#FFF3CD', text: '#856404', icon: 'time-outline' },
  Absent: { bg: COLORS.redBg, text: COLORS.red, icon: 'close-circle' },
};

export default function MarkAttendanceScreen({ route, navigation }) {
  const { sessionId, sessionInfo } = route.params;
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      return Alert.alert('Error', 'Please select your attendance status');
    }
    try {
      setSubmitting(true);
      await selfMarkAttendance({ sessionId, status: selectedStatus });
      Alert.alert('Success', 'Attendance marked successfully. Your instructor will confirm it.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Session Info */}
        {sessionInfo && (
          <View style={styles.sessionCard}>
            <Text style={styles.sessionType}>{sessionInfo.sessionType} Session</Text>
            <Text style={styles.sessionDate}>{new Date(sessionInfo.date).toDateString()}</Text>
            <Text style={styles.sessionTime}>{sessionInfo.startTime} – {sessionInfo.endTime}</Text>
          </View>
        )}

        <Text style={styles.infoText}>
          Select your attendance status for this session. Your instructor will confirm it.
        </Text>

        {/* Status Options */}
        <View style={styles.statusOptions}>
          {STATUS_OPTIONS.map(status => {
            const colors = STATUS_COLORS[status];
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusOption, isSelected && { backgroundColor: colors.bg, borderColor: colors.text }]}
                onPress={() => setSelectedStatus(status)}
              >
                <Ionicons
                  name={colors.icon}
                  size={40}
                  color={isSelected ? colors.text : COLORS.textMuted}
                />
                <Text style={[styles.statusOptionText, isSelected && { color: colors.text, fontWeight: '700' }]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !selectedStatus && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedStatus || submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Submit Attendance</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, flex: 1 },
  sessionCard: { backgroundColor: COLORS.brandYellow, borderRadius: 16, padding: 16, marginBottom: 24 },
  sessionType: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  sessionDate: { fontSize: 14, color: COLORS.textDark, marginTop: 2 },
  sessionTime: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  infoText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  statusOptions: { gap: 16, marginBottom: 32 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16 },
  statusOptionText: { fontSize: 16, color: COLORS.textMuted },
  submitBtn: { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: COLORS.bgLight },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
