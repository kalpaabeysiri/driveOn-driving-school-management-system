import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSessions, deleteSession, updateSession } from '../../services/sessionApi';
import { COLORS } from '../../theme';

const STATUS_COLORS = {
  Scheduled: { bg: COLORS.blueBg,  text: COLORS.blue  },
  Ongoing:   { bg: '#FFF3CD',      text: '#856404'    },
  Completed: { bg: COLORS.greenBg, text: COLORS.green  },
  Cancelled: { bg: COLORS.redBg,   text: COLORS.red    },
};

export default function AdminSessionListScreen({ navigation }) {
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchSessions = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'All')     params.status      = filter;
      if (typeFilter !== 'All') params.sessionType = typeFilter;
      const { data } = await getSessions(params);
      setSessions(data);
    } catch {
      Alert.alert('Error', 'Could not load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleDelete = (session) => {
    Alert.alert('Delete Session', `Delete this ${session.sessionType} session?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteSession(session._id); fetchSessions(); }
          catch { Alert.alert('Error', 'Could not delete session'); }
        },
      },
    ]);
  };

  const handleMarkCompleted = (session) => {
    if (session.status === 'Completed') return;

    Alert.alert('Mark as Completed', 'Are you sure you want to mark this session as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Completed',
        onPress: async () => {
          try {
            await updateSession(session._id, { status: 'Completed' });
            fetchSessions();
          } catch {
            Alert.alert('Error', 'Could not update session status');
          }
        },
      },
    ]);
  };

  const handleMarkCancelled = (session) => {
    if (session.status === 'Cancelled') return;

    Alert.alert('Mark as Cancelled', 'Are you sure you want to cancel this session?', [
      { text: 'Keep Session', style: 'cancel' },
      {
        text: 'Mark Cancelled',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateSession(session._id, { status: 'Cancelled' });
            fetchSessions();
          } catch {
            Alert.alert('Error', 'Could not update session status');
          }
        },
      },
    ]);
  };

  const renderSession = ({ item }) => {
    const colors = STATUS_COLORS[item.status] || { bg: COLORS.gray, text: COLORS.textMuted };
    const spots  = item.maxStudents - (item.enrolledStudents?.length || 0);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SessionEnrollment', { sessionId: item._id })}
      >
        <View style={[styles.typeTag, { backgroundColor: item.sessionType === 'Theory' ? COLORS.blueBg : COLORS.brandYellow }]}>
          <Text style={[styles.typeTagText, { color: item.sessionType === 'Theory' ? COLORS.blue : COLORS.black }]}>
            {item.sessionType}
          </Text>
        </View>
        <View style={styles.flex1}>
          <Text style={styles.dateText}>{new Date(item.date).toDateString()}</Text>
          <Text style={styles.timeText}>{item.startTime} – {item.endTime}</Text>
          <Text style={styles.meta}>Instructor: {item.instructor?.fullName || 'TBA'}</Text>
          {item.sessionType === 'Practical' && item.vehicle && (
            <Text style={styles.meta}>
              Vehicle: {item.vehicle.brand} {item.vehicle.model} · {item.vehicle.licensePlate}
            </Text>
          )}
          <View style={styles.infoRow}>
            <View style={styles.spotsBox}>
              <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.spotsText}>
                {item.enrolledStudents?.length || 0}/{item.maxStudents} · {spots} spots left
              </Text>
            </View>
            {item.averageRating > 0 && (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.ratingText}>{item.averageRating}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
          </View>
          <View style={styles.actionBtns}>
  <TouchableOpacity
    style={styles.iconBtn}
    onPress={() => navigation.navigate('SessionEnrollment', { sessionId: item._id })}
  >
    <Ionicons name="people-outline" size={18} color={COLORS.green} />
  </TouchableOpacity>
  {(item.enrolledStudents?.length > 0) && item.status !== 'Cancelled' && (
    <TouchableOpacity
      style={[styles.iconBtn, { backgroundColor: COLORS.brandYellow }]}
      onPress={() => navigation.navigate('TakeAttendance', { sessionId: item._id })}
    >
      <Ionicons name="clipboard-outline" size={18} color={COLORS.black} />
    </TouchableOpacity>
  )}
  <TouchableOpacity
    style={styles.iconBtn}
    onPress={() => navigation.navigate('AddEditSession', { sessionId: item._id })}
  >
    <Ionicons name="create-outline" size={18} color={COLORS.blue} />
  </TouchableOpacity>
  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
  </TouchableOpacity>
</View>
          {item.status !== 'Completed' && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleMarkCompleted(item)}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={COLORS.green} />
              <Text style={styles.completeBtnText}>Mark Completed</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'Cancelled' && (
            <TouchableOpacity
              style={styles.cancelStatusBtn}
              onPress={() => handleMarkCancelled(item)}
            >
              <Ionicons name="close-circle-outline" size={14} color={COLORS.red} />
              <Text style={styles.cancelStatusBtnText}>Mark Cancelled</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
        <Text style={styles.title}>Sessions</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('SessionReport')}>
            <Ionicons name="bar-chart-outline" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddEditSession')}>
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        {['All', 'Theory', 'Practical'].map((t) => (
          <TouchableOpacity key={t} style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]} onPress={() => setTypeFilter(t)}>
            <Text style={[styles.filterText, typeFilter === t && styles.filterTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{sessions.length} sessions</Text>
      </View>

      {/* Status filter */}
      <View style={[styles.filterRow, { marginTop: 0 }]}>
        {['All', 'Scheduled', 'Completed', 'Cancelled'].map((s) => (
          <TouchableOpacity key={s} style={[styles.filterBtn, filter === s && styles.filterBtnActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No sessions found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:   { fontSize: 24, fontWeight: '600', color: COLORS.black },
  headerBtns: { flexDirection: 'row', gap: 10 },
  reportBtn:  { backgroundColor: COLORS.white, borderRadius: 12, padding: 8 },
  addBtn:     { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  filterRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  filterBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bgLight },
  filterBtnActive: { backgroundColor: COLORS.brandYellow },
  filterText:      { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive:{ color: COLORS.black, fontWeight: '700' },
  count:   { marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted },
  list:    { padding: 16, paddingBottom: 40 },
  card:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  typeTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  flex1:   { flex: 1 },
  dateText:{ fontSize: 14, fontWeight: '600', color: COLORS.black },
  timeText:{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  meta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  spotsBox:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotsText:{ fontSize: 11, color: COLORS.textMuted },
  ratingBox:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:{ fontSize: 11, fontWeight: '700', color: '#856404' },
  actions: { alignItems: 'flex-end', gap: 6 },
  badge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:{ fontSize: 10, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: 4 },
  completeBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completeBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.green },
  cancelStatusBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelStatusBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.red },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: COLORS.bgLight },
  empty:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:{ fontSize: 15, color: COLORS.textMuted },
});
