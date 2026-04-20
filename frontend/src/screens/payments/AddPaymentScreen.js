import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getSessions, createPayment } from '../../services/api';
import { getAllStudents } from '../../services/studentApi';
import { BASE_URL } from '../../services/api';
import { COLORS } from '../../theme';

const METHODS = ['Cash', 'Card', 'Bank Transfer'];

export default function AddPaymentScreen({ navigation }) {
  const [sessions,   setSessions]   = useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount,    setAmount]    = useState('');
  const [method,    setMethod]    = useState('Cash');
  const [sessionId, setSessionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [reference, setReference] = useState('');
  const [receipt,   setReceipt]   = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, stuRes] = await Promise.all([
          getSessions(),
          getAllStudents(),
        ]);
        setSessions(sessRes.data.filter(s => s.status === 'Scheduled' || s.status === 'Completed'));
        setStudents(stuRes.data);
      } catch {
        console.log('Could not load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission needed', 'Please allow access to your photo library');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setReceipt(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !method) {
      return Alert.alert('Error', 'Amount and payment method are required');
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return Alert.alert('Error', 'Please enter a valid amount');
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('method', method);
      if (studentId)  formData.append('studentId', studentId);
      if (sessionId)  formData.append('session', sessionId);
      if (reference)  formData.append('reference', reference);
      if (receipt) {
        formData.append('receipt', {
          uri:  receipt.uri,
          type: 'image/jpeg',
          name: `receipt_${Date.now()}.jpg`,
        });
      }

      await createPayment(formData);
      Alert.alert('Success', 'Payment recorded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Amount */}
        <Text style={styles.label}>Amount (LKR) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Method */}
        <Text style={styles.label}>Payment Method *</Text>
        <View style={styles.methodRow}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              onPress={() => setMethod(m)}
            >
              <Ionicons
                name={m === 'Card' ? 'card-outline' : m === 'Cash' ? 'cash-outline' : 'business-outline'}
                size={18}
                color={method === m ? COLORS.black : COLORS.textMuted}
              />
              <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reference */}
        <Text style={styles.label}>Reference / Transaction ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. TXN123456"
          value={reference}
          onChangeText={setReference}
        />

        {/* Student */}
        <Text style={styles.label}>Student (required for admin) *</Text>
        {students.length === 0 ? (
          <Text style={styles.noSessions}>No students found</Text>
        ) : (
          students.map((s) => (
            <TouchableOpacity
              key={s._id}
              style={[styles.sessionCard, studentId === s._id && styles.sessionCardActive]}
              onPress={() => setStudentId(studentId === s._id ? '' : s._id)}
            >
              <View style={styles.flex1}>
                <Text style={styles.sessionType}>{s.firstName} {s.lastName}</Text>
                <Text style={styles.sessionMeta}>{s.email} · {s.NIC}</Text>
              </View>
              {studentId === s._id && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Link to session */}
        <Text style={styles.label}>Link to Session (optional)</Text>
        {sessions.length === 0 ? (
          <Text style={styles.noSessions}>No scheduled or completed sessions available</Text>
        ) : (
          sessions.map((s) => (
            <TouchableOpacity
              key={s._id}
              style={[styles.sessionCard, sessionId === s._id && styles.sessionCardActive]}
              onPress={() => setSessionId(sessionId === s._id ? '' : s._id)}
            >
              <View style={styles.flex1}>
                <Text style={styles.sessionType}>{s.sessionType} Session</Text>
                <Text style={styles.sessionMeta}>
                  {new Date(s.date).toDateString()} · {s.startTime}
                </Text>
              </View>
              {sessionId === s._id && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Receipt Upload */}
        <Text style={[styles.label, { marginTop: 8 }]}>Upload Receipt (optional)</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
          {receipt ? (
            <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.uploadText}>Tap to upload receipt image</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG up to 5MB</Text>
            </>
          )}
        </TouchableOpacity>
        {receipt && (
          <TouchableOpacity onPress={() => setReceipt(null)}>
            <Text style={styles.removeText}>Remove image</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Record Payment</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.white },
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:     { padding: 20, paddingBottom: 40 },
  label:       { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  methodRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  methodBtn:       { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  methodBtnActive: { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  methodText:      { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  methodTextActive:{ color: COLORS.black },
  noSessions:      { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sessionCardActive: { borderColor: COLORS.brandOrange, backgroundColor: '#FFF8ED' },
  flex1:         { flex: 1 },
  sessionType:   { fontSize: 14, fontWeight: '600', color: COLORS.black },
  sessionMeta:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  uploadBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    minHeight: 120,
  },
  uploadText:     { fontSize: 14, fontWeight: '500', color: COLORS.textMuted },
  uploadSubtext:  { fontSize: 12, color: COLORS.borderLight },
  receiptPreview: { width: '100%', height: 180, borderRadius: 10, resizeMode: 'cover' },
  removeText:     { color: COLORS.red, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  submitBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
