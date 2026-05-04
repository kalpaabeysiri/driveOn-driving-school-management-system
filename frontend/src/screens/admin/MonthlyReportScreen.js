import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMonthlyReport } from '../../services/studentApi';
import { COLORS } from '../../theme';

export default function MonthlyReportScreen({ navigation }) {
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [year,     setYear]     = useState(new Date().getFullYear());
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data } = await getMonthlyReport(year);
        setReport(data);
      } catch {
        Alert.alert('Error', 'Could not load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [year]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Report</Text>
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

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Registrations {year}</Text>
          <Text style={styles.summaryCount}>{report?.totalForYear || 0}</Text>
          <Text style={styles.summarySubtext}>students registered this year</Text>
        </View>

        {/* Monthly Breakdown */}
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        {report?.monthlyBreakdown?.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No registrations in {year}</Text>
          </View>
        ) : (
          report?.monthlyBreakdown?.map((month) => (
            <TouchableOpacity
              key={month.monthNumber}
              style={styles.monthCard}
              onPress={() => setExpanded(expanded === month.monthNumber ? null : month.monthNumber)}
            >
              <View style={styles.monthHeader}>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthNum}>{String(month.monthNumber).padStart(2,'0')}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.monthName}>{month.month}</Text>
                  <Text style={styles.monthMeta}>
                    {month.totalRegistrations} registered ·
                    <Text style={{ color: COLORS.green }}> {month.activeStudents} active</Text> ·
                    <Text style={{ color: COLORS.red }}> {month.suspendedStudents} suspended</Text>
                  </Text>
                </View>
                <Ionicons
                  name={expanded === month.monthNumber ? 'chevron-up' : 'chevron-down'}
                  size={18} color={COLORS.textMuted}
                />
              </View>

              {/* Expanded student list */}
              {expanded === month.monthNumber && (
                <View style={styles.studentList}>
                  {month.students.map((s, i) => (
                    <View key={i} style={styles.studentRow}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <View style={[styles.statusDot, {
                        backgroundColor: s.status === 'Active' ? COLORS.green : COLORS.red,
                      }]} />
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  yearRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 },
  yearBtn:      { backgroundColor: COLORS.bgLight, borderRadius: 10, padding: 8 },
  yearText:     { fontSize: 24, fontWeight: '700', color: COLORS.black },
  summaryCard:  { backgroundColor: COLORS.brandOrange, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  summaryTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  summaryCount: { fontSize: 52, fontWeight: '800', color: COLORS.white },
  summarySubtext:{ fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  empty:        { alignItems: 'center', paddingVertical: 40 },
  emptyText:    { fontSize: 14, color: COLORS.textMuted },
  monthCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden',
  },
  monthHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  monthBadge: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center',
  },
  monthNum:     { fontSize: 14, fontWeight: '700', color: COLORS.black },
  flex1:        { flex: 1 },
  monthName:    { fontSize: 15, fontWeight: '600', color: COLORS.black },
  monthMeta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  studentList:  { borderTopWidth: 1, borderTopColor: COLORS.borderLight, padding: 12, gap: 8 },
  studentRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName:  { fontSize: 13, color: COLORS.textDark },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
});
