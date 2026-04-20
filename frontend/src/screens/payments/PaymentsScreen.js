import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPayments } from '../../services/api';
import { COLORS } from '../../theme';

const statusColor = {
  Completed: { bg: COLORS.greenBg, text: COLORS.green },
  Pending:   { bg: COLORS.blueBg,  text: COLORS.blue  },
  Failed:    { bg: COLORS.redBg,   text: COLORS.red    },
  Refunded:  { bg: COLORS.gray,    text: COLORS.textMuted },
};

export default function PaymentsScreen({ navigation }) {
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await getPayments();
      setPayments(data);
    } catch {
      Alert.alert('Error', 'Could not load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const total = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={styles.summaryAmount}>LKR {total.toLocaleString()}</Text>
          <Text style={styles.summaryMeta}>{payments.filter(p => p.status === 'Completed').length} completed payments</Text>
        </View>

        {/* Payments list */}
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <TouchableOpacity style={styles.addPaymentBtn} onPress={() => navigation.navigate('AddPayment')}>
              <Text style={styles.addPaymentBtnText}>Make a Payment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          payments.map((p) => {
            const colors = statusColor[p.status] || { bg: COLORS.gray, text: COLORS.textMuted };
            return (
              <View key={p._id} style={styles.paymentCard}>
                <View style={styles.paymentIcon}>
                  <Ionicons
                    name={p.method === 'Card' ? 'card-outline' : p.method === 'Cash' ? 'cash-outline' : 'business-outline'}
                    size={20}
                    color={COLORS.black}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.paymentMethod}>{p.method} Payment</Text>
                  <Text style={styles.paymentMeta}>
                    {new Date(p.createdAt).toLocaleDateString()}
                    {p.session ? ` · ${p.session.type} Session` : ''}
                  </Text>
                  {p.reference && <Text style={styles.paymentRef}>Ref: {p.reference}</Text>}
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>LKR {p.amount.toLocaleString()}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>{p.status}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  title:   { fontSize: 24, fontWeight: '600', color: COLORS.black },
  addBtn:  { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  content: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryAmount: { fontSize: 32, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  summaryMeta:   { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  sectionTitle:  { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  empty:         { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle:    { fontSize: 15, fontWeight: '500', color: COLORS.textMuted },
  addPaymentBtn: { backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addPaymentBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
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
  paymentIcon:   { backgroundColor: COLORS.brandYellow, borderRadius: 10, padding: 10 },
  flex1:         { flex: 1 },
  paymentMethod: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  paymentMeta:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  paymentRef:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  paymentRight:  { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  badge:         { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:     { fontSize: 10, fontWeight: '700' },
});
