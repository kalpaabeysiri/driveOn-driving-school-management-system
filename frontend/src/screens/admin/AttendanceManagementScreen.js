import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../theme';
import { getSessions, getAnalytics } from '../../services/sessionApi';

const AttendanceManagementScreen = ({ navigation }) => {
  const [typeFilter, setTypeFilter] = useState('All');
  const [sessions,   setSessions]   = useState([]);
  const [analytics,  setAnalytics]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const loadData = async () => {
    try {
      const params = typeFilter !== 'All' ? { sessionType: typeFilter } : {};
      const [sessRes, analRes] = await Promise.all([
        getSessions(params),
        getAnalytics(typeFilter !== 'All' ? { sessionType: typeFilter } : {}),
      ]);
      setSessions(sessRes.data || []);
      setAnalytics(analRes.data || null);
    } catch {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  const filteredSessions = sessions.filter(s =>
    !searchQuery ||
    s.instructor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(s.date).toDateString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const STATUS_COLORS = {
    Scheduled: { bg: COLORS.blueBg,  text: COLORS.blue  },
    Completed: { bg: COLORS.greenBg, text: COLORS.green  },
    Cancelled: { bg: COLORS.redBg,   text: COLORS.red    },
    Ongoing:   { bg: '#FFF3CD',      text: '#856404'     },
  };

  const renderSession = ({ item }) => {
    const colors = STATUS_COLORS[item.status] || { bg: COLORS.bgLight, text: COLORS.textMuted };
    const hasStudents = (item.enrolledStudents?.length || 0) > 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeTag, { backgroundColor: item.sessionType === 'Theory' ? COLORS.blueBg : COLORS.brandYellow }]}>
            <Text style={[styles.typeTagText, { color: item.sessionType === 'Theory' ? COLORS.blue : COLORS.black }]}>
              {item.sessionType}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.sessionDate}>{new Date(item.date).toDateString()}</Text>
        <Text style={styles.sessionTime}>{item.startTime} – {item.endTime}</Text>
        <Text style={styles.sessionMeta}>Instructor: {item.instructor?.fullName || 'TBA'}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.studentsBox}>
            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.studentsText}>{item.enrolledStudents?.length || 0} students</Text>
          </View>
          {hasStudents && item.status !== 'Cancelled' && (
            <TouchableOpacity
              style={styles.attendBtn}
              onPress={() => navigation.navigate('TakeAttendance', { sessionId: item._id })}
            >
              <Ionicons name="clipboard-outline" size={15} color={COLORS.black} />
              <Text style={styles.attendBtnText}>Take Attendance</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <Text style={styles.headerTitle}>Attendance Management</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AttendanceAnalytics')}>
          <Ionicons name="bar-chart-outline" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      {analytics && (
        <View style={styles.statsRow}>
          {[
            { label: 'Rate',    value: `${analytics.overall?.rate || 0}%`, color: COLORS.brandOrange },
            { label: 'Present', value: analytics.overall?.present || 0,    color: COLORS.green },
            { label: 'Absent',  value: analytics.overall?.absent  || 0,    color: COLORS.red },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Type filter */}
      <View style={styles.filterRow}>
        {['All', 'Theory', 'Practical'].map(t => (
          <TouchableOpacity key={t} style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]} onPress={() => setTypeFilter(t)}>
            <Text style={[styles.filterText, typeFilter === t && styles.filterTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search sessions..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>

      <FlatList
        data={filteredSessions}
        keyExtractor={item => item._id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No sessions found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  statsRow:    { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:    { flex: 1, backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue:   { fontSize: 22, fontWeight: '800' },
  statLabel:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  filterRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterBtn:   { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.bgLight },
  filterBtnActive: { backgroundColor: COLORS.brandYellow },
  filterText:      { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive:{ color: COLORS.black, fontWeight: '700' },
  searchSection: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput:   { flex: 1, fontSize: 14, color: COLORS.black },
  list:          { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeTag:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeTagText:  { fontSize: 11, fontWeight: '700' },
  badge:        { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { fontSize: 10, fontWeight: '700' },
  sessionDate:  { fontSize: 14, fontWeight: '600', color: COLORS.black },
  sessionTime:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sessionMeta:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2, marginBottom: 10 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  studentsBox:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  studentsText: { fontSize: 12, color: COLORS.textMuted },
  attendBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandYellow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  attendBtnText:{ fontSize: 12, fontWeight: '700', color: COLORS.black },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 15, color: COLORS.textMuted },
});

export default AttendanceManagementScreen;
