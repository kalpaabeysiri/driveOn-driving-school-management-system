import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
   KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createStudent, updateStudent, getStudentById } from '../../services/studentApi';
import { COLORS } from '../../theme';

export default function AddEditStudentScreen({ route, navigation }) {
  const studentId = route.params?.studentId;
  const isEdit    = !!studentId;

  const [loading,    setLoading]    = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [image,      setImage]      = useState(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', NIC: '', contactNo: '',
    email: '', address: '', city: '', emergencyContactNo: '',
    dateOfBirth: '', gender: 'Male', password: '', confirmPassword: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchStudent = async () => {
        try {
          const { data } = await getStudentById(studentId);
          setForm({
            firstName:          data.firstName,
            lastName:           data.lastName,
            NIC:                data.NIC,
            contactNo:          data.contactNo,
            email:              data.email,
            address:            data.address || '',
            city:               data.city || '',
            emergencyContactNo: data.emergencyContactNo || '',
            dateOfBirth:        data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            gender:             data.gender || 'Male',
            password:           '',
            confirmPassword:    '',
          });
        } catch {
          Alert.alert('Error', 'Could not load student');
        } finally {
          setLoading(false);
        }
      };
      fetchStudent();
    }
  }, [studentId]);

const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return Alert.alert('Permission needed');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaType.Images,   // ← changed from MediaTypeOptions
    quality: 0.8,
  });
  if (!result.canceled) setImage(result.assets[0]);
};

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.NIC || !form.contactNo || !form.email) {
      Alert.alert('Error', 'Please fill all required fields'); return false;
    }
    if (!isEdit && !form.password) {
      Alert.alert('Error', 'Password is required'); return false;
    }
    if (form.password && form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match'); return false;
    }
    if (form.password && form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
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
          uri: image.uri, type: 'image/jpeg',
          name: `student_${Date.now()}.jpg`,
        });
      }

      if (isEdit) {
        await updateStudent(studentId, formData);
        Alert.alert('Success', 'Student updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await createStudent(formData);
        Alert.alert('Success', 'Student registered!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const fields = [
    { key: 'firstName',          label: 'First Name *',           placeholder: 'John' },
    { key: 'lastName',           label: 'Last Name *',            placeholder: 'Silva' },
    { key: 'NIC',                label: 'NIC *',                  placeholder: '200012345678' },
    { key: 'contactNo',          label: 'Contact No *',           placeholder: '077 123 4567', keyboard: 'phone-pad' },
    { key: 'email',              label: 'Email *',                placeholder: 'john@email.com', keyboard: 'email-address' },
    { key: 'address',            label: 'Address',                placeholder: 'No 10, Main Street' },
    { key: 'city',               label: 'City',                   placeholder: 'Colombo' },
    { key: 'emergencyContactNo', label: 'Emergency Contact No',   placeholder: '077 999 8888', keyboard: 'phone-pad' },
    { key: 'dateOfBirth',        label: 'Date of Birth (YYYY-MM-DD)', placeholder: '2000-01-15' },
  ];

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

        {/* Profile Image */}
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

        {/* Fields */}
        {fields.map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChangeText={(v) => handleChange(f.key, v)}
              keyboardType={f.keyboard || 'default'}
              autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
            />
          </View>
        ))}

        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
              onPress={() => handleChange('gender', g)}
            >
              <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Password */}
        <Text style={styles.label}>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          value={form.password}
          onChangeText={(v) => handleChange('password', v)}
          secureTextEntry
        />
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChangeText={(v) => handleChange('confirmPassword', v)}
          secureTextEntry
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>{isEdit ? 'Update Student' : 'Register Student'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
</KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:     { padding: 20, paddingBottom: 60 },
  imageBox: {
    alignSelf: 'center', width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.bgLight, borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
  },
  image:     { width: 100, height: 100, borderRadius: 50 },
  imageText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  label:     { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14,
  },
  genderRow:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  genderBtn:       { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  genderBtnActive: { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  genderText:      { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  genderTextActive:{ color: COLORS.black },
  submitBtn:      { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText:  { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
