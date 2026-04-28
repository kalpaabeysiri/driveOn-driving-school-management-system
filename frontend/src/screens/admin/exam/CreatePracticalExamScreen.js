import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../../theme';
import { createPracticalExam } from '../../../services/examApi';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreatePracticalExamScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    trialLocation: '',
    vehicleCategory: 'Light',
    status: 'Scheduled',
    examiner: '',
    assignedVehicle: '',
    sourceNote: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());

  const vehicleCategories = ['Light', 'Heavy', 'Bike'];
  const statuses = ['Scheduled', 'Completed', 'Cancelled'];

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${mon}-${day}`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderPicker = (mode, value, setValue, show, setShow) => {
    if (!show) return null;

    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === 'date' ? 'calendar' : 'spinner'}
          minimumDate={mode === 'date' ? new Date() : undefined}
          onChange={(event, selected) => {
            setShow(false);
            if (selected) {
              setValue(selected);
              if (mode === 'date') {
                setFormData(prev => ({ ...prev, date: formatDate(selected) }));
              } else if (mode === 'time') {
                if (show === showStartTimePicker) {
                  setFormData(prev => ({ ...prev, startTime: formatTime(selected) }));
                } else {
                  setFormData(prev => ({ ...prev, endTime: formatTime(selected) }));
                }
              }
            }
          }}
        />
      );
    }

    return (
      <View style={styles.iosPickerWrap}>
        <View style={styles.iosPickerHeader}>
          <TouchableOpacity onPress={() => setShow(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={value}
          mode={mode}
          display="spinner"
          minimumDate={mode === 'date' ? new Date() : undefined}
          onChange={(event, selected) => {
            if (selected) {
              setValue(selected);
              if (mode === 'date') {
                setFormData(prev => ({ ...prev, date: formatDate(selected) }));
              } else if (mode === 'time') {
                if (show === showStartTimePicker) {
                  setFormData(prev => ({ ...prev, startTime: formatTime(selected) }));
                } else {
                  setFormData(prev => ({ ...prev, endTime: formatTime(selected) }));
                }
              }
            }
          }}
          style={styles.iosPicker}
        />
      </View>
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Exam date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.trialLocation.trim()) {
      newErrors.trialLocation = 'Trial location is required';
    }

    // Validate time format and logic
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':');
      const [endHour, endMin] = formData.endTime.split(':');
      
      const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
      const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
      
      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    // Validate date is not in past
    if (formData.date) {
      const examDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (examDate < today) {
        newErrors.date = 'Exam date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Remove empty optional fields that expect ObjectId
      const submitData = { ...formData };
      if (!submitData.examiner.trim()) {
        delete submitData.examiner;
      }
      if (!submitData.assignedVehicle.trim()) {
        delete submitData.assignedVehicle;
      }
      if (!submitData.sourceNote.trim()) {
        delete submitData.sourceNote;
      }
      
      await createPracticalExam(submitData);
      Alert.alert('Success', 'Practical exam created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Practical Exam</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* KeyboardAvoidingView */}
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
          {/* Date Picker */}
          <Text style={styles.label}>Exam Date *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => {
              setShowStartTimePicker(false);
              setShowEndTimePicker(false);
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.brandOrange} />
            <Text style={styles.pickerText}>{formData.date || 'Select exam date'}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          {renderPicker('date', selectedDate, setSelectedDate, showDatePicker, setShowDatePicker)}

          {/* Start Time */}
          <Text style={styles.label}>Start Time *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => {
              setShowDatePicker(false);
              setShowEndTimePicker(false);
              setShowStartTimePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color={COLORS.brandOrange} />
            <Text style={styles.pickerText}>{formData.startTime || 'Select start time'}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
          {renderPicker('time', selectedStartTime, setSelectedStartTime, showStartTimePicker, setShowStartTimePicker)}

          {/* End Time */}
          <Text style={styles.label}>End Time *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => {
              setShowDatePicker(false);
              setShowStartTimePicker(false);
              setShowEndTimePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color={COLORS.brandOrange} />
            <Text style={styles.pickerText}>{formData.endTime || 'Select end time'}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
          {renderPicker('time', selectedEndTime, setSelectedEndTime, showEndTimePicker, setShowEndTimePicker)}

          {/* Trial Location */}
          <Text style={styles.label}>Trial Location *</Text>
          <TextInput
            style={[styles.input, errors.trialLocation && styles.inputError]}
            placeholder="Enter trial location"
            value={formData.trialLocation}
            onChangeText={(text) => handleChange('trialLocation', text)}
          />
          {errors.trialLocation && <Text style={styles.errorText}>{errors.trialLocation}</Text>}

          {/* Vehicle Category */}
          <Text style={styles.label}>Vehicle Category *</Text>
          <View style={styles.optRow}>
            {vehicleCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.optBtn, formData.vehicleCategory === cat && styles.optBtnActive]}
                onPress={() => handleChange('vehicleCategory', cat)}
              >
                <Ionicons
                  name={cat === 'Light' ? 'car-outline' : cat === 'Heavy' ? 'bus-outline' : 'bicycle-outline'}
                  size={18}
                  color={formData.vehicleCategory === cat ? COLORS.black : COLORS.textMuted}
                />
                <Text style={[styles.optText, formData.vehicleCategory === cat && styles.optTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status */}
          <Text style={styles.label}>Status *</Text>
          <View style={styles.optRow}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.optBtn, formData.status === status && styles.optBtnActive]}
                onPress={() => handleChange('status', status)}
              >
                <Ionicons
                  name={status === 'Scheduled' ? 'calendar-outline' : status === 'Completed' ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={formData.status === status ? COLORS.black : COLORS.textMuted}
                />
                <Text style={[styles.optText, formData.status === status && styles.optTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Optional Fields - Leave blank if not assigning */}
          <Text style={styles.label}>Examiner (Leave blank if not assigned)</Text>
          <TextInput
            style={styles.input}
            placeholder="Select examiner"
            value={formData.examiner}
            onChangeText={(text) => handleChange('examiner', text)}
          />

          <Text style={styles.label}>Assigned Vehicle (Leave blank if not assigned)</Text>
          <TextInput
            style={styles.input}
            placeholder="Select vehicle"
            value={formData.assignedVehicle}
            onChangeText={(text) => handleChange('assignedVehicle', text)}
          />

          <Text style={styles.label}>Source Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Created based on DMT announcement"
            value={formData.sourceNote}
            onChangeText={(text) => handleChange('sourceNote', text)}
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>Create Practical Exam</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  flex1: { flex: 1 },
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
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
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
  inputError: { borderColor: COLORS.red },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { color: COLORS.red, fontSize: 12, marginTop: -8, marginBottom: 8 },
  
  // Option buttons (for vehicle category and status)
  optRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
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
  optBtnActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  optText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  optTextActive: { color: COLORS.white },
  
    
  // Picker button
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  pickerText: { flex: 1, fontSize: 14, color: COLORS.black },
  
  // iOS Picker
  iosPickerWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
    width: '100%',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: COLORS.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iosDoneBtn: { paddingHorizontal: 16, paddingVertical: 6 },
  iosDoneText: { fontSize: 16, fontWeight: '600', color: COLORS.brandOrange },
  iosPicker: { height: 200, width: '100%' },
  
  // Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: COLORS.textMuted },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});

export default CreatePracticalExamScreen;
