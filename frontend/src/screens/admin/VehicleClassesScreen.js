import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../theme';
import {
  getVehicleClasses,
  createVehicleClass,
  updateVehicleClass,
  deleteVehicleClass,
} from '../../services/vehicleClassApi';
import { getLicenseCategories } from '../../services/licenseCategoryApi';

const VehicleClassesScreen = ({ navigation }) => {
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [licenseCategories, setLicenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    licenseCategory: '',
    ageRequirement: '',
    experienceRequired: '',
    fee: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, lcRes] = await Promise.all([
        getVehicleClasses(),
        getLicenseCategories(),
      ]);
      setVehicleClasses(classesRes.data);
      setLicenseCategories(lcRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      licenseCategory: '',
      ageRequirement: '',
      experienceRequired: '',
      fee: '',
    });
    setEditingClass(null);
    setShowAddForm(false);
  };

  const handleEdit = (vehicleClass) => {
    setFormData({
      name: vehicleClass.name || '',
      description: vehicleClass.description || '',
      licenseCategory: vehicleClass.licenseCategory?._id || '',
      ageRequirement: vehicleClass.ageRequirement?.toString() || '',
      experienceRequired: vehicleClass.experienceRequired?.toString() || '',
      fee: vehicleClass.fee?.toString() || '',
    });
    setEditingClass(vehicleClass);
    setShowAddForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.licenseCategory) {
      Alert.alert('Error', 'Vehicle class name and license category are required');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        ageRequirement: parseInt(formData.ageRequirement) || 0,
        experienceRequired: parseInt(formData.experienceRequired) || 0,
        fee: parseFloat(formData.fee) || 0,
      };

      if (editingClass) {
        await updateVehicleClass(editingClass._id, submitData);
        Alert.alert('Success', 'Vehicle class updated successfully');
      } else {
        await createVehicleClass(submitData);
        Alert.alert('Success', 'Vehicle class created successfully');
      }

      resetForm();
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save vehicle class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (classId) => {
    Alert.alert(
      'Delete Vehicle Class',
      'Are you sure you want to delete this vehicle class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicleClass(classId);
              Alert.alert('Success', 'Vehicle class deleted successfully');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vehicle class');
            }
          },
        },
      ]
    );
  };

  const getLicenseCategoryName = (categoryId) => {
    const category = licenseCategories.find((c) => c._id === categoryId);
    return category ? category.name : 'N/A';
  };

  const renderVehicleClassItem = (vehicleClass) => (
    <View key={vehicleClass._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{vehicleClass.name}</Text>
          <Text style={styles.categoryName}>
            {getLicenseCategoryName(vehicleClass.licenseCategory?._id)}
          </Text>
        </View>
        <View style={styles.classActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleEdit(vehicleClass)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(vehicleClass._id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      {vehicleClass.description && (
        <Text style={styles.description}>{vehicleClass.description}</Text>
      )}
      
      <View style={styles.classDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Age Requirement:</Text>
          <Text style={styles.detailValue}>{vehicleClass.ageRequirement || 0} years</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Experience:</Text>
          <Text style={styles.detailValue}>{vehicleClass.experienceRequired || 0} months</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Fee:</Text>
          <Text style={styles.detailValue}>Rs. {vehicleClass.fee || 0}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Classes</Text>
        <TouchableOpacity onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={24} color={COLORS.brandOrange} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Add/Edit Form */}
          {showAddForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingClass ? 'Edit Vehicle Class' : 'Add New Vehicle Class'}
              </Text>
              
              <Text style={styles.label}>Class Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Motor Car"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>License Category *</Text>
              <View style={styles.pickerContainer}>
                {licenseCategories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryOption,
                      formData.licenseCategory === category._id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, licenseCategory: category._id })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.licenseCategory === category._id && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter class description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Age Requirement</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="18"
                    value={formData.ageRequirement}
                    onChangeText={(text) => setFormData({ ...formData, ageRequirement: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Experience (months)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formData.experienceRequired}
                    onChangeText={(text) => setFormData({ ...formData, experienceRequired: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Fee (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.fee}
                onChangeText={(text) => setFormData({ ...formData, fee: text })}
                keyboardType="numeric"
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={resetForm}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.submitBtn]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {editingClass ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Vehicle Classes List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              All Vehicle Classes ({vehicleClasses.length})
            </Text>
            {vehicleClasses.length === 0 ? (
              <Text style={styles.emptyText}>No vehicle classes found</Text>
            ) : (
              vehicleClasses.map(renderVehicleClassItem)
            )}
          </View>
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
  
  // Form styles
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  formTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  submitBtn: { backgroundColor: COLORS.brandOrange },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  
  // Category picker
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryOptionSelected: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  categoryOptionText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  categoryOptionTextSelected: { color: COLORS.white },
  
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 16, marginTop: 50 },
  
  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  categoryName: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  classActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: { backgroundColor: COLORS.blue },
  deleteBtn: { backgroundColor: COLORS.red },
  description: { fontSize: 14, color: COLORS.textDark, marginBottom: 12 },
  classDetails: { gap: 8 },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: { fontSize: 12, color: COLORS.textMuted },
  detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.black },
});

export default VehicleClassesScreen;
