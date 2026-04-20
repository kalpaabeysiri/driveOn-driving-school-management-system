import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getInstructors, getVehicles, createSession } from '../../services/api';
import { COLORS } from '../../theme';

export default function BookSessionScreen({ navigation }) {
  const [instructors, setInstructors] = useState([]);
  const [vehicles,    setVehicles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  const [type,         setType]         = useState('Theory');
  const [date,         setDate]         = useState('');
  const [startTime,    setStartTime]    = useState('');
  const [endTime,      setEndTime]      = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [vehicleId,    setVehicleId]    = useState('');
  const [notes,        setNotes]        = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ins, veh] = await Promise.all([getInstructors(), getVehicles()]);
        setInstructors(ins.data);
        setVehicles(veh.data.filter(v => v.available));
      } catch {
        Alert.alert('Error', 'Could not load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime || !instructorId) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    try {
      setSubmitting(true);
      await createSession({
        type, date, startTime, endTime,
        instructor: instructorId,
        vehicle: vehicleId || undefined,
        notes,
      });
      Alert.alert('Success', 'Session booked successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not book session');
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
        <Text style={styles.headerTitle}>Book a Session</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Session Type */}
        <Text style={styles.label}>Session Type *</Text>
        <View style={styles.typeRow}>
          {['Theory', 'Practical'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2026-04-15"
          value={date}
          onChangeText={setDate}
        />

        {/* Time */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Start Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 09:00 AM"
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>End Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 11:00 AM"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

        {/* Instructor */}
        <Text style={styles.label}>Select Instructor *</Text>
        {instructors.map((ins) => (
          <TouchableOpacity
            key={ins._id}
            style={[styles.selectCard, instructorId === ins._id && styles.selectCardActive]}
            onPress={() => setInstructorId(ins._id)}
          >
            <View style={styles.selectIcon}>
              <Ionicons name="person-outline" size={20} color={COLORS.black} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.selectName}>{ins.name}</Text>
              <Text style={styles.selectMeta}>{ins.specialization} · {ins.experience} yrs exp</Text>
            </View>
            {instructorId === ins._id && (
              <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
            )}
          </TouchableOpacity>
        ))}

        {/* Vehicle (only for Practical) */}
        {type === 'Practical' && (
          <>
            <Text style={[styles.label, { marginTop: 8 }]}>Select Vehicle</Text>
            {vehicles.map((v) => (
              <TouchableOpacity
                key={v._id}
                style={[styles.selectCard, vehicleId === v._id && styles.selectCardActive]}
                onPress={() => setVehicleId(v._id)}
              >
                <View style={styles.selectIcon}>
                  <Ionicons name="car-outline" size={20} color={COLORS.black} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.selectName}>{v.make} {v.model} ({v.year})</Text>
                  <Text style={styles.selectMeta}>{v.type} · {v.plateNumber}</Text>
                </View>
                {vehicleId === v._id && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Notes */}
        <Text style={[styles.label, { marginTop: 8 }]}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Any special requests..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Confirm Booking</Text>
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
  typeRow:          { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeBtn:          { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive:    { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  typeBtnText:      { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  typeBtnTextActive:{ color: COLORS.black },
  row:              { flexDirection: 'row' },
  flex1:            { flex: 1 },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  selectCardActive: { borderColor: COLORS.brandOrange, backgroundColor: '#FFF8ED' },
  selectIcon:       { backgroundColor: COLORS.brandYellow, borderRadius: 8, padding: 8 },
  selectName:       { fontSize: 14, fontWeight: '600', color: COLORS.black },
  selectMeta:       { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  submitBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
