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
  getLicenseCategories,
  createLicenseCategory,
  updateLicenseCategory,
  deleteLicenseCategory,
} from '../../services/licenseCategoryApi';

const LicenseCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    duration: '',
    fee: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await getLicenseCategories();
      setCategories(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load license categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      duration: '',
      fee: '',
    });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || '',
      description: category.description || '',
      code: category.code || '',
      duration: category.duration?.toString() || '',
      fee: category.fee?.toString() || '',
    });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        duration: parseInt(formData.duration) || 0,
        fee: parseFloat(formData.fee) || 0,
      };

      if (editingCategory) {
        await updateLicenseCategory(editingCategory._id, submitData);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await createLicenseCategory(submitData);
        Alert.alert('Success', 'Category created successfully');
      }

      resetForm();
      loadCategories();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (categoryId) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this license category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLicenseCategory(categoryId);
              Alert.alert('Success', 'Category deleted successfully');
              loadCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = (category) => (
    <View key={category._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCode}>Code: {category.code || 'N/A'}</Text>
        </View>
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleEdit(category)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(category._id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      {category.description && (
        <Text style={styles.description}>{category.description}</Text>
      )}
      
      <View style={styles.categoryDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{category.duration || 0} months</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Fee:</Text>
          <Text style={styles.detailValue}>Rs. {category.fee || 0}</Text>
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
        <Text style={styles.headerTitle}>License Categories</Text>
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
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              
              <Text style={styles.label}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Light Vehicle License"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., LV"
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter category description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Duration (months)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formData.duration}
                    onChangeText={(text) => setFormData({ ...formData, duration: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Fee (Rs.)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formData.fee}
                    onChangeText={(text) => setFormData({ ...formData, fee: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

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
                      {editingCategory ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Categories List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              All Categories ({categories.length})
            </Text>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>No license categories found</Text>
            ) : (
              categories.map(renderCategoryItem)
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
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  categoryCode: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  categoryActions: { flexDirection: 'row', gap: 8 },
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
  categoryDetails: { flexDirection: 'row', gap: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted },
  detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.black },
});

export default LicenseCategoriesScreen;
