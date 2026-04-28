import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSessionReport } from '../../services/sessionApi';
import { COLORS } from '../../theme';

export default function SessionReportScreen({ navigation }) {
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [year,     setYear]     = useState(new Date().getFullYear());
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await getSessionReport(year);
        setReport(data);
      } catch {
        Alert.alert('Error', 'Could not load report');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [year]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sessions Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Year Selector */}
        <View style={styles.yearRow}>
          <TouchableOpacity onPress={() => setYear(y => y - 1)} style={styles.yearBtn}>
            <Ionicons name="chevron-back" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(y => y + 1)} style={styles.yearBtn}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.brandOrange }]}>
            <Text style={styles.summaryValue}>{report?.totalSessionsForYear || 0}</Text>
            <Text style={styles.summaryLabel}>Total Sessions</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.brandYellow }]}>
            <Text style={[styles.summaryValue, { color: COLORS.black }]}>{report?.totalStudentsForYear || 0}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.textMuted }]}>Total Enrollments</Text>
          </View>
        </View>

        {/* Monthly Breakdown */}
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        {report?.monthlyBreakdown?.length === 0
          ? <Text style={styles.emptyText}>No sessions in {year}</Text>
          : report?.monthlyBreakdown?.map((m) => (
            <TouchableOpacity
              key={m.monthNumber}
              style={styles.monthCard}
              onPress={() => setExpanded(expanded === m.monthNumber ? null : m.monthNumber)}
            >
              <View style={styles.monthHeader}>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthNum}>{String(m.monthNumber).padStart(2, '0')}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.monthName}>{m.month}</Text>
                  <Text style={styles.monthMeta}>{m.totalSessions} sessions · {m.totalStudents} students</Text>
                </View>
                {m.avgRating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.ratingText}>{m.avgRating}</Text>
                  </View>
                )}
                <Ionicons name={expanded === m.monthNumber ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
              </View>

              {expanded === m.monthNumber && (
                <View style={styles.expandedContent}>
                  <View style={styles.typeRow}>
                    <View style={styles.typeCard}>
                      <Text style={styles.typeLabel}>Theory</Text>
                      <Text style={styles.typeValue}>{m.theory?.total || 0}</Text>
                      <Text style={styles.typeMeta}>{m.theory?.completed || 0} completed</Text>
                      <Text style={styles.typeMeta}>{m.theory?.students  || 0} students</Text>
                    </View>
                    <View style={[styles.typeCard, { backgroundColor: COLORS.brandYellow }]}>
                      <Text style={styles.typeLabel}>Practical</Text>
                      <Text style={styles.typeValue}>{m.practical?.total || 0}</Text>
                      <Text style={styles.typeMeta}>{m.practical?.completed || 0} completed</Text>
                      <Text style={styles.typeMeta}>{m.practical?.students  || 0} students</Text>
                    </View>
                  </View>
                  {(m.theory?.cancelled > 0 || m.practical?.cancelled > 0) && (
                    <Text style={styles.cancelledText}>
                      ⚠️ {(m.theory?.cancelled || 0) + (m.practical?.cancelled || 0)} session(s) cancelled
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 },
  yearBtn: { backgroundColor: COLORS.bgLight, borderRadius: 10, padding: 8 },
  yearText:{ fontSize: 24, fontWeight: '700', color: COLORS.black },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard:{ flex: 1, borderRadius: 16, padding: 20, alignItems: 'center' },
  summaryValue:{ fontSize: 36, fontWeight: '800', color: COLORS.white },
  summaryLabel:{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionTitle:{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  emptyText:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  monthCard:   { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  monthBadge:  { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center' },
  monthNum:    { fontSize: 14, fontWeight: '700', color: COLORS.black },
  flex1:       { flex: 1 },
  monthName:   { fontSize: 15, fontWeight: '600', color: COLORS.black },
  monthMeta:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF8ED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText:  { fontSize: 12, fontWeight: '700', color: '#856404' },
  expandedContent: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, padding: 14 },
  typeRow:     { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeCard:    { flex: 1, backgroundColor: COLORS.blueBg, borderRadius: 12, padding: 12 },
  typeLabel:   { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 4 },
  typeValue:   { fontSize: 22, fontWeight: '700', color: COLORS.black },
  typeMeta:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  cancelledText:{ fontSize: 12, color: COLORS.red, fontWeight: '500' },
});
