import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  getPayments,
  getPaymentById,
  updatePayment,
  BASE_URL,
} from '../../services/api';

import { getStudentById } from '../../services/studentApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

const statusColor = {
  Completed: { bg: COLORS.greenBg, text: COLORS.green },
  Pending: { bg: COLORS.blueBg, text: COLORS.blue },
  Failed: { bg: COLORS.redBg, text: COLORS.red },
  Refunded: { bg: COLORS.gray, text: COLORS.textMuted },
};

export default function PaymentsScreen({ navigation }) {
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isStudentEnd = user?.role === 'student';
  const canManagePayments = !isStudentEnd;

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await getPayments();
      setPayments(data || []);
    } catch (error) {
      console.log('Load payments error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments])
  );

  const total = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const getStudentId = student => {
    if (!student) return null;
    if (typeof student === 'string') return student;
    return student._id || student.id || null;
  };

  const hasUsefulStudentDetails = student => {
    if (!student || typeof student === 'string') return false;

    return Boolean(
      student.name ||
      student.firstName ||
      student.lastName ||
      student.email ||
      student.NIC ||
      student.contactNumber
    );
  };

  const getStudentName = student => {
    if (!student || typeof student === 'string') return 'N/A';

    if (student.name) return student.name;

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return fullName || 'N/A';
  };

  const getStudentEmail = student => {
    if (!student || typeof student === 'string') return 'N/A';
    return student.email || 'N/A';
  };

  const getStudentNIC = student => {
    if (!student || typeof student === 'string') return 'N/A';
    return student.NIC || 'N/A';
  };

  const getStudentContact = student => {
    if (!student || typeof student === 'string') return 'N/A';
    return student.contactNumber || student.phone || student.mobile || 'N/A';
  };

  const getReceiptUrl = receipt => {
    if (!receipt) return null;

    if (receipt.startsWith('http')) {
      return receipt;
    }

    return `${BASE_URL}${receipt}`;
  };

  const loadFullStudentDetails = async paymentData => {
    try {
      const studentId = getStudentId(paymentData?.student);

      if (!studentId) {
        return paymentData;
      }

      if (hasUsefulStudentDetails(paymentData.student)) {
        return paymentData;
      }

      const { data } = await getStudentById(studentId);

      return {
        ...paymentData,
        student: data,
      };
    } catch (error) {
      console.log('Load student details error:', error.response?.data || error.message);
      return paymentData;
    }
  };

  const openPaymentDetails = async paymentId => {
    try {
      setDetailsLoading(true);
      setShowDetailsModal(true);

      const { data } = await getPaymentById(paymentId);
      const paymentWithStudent = await loadFullStudentDetails(data);

      setSelectedPayment(paymentWithStudent);
    } catch (error) {
      console.log('Load payment details error:', error.response?.data || error.message);
      setShowDetailsModal(false);
      Alert.alert('Error', 'Could not load payment details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closePaymentDetails = () => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  };

  const handleAcceptPayment = async () => {
    if (!selectedPayment?._id) return;

    Alert.alert(
      'Accept Payment',
      'Are you sure you want to accept this bank transfer payment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setAccepting(true);

              await updatePayment(selectedPayment._id, {
                status: 'Completed',
              });

              Alert.alert('Success', 'Payment accepted successfully');

              closePaymentDetails();
              fetchPayments();
            } catch (error) {
              console.log('Accept payment error:', error.response?.data || error.message);

              Alert.alert(
                'Error',
                error.response?.data?.message || 'Could not accept payment'
              );
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment?._id) return;

    Alert.alert(
      'Reject Payment',
      'Are you sure you want to reject this bank transfer payment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setRejecting(true);

              await updatePayment(selectedPayment._id, {
                status: 'Failed',
              });

              Alert.alert('Success', 'Payment rejected successfully');

              closePaymentDetails();
              fetchPayments();
            } catch (error) {
              console.log('Reject payment error:', error.response?.data || error.message);

              Alert.alert(
                'Error',
                error.response?.data?.message || 'Could not reject payment'
              );
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  const renderPaymentIcon = method => {
    if (method === 'Cash') return 'cash-outline';
    if (method === 'Bank Transfer') return 'business-outline';
    return 'card-outline';
  };

  const renderPaymentCard = p => {
    const colors = statusColor[p.status] || {
      bg: COLORS.gray,
      text: COLORS.textMuted,
    };

    return (
      <TouchableOpacity
        key={p._id}
        style={styles.paymentCard}
        onPress={() => openPaymentDetails(p._id)}
        activeOpacity={0.8}
      >
        <View style={styles.paymentIcon}>
          <Ionicons
            name={renderPaymentIcon(p.method)}
            size={20}
            color={COLORS.black}
          />
        </View>

        <View style={styles.flex1}>
          <Text style={styles.paymentMethod}>{p.method} Payment</Text>

          <Text style={styles.paymentMeta}>
            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
          </Text>

          {p.reference && (
            <Text style={styles.paymentRef}>Ref: {p.reference}</Text>
          )}

          {p.student && canManagePayments && (
            <Text style={styles.paymentRef}>
              Student: {getStudentName(p.student)}
            </Text>
          )}
        </View>

        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>
            LKR {Number(p.amount || 0).toLocaleString()}
          </Text>

          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {p.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    const payment = selectedPayment;

    const colors = statusColor[payment?.status] || {
      bg: COLORS.gray,
      text: COLORS.textMuted,
    };

    const receiptUrl = getReceiptUrl(payment?.receipt);

    const canTakeAction =
      canManagePayments &&
      payment?.method === 'Bank Transfer' &&
      payment?.status === 'Pending';

    return (
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={closePaymentDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>

              <TouchableOpacity onPress={closePaymentDetails}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <View style={styles.detailsLoadingBox}>
                <ActivityIndicator size="large" color={COLORS.brandOrange} />
                <Text style={styles.loadingText}>Loading payment details...</Text>
              </View>
            ) : payment ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailTopCard}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name={renderPaymentIcon(payment.method)}
                      size={26}
                      color={COLORS.black}
                    />
                  </View>

                  <Text style={styles.detailAmount}>
                    LKR {Number(payment.amount || 0).toLocaleString()}
                  </Text>

                  <View style={[styles.detailStatusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.detailStatusText, { color: colors.text }]}>
                      {payment.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Payment Information</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method</Text>
                    <Text style={styles.detailValue}>{payment.method}</Text>
                  </View>

                  {payment.method === 'Bank Transfer' && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transaction ID</Text>
                      <Text style={styles.detailValue}>{payment.reference || 'N/A'}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Submitted Date</Text>
                    <Text style={styles.detailValue}>
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleString()
                        : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Paid At</Text>
                    <Text style={styles.detailValue}>
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleString()
                        : 'Not completed yet'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Student Details</Text>

                  <View style={styles.studentHeaderBox}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>
                        {getStudentName(payment.student).charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.flex1}>
                      <Text style={styles.studentNameText}>
                        {getStudentName(payment.student)}
                      </Text>

                      <Text style={styles.studentSubText}>
                        {getStudentEmail(payment.student)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>
                      {getStudentName(payment.student)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>
                      {getStudentEmail(payment.student)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>NIC</Text>
                    <Text style={styles.detailValue}>
                      {getStudentNIC(payment.student)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact</Text>
                    <Text style={styles.detailValue}>
                      {getStudentContact(payment.student)}
                    </Text>
                  </View>
                </View>

                {payment.method === 'Bank Transfer' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Bank Transfer Receipt</Text>

                    {receiptUrl ? (
                      <Image
                        source={{ uri: receiptUrl }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noReceiptBox}>
                        <Ionicons
                          name="image-outline"
                          size={36}
                          color={COLORS.textMuted}
                        />
                        <Text style={styles.noReceiptText}>No receipt uploaded</Text>
                      </View>
                    )}
                  </View>
                )}

                {canTakeAction && (
                  <View style={styles.paymentActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.rejectBtn,
                        (rejecting || accepting) && styles.actionBtnDisabled,
                      ]}
                      onPress={handleRejectPayment}
                      disabled={rejecting || accepting}
                    >
                      {rejecting ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="close-circle-outline"
                            size={20}
                            color={COLORS.white}
                          />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptBtn,
                        (accepting || rejecting) && styles.actionBtnDisabled,
                      ]}
                      onPress={handleAcceptPayment}
                      disabled={accepting || rejecting}
                    >
                      {accepting ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={COLORS.white}
                          />
                          <Text style={styles.actionBtnText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {payment.method === 'Bank Transfer' &&
                  payment.status === 'Completed' && (
                    <View style={styles.completedNotice}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.green}
                      />
                      <Text style={styles.completedNoticeText}>
                        This bank transfer payment has been accepted.
                      </Text>
                    </View>
                  )}

                {payment.method === 'Bank Transfer' &&
                  payment.status === 'Failed' && (
                    <View style={styles.rejectedNotice}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={COLORS.red}
                      />
                      <Text style={styles.rejectedNoticeText}>
                        This bank transfer payment has been rejected.
                      </Text>
                    </View>
                  )}
              </ScrollView>
            ) : (
              <Text style={styles.emptyTitle}>Payment details not found</Text>
            )}
          </View>
        </View>
      </Modal>
    );
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
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        <Text style={styles.title}>Payments</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddPayment')}
        >
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPayments();
            }}
          />
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {isStudentEnd ? 'My Total Paid' : 'Total Paid'}
          </Text>

          <Text style={styles.summaryAmount}>
            LKR {total.toLocaleString()}
          </Text>

          <Text style={styles.summaryMeta}>
            {payments.filter(p => p.status === 'Completed').length} completed payments
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Payment History</Text>

        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyTitle}>No payments yet</Text>

            <TouchableOpacity
              style={styles.addPaymentBtn}
              onPress={() => navigation.navigate('AddPayment')}
            >
              <Text style={styles.addPaymentBtnText}>
                {isStudentEnd ? 'Make a Payment' : 'Add Cash Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          payments.map(renderPaymentCard)
        )}
      </ScrollView>

      {renderDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
  },

  addBtn: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 12,
    padding: 8,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },

  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },

  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },

  summaryMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  addPaymentBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  addPaymentBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },

  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  paymentIcon: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 10,
    padding: 10,
  },

  flex1: {
    flex: 1,
  },

  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },

  paymentMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  paymentRef: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },

  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '92%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },

  detailsLoadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },

  detailTopCard: {
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailIcon: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },

  detailAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 8,
  },

  detailStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  detailStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  detailSection: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 10,
  },

  studentHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  studentAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },

  studentNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  studentSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    flex: 1,
  },

  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1.4,
    textAlign: 'right',
  },

  receiptImage: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    backgroundColor: COLORS.bgLight,
  },

  noReceiptBox: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  noReceiptText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  paymentActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  actionBtnDisabled: {
    opacity: 0.7,
  },

  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  completedNotice: {
    backgroundColor: COLORS.greenBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },

  completedNoticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green,
  },

  rejectedNotice: {
    backgroundColor: COLORS.redBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },

  rejectedNoticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.red,
  },
});