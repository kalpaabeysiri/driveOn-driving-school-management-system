import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getSessionAttendance, updateAttendance, deleteAttendance } from '../../services/sessionApi';
import { COLORS } from '../../theme';

const STATUS_OPTIONS = ['Present', 'Late', 'Absent'];
const STATUS_COLORS  = {
  Present:    { bg: COLORS.greenBg, text: COLORS.green,    icon: 'checkmark-circle' },
  Late:       { bg: '#FFF3CD',      text: '#856404',        icon: 'time-outline'     },
  Absent:     { bg: COLORS.redBg,   text: COLORS.red,      icon: 'close-circle'     },
  'Not Marked':{ bg: COLORS.bgLight,text: COLORS.textMuted, icon: 'ellipse-outline'  },
};

export default function TakeAttendanceScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [printing,   setPrinting]   = useState(false);
  const [editModal,  setEditModal]  = useState(null); // { studentId, attendanceId, currentStatus }

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
  }, []);

  const handleEdit = async (newStatus) => {
    if (!editModal) return;
    try {
      await updateAttendance(editModal.attendanceId, { status: newStatus });
      setEditModal(null);
      // Refresh data
      const { data: res } = await getSessionAttendance(sessionId);
      setData(res);
      Alert.alert('Success', 'Attendance updated successfully');
    } catch {
      Alert.alert('Error', 'Could not update attendance');
    }
  };

  const handleDelete = (studentId, attendanceId) => {
    Alert.alert('Delete Attendance', 'Are you sure you want to delete this attendance record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAttendance(attendanceId);
            // Refresh data
            const { data: res } = await getSessionAttendance(sessionId);
            setData(res);
            Alert.alert('Success', 'Attendance deleted successfully');
          } catch {
            Alert.alert('Error', 'Could not delete attendance');
          }
        },
      },
    ]);
  };

  const handlePrintPDF = async () => {
    if (data?.session?.status !== 'Completed') {
      return Alert.alert('Error', 'PDF can only be generated for completed sessions');
    }
    try {
      setPrinting(true);
      const session = data?.session;
      const rows = data?.attendanceList?.map((item, i) => {
        const status = item.status;
        const color = status === 'Present' ? '#16a34a' : status === 'Late' ? '#854d0e' : status === 'Absent' ? '#dc2626' : '#9ca3af';
        const bg    = status === 'Present' ? '#dcfce7'  : status === 'Late' ? '#fef9c3'  : status === 'Absent' ? '#fee2e2' : '#f3f4f6';
        return `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600">${item.student.firstName} ${item.student.lastName}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280">${item.student.NIC}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb">
            <span style="background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-weight:700;font-size:12px">${status}</span>
          </td>
        </tr>`;
      }).join('');

      const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
          h1   { font-size: 22px; color: #111; margin-bottom: 4px; }
          .sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          .info-grid { display: flex; gap: 24px; margin-bottom: 24px; }
          .info-box  { background: #f3f4f6; border-radius: 10px; padding: 12px 18px; }
          .info-box .val { font-size: 20px; font-weight: 800; color: #111; }
          .info-box .lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { background: #111; color: #fff; padding: 12px 14px; text-align: left; font-size: 12px; }
          .footer { margin-top: 30px; color: #9ca3af; font-size: 11px; text-align: right; }
        </style></head><body>
        <h1>Attendance Report</h1>
        <p class="sub">DriveOn Driving School &nbsp;·&nbsp; Generated ${new Date().toLocaleString()}</p>
        <div class="info-grid">
          <div class="info-box"><div class="val">${session?.sessionType || ''}</div><div class="lbl">Session Type</div></div>
          <div class="info-box"><div class="val">${new Date(session?.date).toDateString()}</div><div class="lbl">Date</div></div>
          <div class="info-box"><div class="val">${session?.startTime} – ${session?.endTime}</div><div class="lbl">Time</div></div>
          <div class="info-box"><div class="val" style="color:#16a34a">${data?.summary?.present || 0}</div><div class="lbl">Present</div></div>
          <div class="info-box"><div class="val" style="color:#854d0e">${data?.summary?.late || 0}</div><div class="lbl">Late</div></div>
          <div class="info-box"><div class="val" style="color:#dc2626">${data?.summary?.absent || 0}</div><div class="lbl">Absent</div></div>
        </div>
        <table>
          <thead><tr>
            <th style="width:40px">#</th>
            <th>Student Name</th>
            <th>NIC</th>
            <th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">DriveOn · Attendance Report · ${new Date().toLocaleDateString()}</div>
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Attendance PDF' });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const presentCount = data?.summary?.present || 0;
  const lateCount    = data?.summary?.late || 0;
  const absentCount  = data?.summary?.absent || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Session summary */}
        <View style={styles.sessionCard}>
          <Text style={styles.sessionType}>{data?.session?.sessionType} Session</Text>
          <Text style={styles.sessionDate}>{new Date(data?.session?.date).toDateString()}</Text>
          <Text style={styles.sessionTime}>{data?.session?.startTime} – {data?.session?.endTime}</Text>
        </View>

        {/* Live summary */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Present', value: presentCount, color: COLORS.green,  bg: COLORS.greenBg },
            { label: 'Late',    value: lateCount,    color: '#856404',      bg: '#FFF3CD'      },
            { label: 'Absent',  value: absentCount,  color: COLORS.red,     bg: COLORS.redBg   },
          ].map(s => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Student list */}
        <Text style={styles.sectionTitle}>Students ({data?.attendanceList?.length || 0})</Text>
        {data?.attendanceList?.map((item, index) => {
          const currentStatus = item.status;
          const colors = STATUS_COLORS[currentStatus] || STATUS_COLORS['Not Marked'];
          const isConfirmed = item.attendance?.confirmed;
          const hasAttendance = item.attendance !== null;

          return (
            <View key={item.student._id} style={styles.studentCard}>
              <View style={styles.studentNum}>
                <Text style={styles.studentNumText}>{index + 1}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.studentName}>{item.student.firstName} {item.student.lastName}</Text>
                <Text style={styles.studentNIC}>{item.student.NIC}</Text>
              </View>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                <Ionicons name={colors.icon} size={16} color={colors.text} />
                <Text style={[styles.statusBadgeText, { color: colors.text }]}>{currentStatus}</Text>
              </View>
              {isConfirmed && (
                <View style={styles.confirmedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                </View>
              )}
              {/* Edit/Delete buttons */}
              {hasAttendance && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setEditModal({
                      studentId: item.student._id,
                      attendanceId: item.attendance._id,
                      currentStatus,
                    })}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.student._id, item.attendance._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Print PDF button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handlePrintPDF} disabled={printing || data?.session?.status !== 'Completed'}>
          {printing
            ? <ActivityIndicator color={COLORS.white} />
            : <>
                <Ionicons name="print-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Generate PDF</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Attendance Status</Text>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.modalOption,
                  editModal?.currentStatus === status && styles.modalOptionSelected,
                ]}
                onPress={() => handleEdit(status)}
              >
                <Ionicons
                  name={STATUS_COLORS[status].icon}
                  size={20}
                  color={editModal?.currentStatus === status ? COLORS.white : STATUS_COLORS[status].text}
                />
                <Text style={[
                  styles.modalOptionText,
                  editModal?.currentStatus === status && styles.modalOptionTextSelected,
                ]}>{status}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setEditModal(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  sessionCard:  { backgroundColor: COLORS.brandYellow, borderRadius: 16, padding: 16, marginBottom: 16 },
  sessionType:  { fontSize: 16, fontWeight: '700', color: COLORS.black },
  sessionDate:  { fontSize: 14, color: COLORS.textDark, marginTop: 2 },
  sessionTime:  { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard:  { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 10 },
  studentCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8 },
  studentNum:   { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bgLight, alignItems: 'center', justifyContent: 'center' },
  studentNumText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  flex1:        { flex: 1 },
  studentName:  { fontSize: 13, fontWeight: '600', color: COLORS.black },
  studentNIC:   { fontSize: 11, color: COLORS.textMuted },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  confirmedBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.greenBg,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.bgLight,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.brandOrange,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  modalOptionTextSelected: {
    color: COLORS.white,
  },
  modalCancel: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
