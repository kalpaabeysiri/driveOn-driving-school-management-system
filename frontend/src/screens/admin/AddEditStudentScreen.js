import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createStudent, updateStudent, getStudentById } from '../../services/studentApi';
import { COLORS } from '../../theme';

const validateNIC = (nic) => {
  const old = /^[0-9]{9}[VvXx]$/;
  const neww = /^[0-9]{12}$/;
  return old.test(nic) || neww.test(nic);
};

const validatePhone = (phone) => /^0[0-9]{9}$/.test(phone);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateDOB = (dob) => {
  if (!dob) return true;
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dob);
  const parsed = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return isValidFormat && !isNaN(parsed.getTime()) && parsed <= today;
};

export default function AddEditStudentScreen({ route, navigation }) {
  const studentId = route.params?.studentId;
  const isEdit = !!studentId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    NIC: '',
    contactNo: '',
    email: '',
    address: '',
    city: '',
    emergencyContactNo: '',
    dateOfBirth: '',
    gender: 'Male',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const { data } = await getStudentById(studentId);
          setForm({
            firstName: data.firstName,
            lastName: data.lastName,
            NIC: data.NIC,
            contactNo: data.contactNo,
            email: data.email,
            address: data.address || '',
            city: data.city || '',
            emergencyContactNo: data.emergencyContactNo || '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            gender: data.gender || 'Male',
            password: '',
            confirmPassword: '',
          });
        } catch {
          Alert.alert('Error', 'Could not load student');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [studentId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
    });

    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePhoneChange = (field, value) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    const capped = digitsOnly.slice(0, 10);
    handleChange(field, capped);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Select date of birth';
    return dateString;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') return;

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      handleChange('dateOfBirth', `${year}-${month}-${day}`);
    }
  };

  const validateField = (field, value) => {
    let msg = '';

    switch (field) {
      case 'firstName':
        if (!value.trim()) msg = 'First name is required.';
        break;
      case 'lastName':
        if (!value.trim()) msg = 'Last name is required.';
        break;
      case 'NIC':
        if (!value.trim()) {
          msg = 'NIC is required.';
        } else if (!validateNIC(value.trim())) {
          msg = 'Invalid NIC. Use 9 digits + V/X (old) or 12 digits (new).';
        }
        break;
      case 'contactNo':
        if (!value.trim()) {
          msg = 'Contact number is required.';
        } else if (!validatePhone(value.trim())) {
          msg = 'Must be a valid 10-digit Sri Lankan number starting with 0.';
        }
        break;
      case 'emergencyContactNo':
        if (value.trim() && !validatePhone(value.trim())) {
          msg = 'Must be a valid 10-digit Sri Lankan number starting with 0.';
        }
        break;
      case 'email':
        if (!value.trim()) {
          msg = 'Email is required.';
        } else if (!validateEmail(value.trim())) {
          msg = 'Enter a valid email address.';
        }
        break;
      case 'dateOfBirth':
        if (value && !validateDOB(value)) {
          msg = 'Select a valid date of birth. Future dates are not allowed.';
        }
        break;
      case 'password':
        if (!isEdit && !value) {
          msg = 'Password is required.';
        } else if (value && value.length < 6) {
          msg = 'Password must be at least 6 characters.';
        }
        break;
      case 'confirmPassword':
        if (form.password && value !== form.password) {
          msg = 'Passwords do not match.';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: msg }));
    return msg === '';
  };

  const validateAll = () => {
    const fieldsToCheck = [
      'firstName',
      'lastName',
      'NIC',
      'contactNo',
      'email',
      'emergencyContactNo',
      'dateOfBirth',
      'password',
      'confirmPassword',
    ];

    let valid = true;
    const newErrors = {};

    fieldsToCheck.forEach(field => {
      let msg = '';

      switch (field) {
        case 'firstName':
          if (!form.firstName.trim()) msg = 'First name is required.';
          break;
        case 'lastName':
          if (!form.lastName.trim()) msg = 'Last name is required.';
          break;
        case 'NIC':
          if (!form.NIC.trim()) {
            msg = 'NIC is required.';
          } else if (!validateNIC(form.NIC.trim())) {
            msg = 'Invalid NIC. Use 9 digits + V/X (old) or 12 digits (new).';
          }
          break;
        case 'contactNo':
          if (!form.contactNo.trim()) {
            msg = 'Contact number is required.';
          } else if (!validatePhone(form.contactNo.trim())) {
            msg = 'Must be a valid 10-digit Sri Lankan number starting with 0.';
          }
          break;
        case 'emergencyContactNo':
          if (form.emergencyContactNo.trim() && !validatePhone(form.emergencyContactNo.trim())) {
            msg = 'Must be a valid 10-digit Sri Lankan number starting with 0.';
          }
          break;
        case 'email':
          if (!form.email.trim()) {
            msg = 'Email is required.';
          } else if (!validateEmail(form.email.trim())) {
            msg = 'Enter a valid email address.';
          }
          break;
        case 'dateOfBirth':
          if (form.dateOfBirth && !validateDOB(form.dateOfBirth)) {
            msg = 'Select a valid date of birth. Future dates are not allowed.';
          }
          break;
        case 'password':
          if (!isEdit && !form.password) {
            msg = 'Password is required.';
          } else if (form.password && form.password.length < 6) {
            msg = 'Password must be at least 6 characters.';
          }
          break;
        case 'confirmPassword':
          if (form.password && form.confirmPassword !== form.password) {
            msg = 'Passwords do not match.';
          }
          break;
        default:
          break;
      }

      if (msg) {
        newErrors[field] = msg;
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      Object.keys(form).forEach(key => {
        if (key !== 'confirmPassword' && form[key]) {
          formData.append(key, form[key]);
        }
      });

      if (image) {
        formData.append('profileImage', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `student_${Date.now()}.jpg`,
        });
      }

      if (isEdit) {
        await updateStudent(studentId, formData);
        Alert.alert('Success', 'Student updated!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createStudent(formData);
        Alert.alert('Success', 'Student registered!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Student' : 'Register Student'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.image} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.imageText}>Upload Profile Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <FieldWrapper label="First Name *" error={errors.firstName}>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="John"
              value={form.firstName}
              onChangeText={v => handleChange('firstName', v)}
              onBlur={() => validateField('firstName', form.firstName)}
              autoCapitalize="words"
            />
          </FieldWrapper>

          <FieldWrapper label="Last Name *" error={errors.lastName}>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Silva"
              value={form.lastName}
              onChangeText={v => handleChange('lastName', v)}
              onBlur={() => validateField('lastName', form.lastName)}
              autoCapitalize="words"
            />
          </FieldWrapper>

          <FieldWrapper
            label="NIC *"
            error={errors.NIC}
            hint="Old: 9 digits + V or X  |  New: 12 digits"
          >
            <TextInput
              style={[styles.input, errors.NIC && styles.inputError]}
              placeholder="871234567V  or  200012345678"
              value={form.NIC}
              onChangeText={v => handleChange('NIC', v)}
              onBlur={() => validateField('NIC', form.NIC)}
              autoCapitalize="characters"
              maxLength={12}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Contact No *"
            error={errors.contactNo}
            hint="10-digit Sri Lankan number (e.g. 0771234567)"
          >
            <TextInput
              style={[styles.input, errors.contactNo && styles.inputError]}
              placeholder="0771234567"
              value={form.contactNo}
              onChangeText={v => handlePhoneChange('contactNo', v)}
              onBlur={() => validateField('contactNo', form.contactNo)}
              keyboardType="number-pad"
              maxLength={10}
            />
          </FieldWrapper>

          <FieldWrapper label="Email *" error={errors.email}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="silva@email.com"
              value={form.email}
              onChangeText={v => handleChange('email', v)}
              onBlur={() => validateField('email', form.email)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FieldWrapper>

          <FieldWrapper label="Address" error={errors.address}>
            <TextInput
              style={styles.input}
              placeholder="No 10, Main Street"
              value={form.address}
              onChangeText={v => handleChange('address', v)}
              autoCapitalize="words"
            />
          </FieldWrapper>

          <FieldWrapper label="City" error={errors.city}>
            <TextInput
              style={styles.input}
              placeholder="Colombo"
              value={form.city}
              onChangeText={v => handleChange('city', v)}
              autoCapitalize="words"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Emergency Contact No"
            error={errors.emergencyContactNo}
            hint="10-digit Sri Lankan number"
          >
            <TextInput
              style={[styles.input, errors.emergencyContactNo && styles.inputError]}
              placeholder="0779998888"
              value={form.emergencyContactNo}
              onChangeText={v => handlePhoneChange('emergencyContactNo', v)}
              onBlur={() => validateField('emergencyContactNo', form.emergencyContactNo)}
              keyboardType="number-pad"
              maxLength={10}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Date of Birth"
            error={errors.dateOfBirth}
            hint="Choose from calendar"
          >
            <TouchableOpacity
              style={[styles.input, errors.dateOfBirth && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: form.dateOfBirth ? COLORS.textDark : COLORS.textMuted,
                }}
              >
                {formatDate(form.dateOfBirth)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </FieldWrapper>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female'].map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                onPress={() => handleChange('gender', g)}
              >
                <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldWrapper
            label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
            error={errors.password}
          >
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Min 6 characters"
              value={form.password}
              onChangeText={v => handleChange('password', v)}
              onBlur={() => validateField('password', form.password)}
              secureTextEntry
            />
          </FieldWrapper>

          <FieldWrapper label="Confirm Password" error={errors.confirmPassword}>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChangeText={v => handleChange('confirmPassword', v)}
              onBlur={() => validateField('confirmPassword', form.confirmPassword)}
              secureTextEntry
            />
          </FieldWrapper>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEdit ? 'Update Student' : 'Register Student'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldWrapper({ label, error, hint, children }) {
  return (
    <View style={{ marginBottom: 2 }}>
      <Text style={styles.label}>{label}</Text>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.white },
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

  imageBox: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.bgLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: { width: 100, height: 100, borderRadius: 50 },
  imageText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  hint: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },

  input: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 4,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redBg,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.red,
    marginBottom: 10,
    marginLeft: 2,
  },

  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  genderBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genderBtnActive: {
    backgroundColor: COLORS.brandYellow,
    borderColor: COLORS.brandYellow,
  },
  genderText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  genderTextActive: { color: COLORS.black },

  submitBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});