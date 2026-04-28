import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createVehicle, updateVehicle, getVehicleById, getAllOwners, deleteOwner } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function AddEditVehicleScreen({ route, navigation }) {
  const vehicleId = route.params?.vehicleId;
  const isEdit    = !!vehicleId;

  const [loading,    setLoading]    = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [image,      setImage]      = useState(null);
  const [owners,     setOwners]     = useState([]);

  const [form, setForm] = useState({
    licensePlate: '', brand: '', model: '', year: '',
    vehicleType: 'Car', transmission: 'Manual', fuelType: 'Petrol',
    owner: '',
  });
  const [newlyAddedOwnerId, setNewlyAddedOwnerId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ownersData] = await Promise.all([getAllOwners()]);
        setOwners(ownersData.data);
        if (isEdit) {
          const { data } = await getVehicleById(vehicleId);
          setForm({
            licensePlate: data.licensePlate || '',
            brand:        data.brand        || '',
            model:        data.model        || '',
            year:         String(data.year  || ''),
            vehicleType:  data.vehicleType  || 'Car',
            transmission: data.transmission || 'Manual',
            fuelType:     data.fuelType     || 'Petrol',
            owner:        data.owner?._id   || '',
          });
        }
      } catch {
        Alert.alert('Error', 'Could not load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vehicleId]);

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

  const handleOwnerAdded = (newOwner) => {
    // Add the new owner to the owners list
    setOwners(prev => [...prev, newOwner]);
    // Automatically select the newly added owner
    setForm(prev => ({ ...prev, owner: newOwner._id }));
    // Track the newly added owner for visual indication
    setNewlyAddedOwnerId(newOwner._id);
    // Clear the indicator after 3 seconds
    setTimeout(() => setNewlyAddedOwnerId(null), 3000);
    // Show success message
    Alert.alert('Success', `${newOwner.name} has been added and selected as the vehicle owner!`, [
      { text: 'OK', style: 'default' }
    ]);
  };

  const navigateToAddOwner = () => {
    navigation.navigate('AddEditOwner', { onOwnerAdded: handleOwnerAdded });
  };

  const handleEditOwner = (owner) => {
    navigation.navigate('AddEditOwner', { 
      ownerId: owner._id, 
      onOwnerUpdated: (updatedOwner) => {
        // Update the owner in the local list
        setOwners(prev => prev.map(o => o._id === updatedOwner._id ? updatedOwner : o));
        // Show success message
        Alert.alert('Success', `${updatedOwner.name} has been updated!`);
      }
    });
  };

  const handleDeleteOwner = (owner) => {
    Alert.alert(
      'Delete Owner',
      `Delete ${owner.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOwner(owner._id);
              // Remove from local owners list
              setOwners(prev => prev.filter(o => o._id !== owner._id));
              // Clear selection if deleted owner was selected
              if (form.owner === owner._id) {
                setForm(prev => ({ ...prev, owner: '' }));
              }
              Alert.alert('Success', 'Owner deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Could not delete owner');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!form.licensePlate || !form.brand || !form.model || !form.year) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== undefined && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });
      if (image) {
        formData.append('image', {
          uri:  image.uri,
          type: 'image/jpeg',
          name: `vehicle_${Date.now()}.jpg`,
        });
      }
      if (isEdit) {
        await updateVehicle(vehicleId, formData);
        Alert.alert('Success', 'Vehicle updated!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createVehicle(formData);
        Alert.alert('Success', 'Vehicle registered!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.brandOrange} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Vehicle' : 'Register Vehicle'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Image */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image
            ? <Image source={{ uri: image.uri }} style={styles.image} />
            : (
              <>
                <Ionicons name="car-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.imageText}>Upload Vehicle Photo</Text>
              </>
            )
          }
        </TouchableOpacity>

        {/* Basic fields */}
        {[
          { key: 'licensePlate', label: 'License Plate *', placeholder: 'CAA-1234',  caps: 'characters' },
          { key: 'brand',        label: 'Brand *',         placeholder: 'Toyota',     caps: 'words'      },
          { key: 'model',        label: 'Model *',         placeholder: 'Axio',       caps: 'words'      },
          { key: 'year',         label: 'Year *',          placeholder: '2020',       keyboard: 'numeric'},
        ].map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChangeText={(v) => handleChange(f.key, v)}
              keyboardType={f.keyboard || 'default'}
              autoCapitalize={f.caps || 'words'}
              autoComplete="off"
              textContentType="none"
            />
          </View>
        ))}

        {/* Vehicle Type */}
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.optRow}>
          {['Car', 'Van', 'Motorcycle', 'Bus', 'Truck'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.optBtn, form.vehicleType === t && styles.optBtnActive]}
              onPress={() => handleChange('vehicleType', t)}
            >
              <Text style={[styles.optText, form.vehicleType === t && styles.optTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transmission */}
        <Text style={styles.label}>Transmission</Text>
        <View style={styles.optRow}>
          {['Manual', 'Automatic'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.optBtn, form.transmission === t && styles.optBtnActive]}
              onPress={() => handleChange('transmission', t)}
            >
              <Text style={[styles.optText, form.transmission === t && styles.optTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fuel Type */}
        <Text style={styles.label}>Fuel Type</Text>
        <View style={styles.optRow}>
          {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.optBtn, form.fuelType === f && styles.optBtnActive]}
              onPress={() => handleChange('fuelType', f)}
            >
              <Text style={[styles.optText, form.fuelType === f && styles.optTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Owner */}
        <Text style={styles.label}>Owner (optional)</Text>
        {owners.length === 0 ? (
          <View style={styles.noOwnerRow}>
            <Text style={styles.noOwnerText}>No owners registered yet.</Text>
            <TouchableOpacity onPress={navigateToAddOwner}>
              <Text style={styles.addOwnerLink}>+ Add Owner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {owners.map((o) => {
              const isNewlyAdded = o._id === newlyAddedOwnerId;
              return (
                <View
                  key={o._id}
                  style={[
                    styles.ownerCard, 
                    form.owner === o._id && styles.ownerCardActive,
                    isNewlyAdded && styles.newOwnerCard
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.ownerInfo}
                    onPress={() => handleChange('owner', form.owner === o._id ? '' : o._id)}
                  >
                    <View style={styles.flex1}>
                      <Text style={styles.ownerName}>{o.name}</Text>
                      <Text style={styles.ownerMeta}>{o.contactNumber} · {o.email}</Text>
                      {isNewlyAdded && (
                        <Text style={styles.newOwnerBadge}>✓ Just Added</Text>
                      )}
                    </View>
                    {form.owner === o._id && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.ownerActions}>
                    <TouchableOpacity 
                      style={styles.ownerActionBtn}
                      onPress={() => handleEditOwner(o)}
                    >
                      <Ionicons name="create-outline" size={16} color={COLORS.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.ownerActionBtn}
                      onPress={() => handleDeleteOwner(o)}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.addMoreOwnerBtn}
              onPress={navigateToAddOwner}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.brandOrange} />
              <Text style={styles.addOwnerLink}>Add New Owner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manageOwnersBtn}
              onPress={() => navigation.navigate('OwnersList')}
            >
              <Ionicons name="people-outline" size={18} color={COLORS.blue} />
              <Text style={styles.manageOwnersText}>Manage All Owners</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>
                {isEdit ? 'Update Vehicle' : 'Register Vehicle'}
              </Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  imageBox: {
    alignSelf: 'center', width: 120, height: 80, borderRadius: 12,
    backgroundColor: COLORS.bgLight, borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
  },
  image:        { width: 120, height: 80, borderRadius: 12 },
  imageText:    { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  label:        { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginBottom: 14,
  },
  optRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  optBtn:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  optBtnActive: { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  optText:      { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  optTextActive:{ color: COLORS.black, fontWeight: '700' },
  noOwnerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  noOwnerText:  { fontSize: 13, color: COLORS.textMuted },
  addOwnerLink: { fontSize: 13, fontWeight: '700', color: COLORS.brandOrange },
  addMoreOwnerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, marginTop: 4 },
  manageOwnersBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  manageOwnersText: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  ownerCard:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  ownerCardActive: { borderColor: COLORS.brandOrange, backgroundColor: '#FFF8ED' },
  newOwnerCard: { borderColor: COLORS.green, backgroundColor: '#F0FFF4' },
  ownerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  ownerActions: { flexDirection: 'row', gap: 4 },
  ownerActionBtn: { 
    padding: 6, 
    borderRadius: 6, 
    backgroundColor: COLORS.bgLight, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  flex1:        { flex: 1 },
  ownerName:    { fontSize: 14, fontWeight: '600', color: COLORS.black },
  ownerMeta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  newOwnerBadge: { fontSize: 11, fontWeight: '600', color: COLORS.green, marginTop: 4 },
  submitBtn:    { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText:{ color: COLORS.white, fontWeight: '700', fontSize: 16 },
});