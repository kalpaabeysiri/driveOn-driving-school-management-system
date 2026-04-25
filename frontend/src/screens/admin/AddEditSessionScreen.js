import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  createSession,
  updateSession,
  getSessionById,
} from '../../services/sessionApi';

import {
  getAllInstructors,
  getAllVehicles,
} from '../../services/instructorVehicleApi';

import { COLORS } from '../../theme';

export default function AddEditSessionScreen({ route, navigation }) {
  const sessionId = route.params?.sessionId;
  const isEdit = !!sessionId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const createTime = (hours, minutes = 0) => {
    const d = new Date();
    d.setHours(hours);
    d.setMinutes(minutes);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fixed default times
  const [selectedStartTime, setSelectedStartTime] = useState(createTime(8, 0));
  const [selectedEndTime, setSelectedEndTime] = useState(createTime(10, 0));

  const [form, setForm] = useState({
    sessionType: 'Theory',
    maxStudents: '10',
    instructor: '',
    vehicle: '',
    notes: '',
    status: 'Scheduled',
  });

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${mon}-${day}`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  };

  const parseTimeStringToDate = (timeString) => {
    if (!timeString) return createTime(8, 0);

    const [time, ampm] = timeString.split(' ');
    const [h, m] = time.split(':');

    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);

    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    }

    if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }

    return createTime(hours, minutes);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ins, veh] = await Promise.all([
          getAllInstructors(),
          getAllVehicles({ available: true }),
        ]);

        setInstructors(ins.data);
        setVehicles(veh.data);

        if (isEdit) {
          const { data } = await getSessionById(sessionId);

          setForm({
            sessionType: data.sessionType || 'Theory',
            maxStudents: String(data.maxStudents || 10),
            instructor: data.instructor?._id || '',
            vehicle: data.vehicle?._id || '',
            notes: data.notes || '',
            status: data.status || 'Scheduled',
          });

          if (data.date) {
            setSelectedDate(new Date(data.date));
          }

          if (data.startTime) {
            setSelectedStartTime(parseTimeStringToDate(data.startTime));
          }

          if (data.endTime) {
            setSelectedEndTime(parseTimeStringToDate(data.endTime));
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Could not load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    if (!form.instructor) {
      Alert.alert('Error', 'Please select an instructor');
      return false;
    }

    if (form.sessionType === 'Practical' && !form.vehicle) {
      Alert.alert('Error', 'Vehicle is required for Practical sessions');
      return false;
    }

    if (!form.maxStudents || Number(form.maxStudents) <= 0) {
      Alert.alert('Error', 'Please enter a valid max students count');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        sessionType: form.sessionType,
        date: formatDate(selectedDate),
        startTime: formatTime(selectedStartTime),
        endTime: formatTime(selectedEndTime),
        maxStudents: parseInt(form.maxStudents, 10),
        instructor: form.instructor,
        vehicle: form.sessionType === 'Practical' ? form.vehicle : undefined,
        notes: form.notes,
        status: form.status,
      };

      if (isEdit) {
        await updateSession(sessionId, payload);

        Alert.alert('Success', 'Session updated!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await createSession(payload);

        Alert.alert('Success', 'Session created!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickerChange = (mode, value, setValue, setShow) => {
    return (event, selected) => {
      if (Platform.OS === 'android') {
        setShow(false);
      }

      if (event?.type === 'dismissed') {
        return;
      }

      if (!selected) {
        return;
      }

      if (mode === 'time') {
        const fixedTime = new Date(value);
        fixedTime.setHours(selected.getHours());
        fixedTime.setMinutes(selected.getMinutes());
        fixedTime.setSeconds(0);
        fixedTime.setMilliseconds(0);

        setValue(fixedTime);
      } else {
        setValue(selected);
      }
    };
  };

  const renderPicker = (mode, value, setValue, show, setShow) => {
    if (!show) return null;

    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === 'date' ? 'calendar' : 'clock'}
          minimumDate={mode === 'date' ? new Date() : undefined}
          onChange={handlePickerChange(mode, value, setValue, setShow)}
        />
      );
    }

    return (
      <View style={styles.iosPickerWrap}>
        <View style={styles.iosPickerHeader}>
          <TouchableOpacity
            onPress={() => setShow(false)}
            style={styles.iosDoneBtn}
          >
            <Text style={styles.iosDoneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <DateTimePicker
          value={value}
          mode={mode}
          display="spinner"
          minimumDate={mode === 'date' ? new Date() : undefined}
          onChange={handlePickerChange(mode, value, setValue, setShow)}
          style={styles.iosPicker}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Session' : 'Create Session'}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Session Type *</Text>

          <View style={styles.optRow}>
            {['Theory', 'Practical'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.optBtn,
                  form.sessionType === t && styles.optBtnActive,
                ]}
                onPress={() => handleChange('sessionType', t)}
              >
                <Ionicons
                  name={t === 'Theory' ? 'book-outline' : 'car-outline'}
                  size={18}
                  color={
                    form.sessionType === t
                      ? COLORS.black
                      : COLORS.textMuted
                  }
                />

                <Text
                  style={[
                    styles.optText,
                    form.sessionType === t && styles.optTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date *</Text>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => {
              setShowStartTimePicker(false);
              setShowEndTimePicker(false);
              setShowDatePicker(true);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={COLORS.brandOrange}
            />
            <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {renderPicker(
            'date',
            selectedDate,
            setSelectedDate,
            showDatePicker,
            setShowDatePicker
          )}

          <Text style={styles.label}>Start Time *</Text>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => {
              setShowDatePicker(false);
              setShowEndTimePicker(false);
              setShowStartTimePicker(true);
            }}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={COLORS.brandOrange}
            />
            <Text style={styles.pickerText}>
              {formatTime(selectedStartTime)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {renderPicker(
            'time',
            selectedStartTime,
            setSelectedStartTime,
            showStartTimePicker,
            setShowStartTimePicker
          )}

          <Text style={styles.label}>End Time *</Text>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => {
              setShowDatePicker(false);
              setShowStartTimePicker(false);
              setShowEndTimePicker(true);
            }}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={COLORS.brandOrange}
            />
            <Text style={styles.pickerText}>{formatTime(selectedEndTime)}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {renderPicker(
            'time',
            selectedEndTime,
            setSelectedEndTime,
            showEndTimePicker,
            setShowEndTimePicker
          )}

          <Text style={styles.label}>Max Students</Text>

          <TextInput
            style={styles.input}
            placeholder="10"
            value={form.maxStudents}
            onChangeText={(v) => handleChange('maxStudents', v)}
            keyboardType="numeric"
            returnKeyType="done"
          />

          <Text style={styles.label}>Select Instructor *</Text>

          {instructors.length === 0 ? (
            <Text style={styles.noDataText}>
              No instructors found. Add instructors first.
            </Text>
          ) : (
            instructors.map((ins) => (
              <TouchableOpacity
                key={ins._id}
                style={[
                  styles.selectCard,
                  form.instructor === ins._id && styles.selectCardActive,
                ]}
                onPress={() => handleChange('instructor', ins._id)}
              >
                <View style={styles.selectIcon}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.black}
                  />
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.selectName}>
                    {ins.fullName || ins.name}
                  </Text>
                  <Text style={styles.selectMeta}>
                    {ins.specialization} · {ins.contactNumber || ins.phone}
                  </Text>
                </View>

                {form.instructor === ins._id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={COLORS.green}
                  />
                )}
              </TouchableOpacity>
            ))
          )}

          {form.sessionType === 'Practical' && (
            <>
              <Text style={[styles.label, { marginTop: 8 }]}>
                Select Vehicle *
              </Text>

              {vehicles.length === 0 ? (
                <Text style={styles.noDataText}>
                  No available vehicles found.
                </Text>
              ) : (
                vehicles.map((v) => (
                  <TouchableOpacity
                    key={v._id}
                    style={[
                      styles.selectCard,
                      form.vehicle === v._id && styles.selectCardActive,
                    ]}
                    onPress={() => handleChange('vehicle', v._id)}
                  >
                    <View style={styles.selectIcon}>
                      <Ionicons
                        name="car-outline"
                        size={20}
                        color={COLORS.black}
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Text style={styles.selectName}>
                        {v.brand} {v.model} ({v.year})
                      </Text>
                      <Text style={styles.selectMeta}>
                        {v.licensePlate} · {v.transmission}
                      </Text>
                    </View>

                    {form.vehicle === v._id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={COLORS.green}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          <Text style={[styles.label, { marginTop: 8 }]}>Notes</Text>

          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Any additional notes..."
            value={form.notes}
            onChangeText={(v) => handleChange('notes', v)}
            multiline
            blurOnSubmit
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEdit ? 'Update Session' : 'Create Session'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  flex1: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },

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

  optRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  optBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optBtnActive: {
    backgroundColor: COLORS.brandYellow,
    borderColor: COLORS.brandYellow,
  },

  optText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  optTextActive: {
    color: COLORS.black,
  },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },

  pickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },

  iosPickerWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },

  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  iosDoneBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  iosDoneText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  iosPicker: {
    height: 180,
  },

  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  selectCardActive: {
    borderColor: COLORS.brandOrange,
    backgroundColor: '#FFF8ED',
  },

  selectIcon: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 8,
    padding: 8,
  },

  selectName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },

  selectMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  noDataText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },

  submitBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  submitBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});