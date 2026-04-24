import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { createStaff } from '../../../services/api';
import { COLORS } from '../../../theme';

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
    position: '',
    employmentType: 'Permanent',
    salary: '',
    permissions: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const positions = ['Manager', 'Clerk'];

  const availablePermissions = [
    { id: 'manage_students', label: 'Manage Students' },
    { id: 'manage_instructors', label: 'Manage Instructors' },
    { id: 'manage_vehicles', label: 'Manage Vehicles' },
    { id: 'manage_sessions', label: 'Manage Sessions' },
    { id: 'manage_payments', label: 'Manage Payments' },
    { id: 'manage_exams', label: 'Manage Exams' },
    { id: 'view_reports', label: 'View Reports' },
    { id: 'manage_staff', label: 'Manage Staff' },
    { id: 'send_notifications', label: 'Send Notifications' },
  ];

  const formatDate = date => {
    const d = new Date(date);
    const year = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${mon}-${day}`;
  };

  const isFutureDate = date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    return selected > today;
  };

  const isValidNIC = nic => {
    const oldNIC = /^[0-9]{9}[vVxX]$/;
    const newNIC = /^[0-9]{12}$/;

    return oldNIC.test(nic) || newNIC.test(nic);
  };

  const isValidEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidSriLankanPhone = number => {
    // Accepts Sri Lankan local format like 0712345678
    return /^0[1-9][0-9]{8}$/.test(number);
  };

  const handleNumericInput = (field, text, maxLength = 10) => {
    const numericValue = text.replace(/[^0-9]/g, '').slice(0, maxLength);
    setFormData(prev => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  const renderPicker = (mode, value, setValue, show, setShow) => {
    if (!show) return null;

    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === 'date' ? 'calendar' : 'spinner'}
          maximumDate={new Date()}
          onChange={(event, selected) => {
            setShow(false);

            if (selected) {
              if (isFutureDate(selected)) {
                setErrors(prev => ({
                  ...prev,
                  dateOfBirth: 'Date of birth cannot be a future date',
                }));
                return;
              }

              setValue(selected);
              setFormData(prev => ({
                ...prev,
                dateOfBirth: formatDate(selected),
              }));

              setErrors(prev => ({
                ...prev,
                dateOfBirth: '',
              }));
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
          maximumDate={new Date()}
          onChange={(event, selected) => {
            if (selected) {
              if (isFutureDate(selected)) {
                setErrors(prev => ({
                  ...prev,
                  dateOfBirth: 'Date of birth cannot be a future date',
                }));
                return;
              }

              setValue(selected);
              setFormData(prev => ({
                ...prev,
                dateOfBirth: formatDate(selected),
              }));

              setErrors(prev => ({
                ...prev,
                dateOfBirth: '',
              }));
            }
          }}
          style={styles.iosPicker}
        />
      </View>
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.NIC.trim()) {
      newErrors.NIC = 'NIC is required';
    } else if (!isValidNIC(formData.NIC.trim())) {
      newErrors.NIC = 'Enter a valid NIC. Example: 991234567V or 199912345678';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (isFutureDate(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Date of birth cannot be a future date';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!isValidSriLankanPhone(formData.contactNumber)) {
      newErrors.contactNumber = 'Enter a valid Sri Lankan phone number. Example: 0712345678';
    }

    if (!formData.emergencyContact) {
      newErrors.emergencyContact = 'Emergency contact is required';
    } else if (!isValidSriLankanPhone(formData.emergencyContact)) {
      newErrors.emergencyContact = 'Enter a valid Sri Lankan phone number. Example: 0712345678';
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    if (!formData.employmentType) {
      newErrors.employmentType = 'Employment type is required';
    }

    if (!formData.salary) {
      newErrors.salary = 'Salary is required';
    } else if (Number(formData.salary) <= 0) {
      newErrors.salary = 'Salary must be greater than 0';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'Select at least one permission';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const staffData = {
        ...formData,
        NIC: formData.NIC.trim(),
        email: formData.email.trim().toLowerCase(),
        salary: parseFloat(formData.salary),
        dateOfBirth: new Date(formData.dateOfBirth),
      };

      delete staffData.confirmPassword;

      await createStaff(staffData);

      Alert.alert('Success', 'Staff member created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Create staff error:', error);

      const errorMsg = error.response?.data?.message || 'Failed to create staff member';
      const backendErrors = error.response?.data?.errors;

      if (backendErrors && backendErrors.length > 0) {
        Alert.alert('Validation Error', backendErrors.join('\n'));
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = permissionId => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const renderInput = (label, field, props = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        value={formData[field]}
        onChangeText={text => {
          setFormData(prev => ({
            ...prev,
            [field]: text,
          }));

          if (errors[field]) {
            setErrors(prev => ({
              ...prev,
              [field]: '',
            }));
          }
        }}
        {...props}
      />

      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
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
              onPress: () => {
                setFormData(prev => ({
                  ...prev,
                  [field]: option,
                }));

                setErrors(prev => ({
                  ...prev,
                  [field]: '',
                }));
              },
            })),
          );
        }}
      >
        <Text style={styles.dropdownText}>
          {formData[field] || `Select ${label}`}
        </Text>

        <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  const renderGenderButtons = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Gender</Text>

      <View style={styles.genderRow}>
        {['Male', 'Female'].map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.genderButton,
              formData.gender === item && styles.genderButtonSelected,
              errors.gender && styles.inputError,
            ]}
            onPress={() => {
              setFormData(prev => ({
                ...prev,
                gender: item,
              }));

              setErrors(prev => ({
                ...prev,
                gender: '',
              }));
            }}
          >
            <Ionicons
              name={formData.gender === item ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={formData.gender === item ? COLORS.brandOrange : COLORS.gray}
            />

            <Text
              style={[
                styles.genderButtonText,
                formData.gender === item && styles.genderButtonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {renderInput('Full Name', 'fullName', {
              placeholder: 'Enter full name',
              autoCapitalize: 'words',
            })}

            {renderInput('NIC', 'NIC', {
              placeholder: 'Example: 991234567V or 199912345678',
              autoCapitalize: 'characters',
              maxLength: 12,
            })}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>

              <TouchableOpacity
                style={[styles.pickerBtn, errors.dateOfBirth && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={COLORS.brandOrange} />

                <Text style={styles.pickerText}>
                  {formData.dateOfBirth || 'Select date of birth'}
                </Text>

                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              {errors.dateOfBirth ? (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              ) : null}

              {renderPicker('date', selectedDate, setSelectedDate, showDatePicker, setShowDatePicker)}
            </View>

            {renderInput('Address', 'address', {
              placeholder: 'Enter address',
              multiline: true,
              numberOfLines: 2,
            })}

            {renderInput('City', 'city', {
              placeholder: 'Enter city',
            })}

            {renderGenderButtons()}

            {renderInput('Email', 'email', {
              placeholder: 'Enter email',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderInput('Password', 'password', {
              placeholder: 'Enter password',
              secureTextEntry: true,
            })}

            {renderInput('Confirm Password', 'confirmPassword', {
              placeholder: 'Confirm password',
              secureTextEntry: true,
            })}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>

              <TextInput
                style={[styles.input, errors.contactNumber && styles.inputError]}
                value={formData.contactNumber}
                placeholder="Example: 0712345678"
                keyboardType="numeric"
                maxLength={10}
                onChangeText={text => {
                  handleNumericInput('contactNumber', text, 10);

                  if (errors.contactNumber) {
                    setErrors(prev => ({
                      ...prev,
                      contactNumber: '',
                    }));
                  }
                }}
              />

              {errors.contactNumber ? (
                <Text style={styles.errorText}>{errors.contactNumber}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Contact</Text>

              <TextInput
                style={[styles.input, errors.emergencyContact && styles.inputError]}
                value={formData.emergencyContact}
                placeholder="Example: 0712345678"
                keyboardType="numeric"
                maxLength={10}
                onChangeText={text => {
                  handleNumericInput('emergencyContact', text, 10);

                  if (errors.emergencyContact) {
                    setErrors(prev => ({
                      ...prev,
                      emergencyContact: '',
                    }));
                  }
                }}
              />

              {errors.emergencyContact ? (
                <Text style={styles.errorText}>{errors.emergencyContact}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Information</Text>

            {renderDropdown('Position', 'position', positions)}

            {renderDropdown('Employment Type', 'employmentType', [
              'Permanent',
              'Contract',
              'Intern',
            ])}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary</Text>

              <TextInput
                style={[styles.input, errors.salary && styles.inputError]}
                value={formData.salary}
                placeholder="Enter salary"
                keyboardType="numeric"
                onChangeText={text => {
                  const numericValue = text.replace(/[^0-9.]/g, '');

                  setFormData(prev => ({
                    ...prev,
                    salary: numericValue,
                  }));

                  if (errors.salary) {
                    setErrors(prev => ({
                      ...prev,
                      salary: '',
                    }));
                  }
                }}
              />

              {errors.salary ? <Text style={styles.errorText}>{errors.salary}</Text> : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>

            {errors.permissions ? (
              <Text style={styles.errorText}>{errors.permissions}</Text>
            ) : null}

            <View style={styles.permissionsGrid}>
              {availablePermissions.map(permission => (
                <TouchableOpacity
                  key={permission.id}
                  style={[
                    styles.permissionItem,
                    formData.permissions.includes(permission.id) &&
                      styles.permissionItemSelected,
                  ]}
                  onPress={() => {
                    togglePermission(permission.id);

                    setErrors(prev => ({
                      ...prev,
                      permissions: '',
                    }));
                  }}
                >
                  <Ionicons
                    name={
                      formData.permissions.includes(permission.id)
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      formData.permissions.includes(permission.id)
                        ? COLORS.brandOrange
                        : COLORS.gray
                    }
                  />

                  <Text
                    style={[
                      styles.permissionText,
                      formData.permissions.includes(permission.id) &&
                        styles.permissionTextSelected,
                    ]}
                  >
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
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  topSafeArea: {
    backgroundColor: COLORS.gray,
  },

  flex1: {
    flex: 1,
  },

  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 8,
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
    marginBottom: 8,
  },

  inputError: {
    borderColor: COLORS.red,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 2,
    marginBottom: 8,
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
    marginBottom: 8,
  },

  dropdownText: {
    fontSize: 14,
    color: COLORS.black,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },

  genderButton: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  genderButtonSelected: {
    borderColor: COLORS.brandOrange,
    backgroundColor: COLORS.bgLight,
  },

  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },

  genderButtonTextSelected: {
    color: COLORS.brandOrange,
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

  permissionItemSelected: {},

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