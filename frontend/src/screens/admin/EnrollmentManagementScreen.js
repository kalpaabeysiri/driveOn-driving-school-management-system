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
  getEnrollmentCourses,
  createEnrollmentCourse,
  updateEnrollmentCourse,
  deleteEnrollmentCourse,
  getEnrollmentPayments,
  createEnrollmentPayment,
  deleteEnrollmentPayment,
} from '../../services/enrollmentApi';
import { getLicenseCategories } from '../../services/licenseCategoryApi';
import { getAllStudents } from '../../services/studentApi';

const EnrollmentManagementScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [licenseCategories, setLicenseCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data for courses
  const [courseFormData, setCourseFormData] = useState({
    student: '',
    licenseCategory: '',
    courseFee: '',
    discount: '',
  });

  // Form data for payments
  const [paymentFormData, setPaymentFormData] = useState({
    student: '',
    course: '',
    amount: '',
    paymentMethod: 'Cash',
    installmentNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [lcRes, stuRes] = await Promise.all([
        getLicenseCategories(),
        getAllStudents(),
      ]);
      setLicenseCategories(lcRes.data);
      setStudents(stuRes.data);

      if (activeTab === 'courses') {
        const { data } = await getEnrollmentCourses();
        setCourses(data);
      } else {
        const { data } = await getEnrollmentPayments();
        setPayments(data);
      }
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

  const resetCourseForm = () => {
    setCourseFormData({
      student: '',
      licenseCategory: '',
      courseFee: '',
      discount: '',
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      student: '',
      course: '',
      amount: '',
      paymentMethod: 'Cash',
      installmentNumber: '',
      notes: '',
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEditCourse = (course) => {
    setCourseFormData({
      student: course.student?._id || '',
      licenseCategory: course.licenseCategory?._id || '',
      courseFee: course.courseFee?.toString() || '',
      discount: course.discount?.toString() || '',
    });
    setEditingItem(course);
    setShowAddForm(true);
  };

  const handleEditPayment = (payment) => {
    setPaymentFormData({
      student: payment.student?._id || '',
      course: payment.course?._id || '',
      amount: payment.amount?.toString() || '',
      paymentMethod: payment.paymentMethod || 'Cash',
      installmentNumber: payment.installmentNumber?.toString() || '',
      notes: payment.notes || '',
    });
    setEditingItem(payment);
    setShowAddForm(true);
  };

  const handleSubmitCourse = async () => {
    if (!courseFormData.student || !courseFormData.licenseCategory || !courseFormData.courseFee) {
      Alert.alert('Error', 'Student, license category and course fee are required');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        student: courseFormData.student,
        licenseCategory: courseFormData.licenseCategory,
        courseFee: parseFloat(courseFormData.courseFee) || 0,
        discount: parseFloat(courseFormData.discount) || 0,
      };

      if (editingItem) {
        await updateEnrollmentCourse(editingItem._id, submitData);
        Alert.alert('Success', 'Course updated successfully');
      } else {
        await createEnrollmentCourse(submitData);
        Alert.alert('Success', 'Course created successfully');
      }

      resetCourseForm();
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentFormData.student || !paymentFormData.course || !paymentFormData.amount) {
      Alert.alert('Error', 'Student, course, and amount are required');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...paymentFormData,
        amount: parseFloat(paymentFormData.amount),
        installmentNumber: parseInt(paymentFormData.installmentNumber) || 0,
      };

      await createEnrollmentPayment(submitData);
      Alert.alert('Success', 'Payment recorded successfully');
      resetPaymentForm();
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = (courseId) => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEnrollmentCourse(courseId);
              Alert.alert('Success', 'Course deleted successfully');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const handleDeletePayment = (paymentId) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEnrollmentPayment(paymentId);
              Alert.alert('Success', 'Payment deleted successfully');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete payment');
            }
          },
        },
      ]
    );
  };

  const getLicenseCategoryName = (categoryId) => {
    const category = licenseCategories.find((c) => c._id === (categoryId?._id || categoryId));
    return category ? category.licenseCategoryName : 'N/A';
  };

  const getStudentName = (student) => {
    if (!student) return 'N/A';
    return `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
  };

  const renderCourseItem = (course) => (
    <View key={course._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{getStudentName(course.student)}</Text>
          <Text style={styles.itemSubtitle}>
            {getLicenseCategoryName(course.licenseCategory)}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleEditCourse(course)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteCourse(course._id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Course Fee:</Text>
          <Text style={styles.detailValue}>Rs. {course.courseFee || 0}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Discount:</Text>
          <Text style={styles.detailValue}>Rs. {course.discount || 0}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Remaining:</Text>
          <Text style={styles.detailValue}>Rs. {course.remainingBalance ?? (course.courseFee - (course.discount || 0))}</Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentItem = (payment) => (
    <View key={payment._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Rs. {payment.amount}</Text>
          <Text style={styles.itemSubtitle}>
            {getStudentName(payment.student)} · {getLicenseCategoryName(payment.course?.licenseCategory)}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeletePayment(payment._id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Method:</Text>
          <Text style={styles.detailValue}>{payment.paymentMethod}</Text>
        </View>
        {payment.installmentNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Installment:</Text>
            <Text style={styles.detailValue}>#{payment.installmentNumber}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(payment.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {payment.notes && (
        <Text style={styles.notes}>{payment.notes}</Text>
      )}
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
        <Text style={styles.headerTitle}>Enrollment Management</Text>
        <TouchableOpacity onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={24} color={COLORS.brandOrange} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.tabActive]}
          onPress={() => setActiveTab('courses')}
        >
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
            Courses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            Payments
          </Text>
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
                {activeTab === 'courses'
                  ? (editingItem ? 'Edit Course' : 'Add New Course')
                  : 'Record Payment'}
              </Text>
              
              {activeTab === 'courses' ? (
                <>
                  <Text style={styles.label}>Student *</Text>
                  <View style={styles.pickerContainer}>
                    {students.map((s) => (
                      <TouchableOpacity
                        key={s._id}
                        style={[
                          styles.optionBtn,
                          courseFormData.student === s._id && styles.optionBtnSelected,
                        ]}
                        onPress={() => setCourseFormData({ ...courseFormData, student: s._id })}
                      >
                        <Text style={[styles.optionBtnText, courseFormData.student === s._id && styles.optionBtnTextSelected]}>
                          {s.firstName} {s.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>License Category *</Text>
                  <View style={styles.pickerContainer}>
                    {licenseCategories.map((category) => (
                      <TouchableOpacity
                        key={category._id}
                        style={[
                          styles.optionBtn,
                          courseFormData.licenseCategory === category._id && styles.optionBtnSelected,
                        ]}
                        onPress={() => setCourseFormData({ ...courseFormData, licenseCategory: category._id })}
                      >
                        <Text style={[styles.optionBtnText, courseFormData.licenseCategory === category._id && styles.optionBtnTextSelected]}>
                          {category.licenseCategoryName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.label}>Course Fee (Rs.) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="25000"
                        value={courseFormData.courseFee}
                        onChangeText={(text) => setCourseFormData({ ...courseFormData, courseFee: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.label}>Discount (Rs.)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        value={courseFormData.discount}
                        onChangeText={(text) => setCourseFormData({ ...courseFormData, discount: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={resetCourseForm}
                      disabled={submitting}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.submitBtn]}
                      onPress={handleSubmitCourse}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.submitBtnText}>
                          {editingItem ? 'Update' : 'Create'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Student *</Text>
                  <View style={styles.pickerContainer}>
                    {students.map((s) => (
                      <TouchableOpacity
                        key={s._id}
                        style={[
                          styles.optionBtn,
                          paymentFormData.student === s._id && styles.optionBtnSelected,
                        ]}
                        onPress={() => setPaymentFormData({ ...paymentFormData, student: s._id, course: '' })}
                      >
                        <Text style={[styles.optionBtnText, paymentFormData.student === s._id && styles.optionBtnTextSelected]}>
                          {s.firstName} {s.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Course *</Text>
                  <View style={styles.pickerContainer}>
                    {courses
                      .filter(c => c.student?._id === paymentFormData.student || c.student === paymentFormData.student)
                      .map((c) => (
                        <TouchableOpacity
                          key={c._id}
                          style={[
                            styles.optionBtn,
                            paymentFormData.course === c._id && styles.optionBtnSelected,
                          ]}
                          onPress={() => setPaymentFormData({ ...paymentFormData, course: c._id })}
                        >
                          <Text style={[styles.optionBtnText, paymentFormData.course === c._id && styles.optionBtnTextSelected]}>
                            {getLicenseCategoryName(c.licenseCategory)} · Rs.{c.remainingBalance} left
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>

                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.label}>Amount (Rs.) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="5000"
                        value={paymentFormData.amount}
                        onChangeText={(text) => setPaymentFormData({ ...paymentFormData, amount: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.label}>Installment #</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1"
                        value={paymentFormData.installmentNumber}
                        onChangeText={(text) => setPaymentFormData({ ...paymentFormData, installmentNumber: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Payment Method</Text>
                  <View style={styles.pickerContainer}>
                    {['Cash', 'Card', 'Bank Transfer', 'Online'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.optionBtn,
                          paymentFormData.paymentMethod === method && styles.optionBtnSelected,
                        ]}
                        onPress={() => setPaymentFormData({ ...paymentFormData, paymentMethod: method })}
                      >
                        <Text
                          style={[
                            styles.optionBtnText,
                            paymentFormData.paymentMethod === method && styles.optionBtnTextSelected,
                          ]}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter payment notes"
                    value={paymentFormData.notes}
                    onChangeText={(text) => setPaymentFormData({ ...paymentFormData, notes: text })}
                    multiline
                  />

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={resetPaymentForm}
                      disabled={submitting}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.submitBtn]}
                      onPress={handleSubmitPayment}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.submitBtnText}>Record</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {/* List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'courses' ? `All Courses (${courses.length})` : `Recent Payments (${payments.length})`}
            </Text>
            {(activeTab === 'courses' ? courses : payments).length === 0 ? (
              <Text style={styles.emptyText}>
                No {activeTab === 'courses' ? 'courses' : 'payments'} found
              </Text>
            ) : (
              (activeTab === 'courses' ? courses : payments).map(
                activeTab === 'courses' ? renderCourseItem : renderPaymentItem
              )
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
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.brandOrange, fontWeight: '600' },
  
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
  
  // Option buttons
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionBtnSelected: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  optionBtnText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  optionBtnTextSelected: { color: COLORS.white },
  
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
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  itemSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  itemActions: { flexDirection: 'row', gap: 8 },
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
  notes: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.bgLight,
    borderRadius: 8,
  },
  itemDetails: { gap: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: { fontSize: 12, color: COLORS.textMuted },
  detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.black },
});

export default EnrollmentManagementScreen;
