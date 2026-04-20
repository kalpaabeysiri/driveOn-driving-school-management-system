import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUsageReport } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function VehicleUsageReportScreen({ navigation }) {
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [startDate,setStartDate]= useState('');
  const [endDate,  setEndDate]  = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await getUsageReport(params);
      setReport(data);
    } catch {
      Alert.alert('Error', 'Could not load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Usage Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Date Filter */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filter by Date Range</Text>
          <View style={styles.dateRow}>
            <View style={styles.flex1}>
              <Text style={styles.label}>From (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-01-01" value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <Text style={styles.label}>To (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2026-12-31" value={endDate} onChangeText={setEndDate} />
            </View>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={fetchReport}>
            <Text style={styles.filterBtnText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.brandOrange} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Summary */}
            <Text style={styles.sectionTitle}>Summary by Vehicle</Text>
            {report?.summary?.length === 0 ? (
              <Text style={styles.emptyText}>No usage records found.</Text>
            ) : (
              report?.summary?.map((s, i) => (
                <View key={i} style={styles.summaryCard}>
                  <View style={styles.summaryTop}>
                    <Text style={styles.summaryVehicle}>{s.vehicleModel}</Text>
                    <Text style={styles.summaryPlate}>{s.licensePlate}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    {[
                      { label: 'Total KM',    value: `${s.totalKm} km` },
                      { label: 'Duration',    value: `${Math.round(s.totalDuration / 60)} hrs` },
                      { label: 'Total Trips', value: s.totalTrips },
                    ].map((stat) => (
                      <View key={stat.label} style={styles.statBox}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}

            {/* Detailed Records */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Detailed Records</Text>
            {report?.usageRecords?.length === 0 ? (
              <Text style={styles.emptyText}>No records found.</Text>
            ) : (
              report?.usageRecords?.map((r) => (
                <View key={r._id} style={styles.recordCard}>
                  <View style={styles.recordTop}>
                    <Text style={styles.recordVehicle}>{r.vehicleModel}</Text>
                    <Text style={styles.recordDate}>{new Date(r.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.recordPlate}>{r.licensePlate}</Text>
                  <View style={styles.recordStats}>
                    <Text style={styles.recordStat}>📍 {r.km} km</Text>
                    <Text style={styles.recordStat}>⏱ {r.duration} mins</Text>
                    {r.session && <Text style={styles.recordStat}>📅 {r.session.type} Session</Text>}
                  </View>
                  {r.notes && <Text style={styles.recordNotes}>{r.notes}</Text>}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  filterCard: { backgroundColor: COLORS.bgLight, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight },
  filterTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  dateRow: { flexDirection: 'row', marginBottom: 12 },
  flex1:   { flex: 1 },
  label:   { fontSize: 12, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  input:   { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  filterBtn: { backgroundColor: COLORS.brandOrange, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  filterBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryVehicle: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  summaryPlate: { fontSize: 13, fontWeight: '700', color: COLORS.brandOrange },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox:  { flex: 1, backgroundColor: COLORS.brandYellow, borderRadius: 10, padding: 10, alignItems: 'center' },
  statValue:{ fontSize: 16, fontWeight: '700', color: COLORS.black },
  statLabel:{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  recordCard: { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  recordVehicle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  recordDate: { fontSize: 12, color: COLORS.textMuted },
  recordPlate: { fontSize: 12, fontWeight: '700', color: COLORS.brandOrange, marginBottom: 6 },
  recordStats: { flexDirection: 'row', gap: 12 },
  recordStat: { fontSize: 12, color: COLORS.textDark },
  recordNotes: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, fontStyle: 'italic' },
});
