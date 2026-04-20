import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStaffPerformance } from '../../../services/api';
import { COLORS } from '../../../theme';

const DEPARTMENTS = ['All', 'Administration', 'Accounts', 'Operations', 'Customer Service', 'HR', 'IT Support'];

const getRatingColor = (value, max) => {
  const pct = value / max;
  if (pct >= 0.8) return COLORS.green;
  if (pct >= 0.5) return COLORS.brandOrange;
  return COLORS.red;
};

export default function StaffPerformanceScreen({ navigation }) {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [department, setDepartment] = useState('All');
  const [month,      setMonth]      = useState(String(new Date().getMonth() + 1));
  const [year,       setYear]       = useState(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    try {
      const params = { month, year };
      if (department !== 'All') params.department = department;
      const res = await getStaffPerformance(params);
      setData(res.data.performance || []);
    } catch {
      Alert.alert('Error', 'Could not load performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department, month, year]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }) => {
    const att = item.attendance;
    const attendanceRate = att && att.totalDays > 0
      ? Math.round(((att.presentDays + att.lateDays * 0.5) / att.totalDays) * 100)
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.fullName || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.meta}>{item.employeeId} · {item.position || item.department}</Text>
          </View>
        </View>

        {att ? (
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: getRatingColor(att.presentDays, att.totalDays || 1) }]}>
                {att.presentDays || 0}
              </Text>
              <Text style={styles.metricLbl}>Present Days</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: COLORS.brandOrange }]}>
                {att.lateDays || 0}
              </Text>
              <Text style={styles.metricLbl}>Late Days</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: COLORS.blue }]}>
                {att.totalWorkHours ? att.totalWorkHours.toFixed(1) : '0'}h
              </Text>
              <Text style={styles.metricLbl}>Work Hours</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: COLORS.purple }]}>
                {att.totalOvertimeHours ? att.totalOvertimeHours.toFixed(1) : '0'}h
              </Text>
              <Text style={styles.metricLbl}>Overtime</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No attendance data for this period</Text>
          </View>
        )}

        {att && (
          <View style={styles.performanceRow}>
            <View style={styles.perfItem}>
              <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.green} />
              <Text style={styles.perfText}>{att.totalTasksCompleted || 0} tasks</Text>
            </View>
            <View style={styles.perfItem}>
              <Ionicons name="speedometer-outline" size={15} color={COLORS.blue} />
              <Text style={styles.perfText}>
                {att.avgEfficiency ? att.avgEfficiency.toFixed(0) : 0}% efficiency
              </Text>
            </View>
            <View style={styles.perfItem}>
              <Ionicons name="star-outline" size={15} color={COLORS.brandOrange} />
              <Text style={styles.perfText}>
                {att.avgCustomerRating ? att.avgCustomerRating.toFixed(1) : '—'} / 5 rating
              </Text>
            </View>
            {attendanceRate !== null && (
              <View style={[styles.rateBadge, { backgroundColor: getRatingColor(attendanceRate, 100) + '20' }]}>
                <Text style={[styles.rateText, { color: getRatingColor(attendanceRate, 100) }]}>
                  {attendanceRate}% attendance
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Staff Performance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period filter */}
      <View style={styles.periodRow}>
        <View style={styles.periodInput}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <TextInput
            style={styles.periodText}
            value={month}
            onChangeText={setMonth}
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.periodSep}>/</Text>
          <TextInput
            style={[styles.periodText, { width: 50 }]}
            value={year}
            onChangeText={setYear}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <TouchableOpacity style={styles.filterApply} onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.filterApplyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Department chips */}
      <FlatList
        data={DEPARTMENTS}
        horizontal
        keyExtractor={d => d}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.deptRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deptBtn, department === item && styles.deptBtnActive]}
            onPress={() => setDepartment(item)}
          >
            <Text style={[styles.deptText, department === item && styles.deptTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={data}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={52} color={COLORS.brandOrange} />
            <Text style={styles.emptyTitle}>No performance data</Text>
            <Text style={styles.emptySub}>Try a different month or department</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.white },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:        { fontSize: 18, fontWeight: '600', color: COLORS.black },
  periodRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  periodInput:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgLight, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 8 },
  periodText:   { fontSize: 14, color: COLORS.black, width: 30 },
  periodSep:    { fontSize: 14, color: COLORS.textMuted },
  filterApply:  { backgroundColor: COLORS.brandYellow, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  filterApplyText: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  deptRow:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  deptBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.bgLight },
  deptBtnActive:{ backgroundColor: COLORS.brandYellow },
  deptText:     { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  deptTextActive:{ color: COLORS.black, fontWeight: '700' },
  list:         { padding: 16, paddingBottom: 40 },
  card:         { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 15, fontWeight: '700', color: COLORS.black },
  flex1:        { flex: 1 },
  name:         { fontSize: 15, fontWeight: '700', color: COLORS.black },
  meta:         { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  metricsGrid:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metricBox:    { alignItems: 'center', flex: 1 },
  metricVal:    { fontSize: 20, fontWeight: '800' },
  metricLbl:    { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  performanceRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  perfItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  perfText:     { fontSize: 12, color: COLORS.textDark },
  rateBadge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  rateText:     { fontSize: 11, fontWeight: '700' },
  noData:       { paddingVertical: 12, alignItems: 'center' },
  noDataText:   { fontSize: 13, color: COLORS.textMuted },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: COLORS.black },
  emptySub:     { fontSize: 13, color: COLORS.textMuted },
});
