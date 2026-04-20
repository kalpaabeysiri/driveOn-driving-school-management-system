import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../../theme';
import { updatePracticalExam } from '../../../services/examApi';
import SimplePicker from '../../../components/admin/exam/SimplePicker';

const EditPracticalExamScreen = ({ navigation, route }) => {
  const { exam } = route.params;

  const [formData, setFormData] = useState({
    date:            exam.date ? exam.date.substring(0, 10) : '',
    startTime:       exam.startTime       || '',
    endTime:         exam.endTime         || '',
    trialLocation:   exam.trialLocation   || '',
    vehicleCategory: exam.vehicleCategory || 'Light',
    status:          exam.status          || 'Scheduled',
    examiner:        exam.examiner        || '',
    assignedVehicle: exam.assignedVehicle || '',
    sourceNote:      exam.sourceNote      || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker]   = useState(false);

  const vehicleCategories = ['Light', 'Heavy', 'Bike'];
  const statuses          = ['Scheduled', 'Completed', 'Cancelled'];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date)                    newErrors.date          = 'Exam date is required';
    if (!formData.startTime)               newErrors.startTime     = 'Start time is required';
    if (!formData.endTime)                 newErrors.endTime       = 'End time is required';
    if (!formData.trialLocation.trim())    newErrors.trialLocation = 'Trial location is required';

    if (formData.startTime && formData.endTime) {
      const [sh, sm] = formData.startTime.split(':');
      const [eh, em] = formData.endTime.split(':');
      if (parseInt(eh) * 60 + parseInt(em) <= parseInt(sh) * 60 + parseInt(sm)) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await updatePracticalExam(exam._id, formData);
      Alert.alert('Success', 'Practical exam updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update exam');
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
          onPress={() => field === 'vehicleCategory' ? setShowVehiclePicker(true) : setShowStatusPicker(true)}
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Practical Exam</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {renderFormField('Exam Date', 'date', 'YYYY-MM-DD')}

          <View style={styles.timeRow}>
            <View style={styles.timeGroup}>
              {renderFormField('Start Time', 'startTime', 'HH:MM')}
            </View>
            <View style={styles.timeGroup}>
              {renderFormField('End Time', 'endTime', 'HH:MM')}
            </View>
          </View>

          {renderFormField('Trial Location', 'trialLocation', 'Enter trial location')}
          {renderFormField('Vehicle Category', 'vehicleCategory', 'Select category', 'default', vehicleCategories)}
          {renderFormField('Status', 'status', 'Select status', 'default', statuses)}
          {renderFormField('Examiner (Optional)', 'examiner', 'Enter examiner name')}
          {renderFormField('Assigned Vehicle (Optional)', 'assignedVehicle', 'Enter vehicle number')}
          {renderFormField('Source Note (Optional)', 'sourceNote', 'e.g., Updated based on DMT announcement')}

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
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SimplePicker
        visible={showVehiclePicker}
        onClose={() => setShowVehiclePicker(false)}
        onSelect={(vehicleCategory) => setFormData({ ...formData, vehicleCategory })}
        options={vehicleCategories}
        title="Select Vehicle Category"
        selectedValue={formData.vehicleCategory}
      />

      <SimplePicker
        visible={showStatusPicker}
        onClose={() => setShowStatusPicker(false)}
        onSelect={(status) => setFormData({ ...formData, status })}
        options={statuses}
        title="Select Status"
        selectedValue={formData.status}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.black, flex: 1, textAlign: 'center' },
  placeholder: { width: 24 },
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  form: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
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
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4 },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeGroup: { flex: 1 },
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
  pickerText: { fontSize: 16, color: COLORS.black, flex: 1 },
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
  submitBtnDisabled: { backgroundColor: COLORS.textMuted },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white }
});

export default EditPracticalExamScreen;
