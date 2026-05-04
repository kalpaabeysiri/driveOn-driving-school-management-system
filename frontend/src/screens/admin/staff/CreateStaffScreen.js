import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createStaff } from '../../../services/api';
import { COLORS } from '../../../theme';
import { KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateStaffScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    NIC: '',
    dateOfBirth: '',
    address: '',
    city: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    emergencyContact: '',
    department: '',
    position: '',
    employmentType: 'Permanent',
    salary: '',
    workSchedule: 'Full Day',
    permissions: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const departments = [
    'Administration', 'Accounts', 'Operations', 'Customer Service', 'HR', 'IT Support'
  ];

  const positions = {
    'Administration': ['Office Manager', 'Administrator', 'Receptionist', 'Data Entry Clerk'],
    'Accounts': ['Accountant', 'Finance Manager', 'Accounts Clerk', 'Billing Officer'],
    'Operations': ['Operations Manager', 'Coordinator', 'Supervisor'],
    'Customer Service': ['Customer Service Rep', 'Support Specialist', 'Call Center Agent'],
    'HR': ['HR Manager', 'HR Officer', 'Recruiter'],
    'IT Support': ['IT Manager', 'System Administrator', 'IT Support Specialist']
  };

  const availablePermissions = [
    { id: 'manage_students', label: 'Manage Students' },
    { id: 'manage_instructors', label: 'Manage Instructors' },
    { id: 'manage_vehicles', label: 'Manage Vehicles' },
    { id: 'manage_sessions', label: 'Manage Sessions' },
    { id: 'manage_payments', label: 'Manage Payments' },
    { id: 'manage_exams', label: 'Manage Exams' },
    { id: 'view_reports', label: 'View Reports' },
    { id: 'manage_staff', label: 'Manage Staff' },
    { id: 'send_notifications', label: 'Send Notifications' }
  ];

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${mon}-${day}`;
  };

  const renderPicker = (mode, value, setValue, show, setShow) => {
    if (!show) return null;

    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === 'date' ? 'calendar' : 'spinner'}
          onChange={(event, selected) => {
            setShow(false);
            if (selected) {
              setValue(selected);
              setFormData(prev => ({ ...prev, dateOfBirth: formatDate(selected) }));
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
          onChange={(event, selected) => {
            if (selected) {
              setValue(selected);
              setFormData(prev => ({ ...prev, dateOfBirth: formatDate(selected) }));
            }
          }}
          style={styles.iosPicker}
        />
      </View>
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.NIC) newErrors.NIC = 'NIC is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    if (!formData.emergencyContact) newErrors.emergencyContact = 'Emergency contact is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.salary) newErrors.salary = 'Salary is required';
    if (formData.permissions.length === 0) newErrors.permissions = 'Select at least one permission';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const staffData = {
        ...formData,
        salary: parseFloat(formData.salary),
        dateOfBirth: new Date(formData.dateOfBirth)
      };

      delete staffData.confirmPassword;

      await createStaff(staffData);
      Alert.alert('Success', 'Staff member created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Create staff error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create staff member';
      const errors = error.response?.data?.errors;
      
      if (errors && errors.length > 0) {
        Alert.alert('Validation Error', errors.join('\n'));
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const renderInput = (label, field, props = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        value={formData[field]}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
        {...props}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderDropdown = (label, field, options) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdown, errors[field] && styles.inputError]}
        onPress={() => {
          Alert.alert(
            `Select ${label}`,
            '',
            options.map(option => ({
              text: option,
              onPress: () => setFormData({ ...formData, [field]: option })
            }))
          );
        }}
      >
        <Text style={styles.dropdownText}>
          {formData[field] || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Create Staff Member</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {renderInput('Full Name', 'fullName', {
              placeholder: 'Enter full name',
              autoCapitalize: 'words'
            })}
            
            {renderInput('NIC', 'NIC', {
              placeholder: 'Enter NIC number'
            })}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={COLORS.brandOrange} />
                <Text style={styles.pickerText}>
                  {formData.dateOfBirth || 'Select date of birth'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              {renderPicker('date', selectedDate, setSelectedDate, showDatePicker, setShowDatePicker)}
            </View>
            
            {renderInput('Address', 'address', {
              placeholder: 'Enter address',
              multiline: true,
              numberOfLines: 2
            })}
            
            {renderInput('City', 'city', {
              placeholder: 'Enter city'
            })}
            
            {renderDropdown('Gender', 'gender', ['Male', 'Female', 'Other'])}
            
            {renderInput('Email', 'email', {
              placeholder: 'Enter email',
              keyboardType: 'email-address',
              autoCapitalize: 'none'
            })}
            
            {renderInput('Password', 'password', {
              placeholder: 'Enter password',
              secureTextEntry: true
            })}
            
            {renderInput('Confirm Password', 'confirmPassword', {
              placeholder: 'Confirm password',
              secureTextEntry: true
            })}
            
            {renderInput('Contact Number', 'contactNumber', {
              placeholder: 'Enter contact number',
              keyboardType: 'phone-pad'
            })}
            
            {renderInput('Emergency Contact', 'emergencyContact', {
              placeholder: 'Enter emergency contact',
              keyboardType: 'phone-pad'
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Information</Text>
            
            {renderDropdown('Department', 'department', departments)}
            
            {renderDropdown('Position', 'position', positions[formData.department] || [])}
            
            {renderDropdown('Employment Type', 'employmentType', ['Permanent', 'Contract', 'Intern'])}
            
            {renderInput('Salary', 'salary', {
              placeholder: 'Enter salary',
              keyboardType: 'numeric'
            })}
            
            {renderDropdown('Work Schedule', 'workSchedule', ['Morning', 'Evening', 'Night', 'Full Day'])}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            {errors.permissions && <Text style={styles.errorText}>{errors.permissions}</Text>}
            
            <View style={styles.permissionsGrid}>
              {availablePermissions.map(permission => (
                <TouchableOpacity
                  key={permission.id}
                  style={[
                    styles.permissionItem,
                    formData.permissions.includes(permission.id) && styles.permissionItemSelected
                  ]}
                  onPress={() => togglePermission(permission.id)}
                >
                  <Ionicons
                    name={formData.permissions.includes(permission.id) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={formData.permissions.includes(permission.id) ? COLORS.brandOrange : COLORS.gray}
                  />
                  <Text style={[
                    styles.permissionText,
                    formData.permissions.includes(permission.id) && styles.permissionTextSelected
                  ]}>
                    {permission.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Staff Member</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  topSafeArea: { backgroundColor: COLORS.gray },
  flex1:   { flex: 1 },
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 8, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 60 },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: -10,
    marginBottom: 14,
  },
  dropdown: {
    backgroundColor: COLORS.bgLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.black,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  permissionItemSelected: {
    // Style for selected permission
  },
  permissionText: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  permissionTextSelected: {
    color: COLORS.brandOrange,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.brandOrange,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  },
});

export default CreateStaffScreen;
