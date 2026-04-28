import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../../theme';
import { createTheoryExam } from '../../../services/examApi';
import SimplePicker from '../../../components/admin/exam/SimplePicker';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateTheoryExamScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    examName: '',
    date: '',
    startTime: '',
    endTime: '',
    locationOrHall: '',
    language: 'English',
    status: 'Scheduled',
    sourceNote: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  
  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());

  const languages = ['English', 'Sinhala', 'Tamil'];
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

    if (!formData.examName.trim()) {
      newErrors.examName = 'Exam name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Exam date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.locationOrHall.trim()) {
      newErrors.locationOrHall = 'Location is required';
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
      await createTheoryExam(formData);
      Alert.alert('Success', 'Theory exam created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (label, field, placeholder, keyboardType = 'default', options = null) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      {options ? (
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => field === 'language' ? setShowLanguagePicker(true) : setShowStatusPicker(true)}
        >
          <Text style={styles.pickerText}>{formData[field] || placeholder}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      ) : (
        <TextInput
          style={[styles.input, errors[field] && styles.inputError]}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={(text) => setFormData({ ...formData, [field]: text })}
          keyboardType={keyboardType}
        />
      )}
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Theory Exam</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {renderFormField('Exam Name', 'examName', 'Enter exam name')}
          
          <View style={styles.formGroup}>
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
          </View>
          
          {/* Start Time */}
          <View style={styles.formGroup}>
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
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
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
          </View>
          
          {renderFormField('Location/Hall', 'locationOrHall', 'Enter location or hall')}
          
          {renderFormField('Language', 'language', 'Select language', 'default', languages)}
          
          {renderFormField('Status', 'status', 'Select status', 'default', statuses)}
          
          {renderFormField('Source Note (Optional)', 'sourceNote', 'e.g., Created based on DMT announcement')}

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
                <Text style={styles.submitBtnText}>Create Theory Exam</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pickers */}
      <SimplePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelect={(language) => setFormData({ ...formData, language })}
        options={languages}
        title="Select Language"
        selectedValue={formData.language}
      />

      <SimplePicker
        visible={showStatusPicker}
        onClose={() => setShowStatusPicker(false)}
        onSelect={(status) => setFormData({ ...formData, status })}
        options={statuses}
        title="Select Status"
        selectedValue={formData.status}
      />
    </View>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: COLORS.white },
  topSafeArea: { backgroundColor: COLORS.gray },
  scrollView: { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: '600', color: COLORS.black },
  placeholder: { width: 24 },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40
  },
  formGroup: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.black
  },
  inputError: {
    borderColor: COLORS.red
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 4
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12
  },
  timeGroup: {
    flex: 1
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 8
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white
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
  iosDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  iosDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.brandOrange,
  },
  iosPicker: {
    height: 200,
    width: '100%',
  },
};

export default CreateTheoryExamScreen;
