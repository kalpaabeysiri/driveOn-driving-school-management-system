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
import { Ionicons } from '@expo/vector-icons';

import {
  getPayments,
  getPaymentById,
  updatePayment,
  BASE_URL,
} from '../../services/api';

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
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await getPayments();
      setPayments(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const total = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStudentName = student => {
    if (!student) return 'N/A';

    if (student.name) return student.name;

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    return fullName || 'N/A';
  };

  const getReceiptUrl = receipt => {
    if (!receipt) return null;

    if (receipt.startsWith('http')) {
      return receipt;
    }

    return `${BASE_URL}${receipt}`;
  };

  const openPaymentDetails = async paymentId => {
    try {
      setDetailsLoading(true);
      setShowDetailsModal(true);

      const { data } = await getPaymentById(paymentId);
      setSelectedPayment(data);
    } catch (error) {
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

  const renderPaymentIcon = method => {
    if (method === 'Card') return 'card-outline';
    if (method === 'Cash') return 'cash-outline';
    return 'business-outline';
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
            {new Date(p.createdAt).toLocaleDateString()}
            {p.session ? ` · ${p.session.type || p.session.sessionType} Session` : ''}
          </Text>

          {p.reference && (
            <Text style={styles.paymentRef}>Ref: {p.reference}</Text>
          )}

          {p.student && isAdmin && (
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

    const canAcceptBankTransfer =
      isAdmin &&
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

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{payment.reference || 'N/A'}</Text>
                  </View>

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

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>
                      {getStudentName(payment.student)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>
                      {payment.student?.email || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>NIC</Text>
                    <Text style={styles.detailValue}>
                      {payment.student?.NIC || 'N/A'}
                    </Text>
                  </View>
                </View>

                {payment.session && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Session Details</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Session</Text>
                      <Text style={styles.detailValue}>
                        {payment.session.type || payment.session.sessionType || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {payment.session.date
                          ? new Date(payment.session.date).toDateString()
                          : 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Start Time</Text>
                      <Text style={styles.detailValue}>
                        {payment.session.startTime || 'N/A'}
                      </Text>
                    </View>
                  </View>
                )}

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

                {canAcceptBankTransfer && (
                  <TouchableOpacity
                    style={[styles.acceptBtn, accepting && styles.acceptBtnDisabled]}
                    onPress={handleAcceptPayment}
                    disabled={accepting}
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
                        <Text style={styles.acceptBtnText}>Accept Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
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
          onPress={() => navigation.navigate('AddPayment', { onBack: fetchPayments })}
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
          <Text style={styles.summaryLabel}>Total Paid</Text>
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
              <Text style={styles.addPaymentBtnText}>Make a Payment</Text>
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

  acceptBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },

  acceptBtnDisabled: {
    opacity: 0.7,
  },

  acceptBtnText: {
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
});