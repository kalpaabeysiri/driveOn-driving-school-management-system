import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAnalytics } from '../../services/sessionApi';
import { COLORS } from '../../theme';

export default function AttendanceAnalyticsScreen({ navigation }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data: res } = await getAnalytics(typeFilter ? { sessionType: typeFilter } : {});
        setData(res);
      } catch {
        Alert.alert('Error', 'Could not load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [typeFilter]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const rate = data?.overall?.rate || 0;
  const rateColor = rate >= 75 ? COLORS.green : rate >= 50 ? '#856404' : COLORS.red;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Filter */}
        <View style={styles.filterRow}>
          {['', 'Theory', 'Practical'].map(t => (
            <TouchableOpacity key={t} style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]} onPress={() => setTypeFilter(t)}>
              <Text style={[styles.filterText, typeFilter === t && styles.filterTextActive]}>{t || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overall attendance rate */}
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Overall Attendance Rate</Text>
          <Text style={[styles.rateValue, { color: rateColor }]}>{rate}%</Text>
          <View style={styles.rateBar}>
            <View style={[styles.rateFill, { width: `${rate}%`, backgroundColor: rateColor }]} />
          </View>
          <Text style={styles.rateSubtext}>{data?.totalSessions || 0} sessions tracked</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Records', value: data?.overall?.total   || 0, bg: COLORS.bgLight    },
            { label: 'Present',       value: data?.overall?.present || 0, bg: COLORS.greenBg    },
            { label: 'Late',          value: data?.overall?.late    || 0, bg: '#FFF3CD'         },
            { label: 'Absent',        value: data?.overall?.absent  || 0, bg: COLORS.redBg      },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Top students */}
        {data?.topStudents?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🏆 Top Attendance</Text>
            {data.topStudents.map((item, i) => (
              <TouchableOpacity
                key={item.student?._id}
                style={styles.studentCard}
                onPress={() => navigation.navigate('StudentProgress', { studentId: item.student?._id })}
              >
                <View style={[styles.rank, { backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.studentName}>{item.student?.firstName} {item.student?.lastName}</Text>
                  <Text style={styles.studentMeta}>{item.present}/{item.total} sessions attended</Text>
                </View>
                <Text style={[styles.rateText, { color: COLORS.green }]}>{item.rate}%</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Low attendance */}
        {data?.lowAttendance?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: COLORS.red, marginTop: 20 }]}>
              ⚠️ Low Attendance (Below 50%)
            </Text>
            {data.lowAttendance.map(item => (
              <TouchableOpacity
                key={item.student?._id}
                style={[styles.studentCard, styles.lowCard]}
                onPress={() => navigation.navigate('StudentProgress', { studentId: item.student?._id })}
              >
                <View style={styles.warnIcon}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.red} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.studentName}>{item.student?.firstName} {item.student?.lastName}</Text>
                  <Text style={styles.studentMeta}>{item.present}/{item.total} sessions attended</Text>
                </View>
                <Text style={[styles.rateText, { color: COLORS.red }]}>{item.rate}%</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {data?.overall?.total === 0 && (
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No attendance data yet</Text>
            <Text style={styles.emptySubtext}>Start taking attendance for sessions</Text>
          </View>
        )}
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
  filterRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgLight },
  filterBtnActive: { backgroundColor: COLORS.brandYellow },
  filterText:      { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive:{ color: COLORS.black, fontWeight: '700' },
  rateCard:  { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 20, alignItems: 'center', marginBottom: 16 },
  rateLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  rateValue: { fontSize: 52, fontWeight: '800', marginBottom: 12 },
  rateBar:   { width: '100%', height: 10, backgroundColor: COLORS.bgLight, borderRadius: 5, marginBottom: 8, overflow: 'hidden' },
  rateFill:  { height: 10, borderRadius: 5 },
  rateSubtext: { fontSize: 12, color: COLORS.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard:  { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.black },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 10 },
  studentCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  lowCard:       { borderColor: COLORS.red, backgroundColor: '#FFF8F8' },
  rank:          { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankText:      { fontSize: 13, fontWeight: '800', color: COLORS.black },
  warnIcon:      { backgroundColor: COLORS.redBg, borderRadius: 8, padding: 7 },
  flex1:         { flex: 1 },
  studentName:   { fontSize: 14, fontWeight: '600', color: COLORS.black },
  studentMeta:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rateText:      { fontSize: 16, fontWeight: '800' },
  empty:         { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText:     { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
  emptySubtext:  { fontSize: 13, color: COLORS.textMuted },
});
