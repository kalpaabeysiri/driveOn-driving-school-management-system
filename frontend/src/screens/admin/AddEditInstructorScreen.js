import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createInstructor, updateInstructor, getInstructorById } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function AddEditInstructorScreen({ route, navigation }) {
  const instructorId = route.params?.instructorId;
  const isEdit       = !!instructorId;

  const [loading,    setLoading]    = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [image,      setImage]      = useState(null);

  const [form, setForm] = useState({
    fullName: '', NIC: '', dateOfBirth: '', address: '', city: '',
    gender: 'Male', email: '', password: '', confirmPassword: '',
    contactNumber: '', emergencyContact: '', licenseNo: '',
    experience: '', specialization: 'Both',
  });

  useEffect(() => {
    if (isEdit) {
      const fetch = async () => {
        try {
          const { data } = await getInstructorById(instructorId);
          setForm({
            fullName:        data.fullName        || '',
            NIC:             data.NIC             || '',
            dateOfBirth:     data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            address:         data.address         || '',
            city:            data.city            || '',
            gender:          data.gender          || 'Male',
            email:           data.email           || '',
            password:        '',
            confirmPassword: '',
            contactNumber:   data.contactNumber   || '',
            emergencyContact:data.emergencyContact|| '',
            licenseNo:       data.licenseNo       || '',
            experience:      String(data.experience || ''),
            specialization:  data.specialization  || 'Both',
          });
        } catch {
          Alert.alert('Error', 'Could not load instructor');
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }
  }, [instructorId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.fullName || !form.NIC || !form.email || !form.contactNumber) {
      Alert.alert('Validation Error', 'Please fill all required fields'); return false;
    }

    // 1. Date of birth must be valid and person must be at least 18 years old
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (isNaN(dob.getTime())) {
        Alert.alert('Validation Error', 'Invalid date of birth'); return false;
      }
      if (dob >= new Date()) {
        Alert.alert('Validation Error', 'Invalid date of birth'); return false;
      }
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
      if (dob > minAgeDate) {
        Alert.alert('Validation Error', 'Instructor must be at least 18 years old'); return false;
      }
    }

    // 2. NIC: 12-digit number (e.g. 199532002972) OR 9 digits + V/v (e.g. 953202972V)
    const nicNew = /^\d{12}$/;
    const nicOld = /^\d{9}[Vv]$/;
    if (!nicNew.test(form.NIC) && !nicOld.test(form.NIC)) {
      Alert.alert('Validation Error', 'NIC must be either 12 digits (e.g. 199532002972) or 9 digits followed by V (e.g. 953202972V)'); return false;
    }

    // 3. Valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address'); return false;
    }

    // 4. Contact number: exactly 10 digits, must start with 0
    const contactRegex = /^0\d{9}$/;
    if (!contactRegex.test(form.contactNumber)) {
      Alert.alert('Validation Error', 'Contact number must be 10 digits and start with 0 (e.g. 0771234567)'); return false;
    }

    if (!isEdit && !form.password) {
      Alert.alert('Validation Error', 'Password is required'); return false;
    }
    if (form.password && form.password !== form.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match'); return false;
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
        formData.append('image', { uri: image.uri, type: 'image/jpeg', name: `instructor_${Date.now()}.jpg` });
      }
      if (isEdit) {
        await updateInstructor(instructorId, formData);
        Alert.alert('Success', 'Instructor updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await createInstructor(formData);
        Alert.alert('Success', 'Instructor registered!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const fields = [
    { key: 'fullName',        label: 'Full Name *',              placeholder: 'John Silva' },
    { key: 'NIC',             label: 'NIC *',                    placeholder: '200012345678', keyboard: 'default', autoCapitalize: 'none' },
    { key: 'dateOfBirth',     label: 'Date of Birth (YYYY-MM-DD)',placeholder: '1990-01-15' },
    { key: 'address',         label: 'Address',                  placeholder: 'No 10, Main Street' },
    { key: 'city',            label: 'City',                     placeholder: 'Colombo' },
    { key: 'email',           label: 'Email *',                  placeholder: 'john@email.com', keyboard: 'email-address' },
    { key: 'contactNumber',   label: 'Contact Number *',         placeholder: '077 123 4567', keyboard: 'phone-pad' },
    { key: 'emergencyContact',label: 'Emergency Contact',        placeholder: '077 999 8888', keyboard: 'phone-pad' },
    { key: 'licenseNo',       label: 'License Number',           placeholder: 'LIC001234' },
    { key: 'experience',      label: 'Experience (years)',       placeholder: '5', keyboard: 'numeric' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Instructor' : 'Register Instructor'}</Text>
        <View style={{ width: 24 }} />
      </View>
      

    <KeyboardAvoidingView
  style={styles.flex1}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image
            ? <Image source={{ uri: image.uri }} style={styles.image} />
            : <><Ionicons name="camera-outline" size={32} color={COLORS.textMuted} /><Text style={styles.imageText}>Upload Photo</Text></>
          }
        </TouchableOpacity>

        {fields.map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChangeText={(v) => handleChange(f.key, v)}
              keyboardType={f.keyboard || 'default'}
              autoCapitalize={f.autoCapitalize !== undefined ? f.autoCapitalize : (f.keyboard === 'email-address' ? 'none' : 'words')}
            />
          </View>
        ))}

        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.optRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity key={g} style={[styles.optBtn, form.gender === g && styles.optBtnActive]} onPress={() => handleChange('gender', g)}>
              <Text style={[styles.optText, form.gender === g && styles.optTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Specialization */}
        <Text style={styles.label}>Specialization</Text>
        <View style={styles.optRow}>
          {['Theory', 'Practical', 'Both'].map((s) => (
            <TouchableOpacity key={s} style={[styles.optBtn, form.specialization === s && styles.optBtnActive]} onPress={() => handleChange('specialization', s)}>
              <Text style={[styles.optText, form.specialization === s && styles.optTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Password */}
<Text style={styles.label}>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</Text>
<TextInput
  style={styles.input}
  placeholder="Enter password"
  value={form.password}
  onChangeText={(v) => handleChange('password', v)}
  secureTextEntry
  autoComplete="off"
  textContentType="none"
  autoCorrect={false}
  autoCapitalize="none"
/>
<Text style={styles.label}>Confirm Password</Text>
<TextInput
  style={styles.input}
  placeholder="Re-enter password"
  value={form.confirmPassword}
  onChangeText={(v) => handleChange('confirmPassword', v)}
  secureTextEntry
  autoComplete="off"
  textContentType="none"
  autoCorrect={false}
  autoCapitalize="none"
/>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>{isEdit ? 'Update Instructor' : 'Register Instructor'}</Text>}
        </TouchableOpacity>
      </ScrollView>
</KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1:   { flex: 1 },
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 60 },
  imageBox:{ alignSelf: 'center', width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.bgLight, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  image:   { width: 100, height: 100, borderRadius: 50 },
  imageText:{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  label:   { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  input:   { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14 },
  optRow:  { flexDirection: 'row', gap: 10, marginBottom: 14 },
  optBtn:  { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  optBtnActive: { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  optText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  optTextActive: { color: COLORS.black },
  submitBtn: { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
