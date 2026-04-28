import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createOwner, updateOwner, getAllOwners } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function AddEditOwnerScreen({ route, navigation }) {
  const ownerId = route.params?.ownerId;
  const isEdit  = !!ownerId;
  const onOwnerAdded = route.params?.onOwnerAdded; // Callback for new owner
  const onOwnerUpdated = route.params?.onOwnerUpdated; // Callback for updated owner

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    NIC: '', name: '', address: '', email: '', contactNumber: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchOwner = async () => {
        try {
          const { data } = await getAllOwners();
          const owner = data.find(o => o._id === ownerId);
          if (owner) {
            setForm({
              NIC:           owner.NIC           || '',
              name:          owner.name          || '',
              address:       owner.address       || '',
              email:         owner.email         || '',
              contactNumber: owner.contactNumber || '',
            });
          }
        } catch {
          Alert.alert('Error', 'Could not load owner details');
        }
      };
      fetchOwner();
    }
  }, [ownerId]);

  const handleChange = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.NIC || !form.name || !form.address || !form.email || !form.contactNumber) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    try {
      setSubmitting(true);
      if (isEdit) {
        const response = await updateOwner(ownerId, form);
        const updatedOwner = response.data;
        Alert.alert('Success', 'Owner updated!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Call the callback with the updated owner data
              if (onOwnerUpdated && typeof onOwnerUpdated === 'function') {
                onOwnerUpdated(updatedOwner);
              }
              navigation.goBack();
            }
          },
        ]);
      } else {
        const response = await createOwner(form);
        const newOwner = response.data;
        Alert.alert('Success', 'Owner added!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Call the callback with the new owner data
              if (onOwnerAdded && typeof onOwnerAdded === 'function') {
                onOwnerAdded(newOwner);
              }
              navigation.goBack();
            }
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: 'NIC',           label: 'NIC *',            placeholder: '199012345678' },
    { key: 'name',          label: 'Full Name *',       placeholder: 'Kamal Perera' },
    { key: 'address',       label: 'Address *',         placeholder: 'No 5, Galle Road' },
    { key: 'email',         label: 'Email *',           placeholder: 'kamal@email.com', keyboard: 'email-address' },
    { key: 'contactNumber', label: 'Contact Number *',  placeholder: '077 123 4567', keyboard: 'phone-pad' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Owner' : 'Add Owner'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.blue} />
          <Text style={styles.infoText}>
            An owner is the person who owns the vehicle. You can link an owner when registering a vehicle.
          </Text>
        </View>

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

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>
                {isEdit ? 'Update Owner' : 'Add Owner'}
              </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  header:  {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.blueBg, borderRadius: 12, padding: 14, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.blue, lineHeight: 18 },
  label:   { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  input:   {
    backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.brandOrange, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});