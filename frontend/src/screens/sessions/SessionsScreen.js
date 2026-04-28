import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSessions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

const TABS = ['Upcoming', 'Past', 'All'];

const STATUS_COLOR = {
  Scheduled: { bg: COLORS.blueBg,     text: COLORS.blue   },
  Ongoing:   { bg: '#FFF3CD',          text: '#856404'     },
  Completed: { bg: COLORS.greenBg,    text: COLORS.green  },
  Cancelled: { bg: COLORS.redBg,      text: COLORS.red    },
};

export default function SessionsScreen({ navigation }) {
  const { user } = useAuth();
  const [sessions,  setSessions]  = useState([]);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await getSessions({ instructor: user._id });
      setSessions(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (activeTab === 'Upcoming') return s.status === 'Scheduled' || s.status === 'Ongoing';
    if (activeTab === 'Past')     return s.status === 'Completed' || s.status === 'Cancelled';
    return true;
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{sessions.length} total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'Upcoming' ? 'No upcoming sessions' : activeTab === 'Past' ? 'No past sessions' : 'No sessions assigned'}
            </Text>
          </View>
        ) : (
          filtered.map((s) => {
            const colors = STATUS_COLOR[s.status] || { bg: COLORS.gray, text: COLORS.textMuted };
            const spots   = s.maxStudents - (s.enrolledStudents?.length || 0);
            return (
              <View key={s._id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <View style={styles.typePill}>
                      <Ionicons
                        name={s.sessionType === 'Theory' ? 'book-outline' : 'car-outline'}
                        size={12}
                        color={s.sessionType === 'Theory' ? COLORS.blue : COLORS.black}
                      />
                      <Text style={[styles.typeText, { color: s.sessionType === 'Theory' ? COLORS.blue : COLORS.black }]}>
                        {s.sessionType}
                      </Text>
                    </View>
                    <Text style={styles.sessionDate}>
                      {new Date(s.date).toDateString()}
                    </Text>
                    <Text style={styles.sessionTime}>{s.startTime} – {s.endTime}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>{s.status}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.sessionMeta}>
                    {s.enrolledStudents?.length || 0}/{s.maxStudents} students · {spots} spot{spots !== 1 ? 's' : ''} left
                  </Text>
                </View>
                {s.vehicle && (
                  <View style={styles.metaRow}>
                    <Ionicons name="car-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.sessionMeta}>
                      {s.vehicle.brand} {s.vehicle.model} · {s.vehicle.licensePlate}
                    </Text>
                  </View>
                )}
                {s.notes ? (
                  <View style={styles.notesRow}>
                    <Ionicons name="document-text-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.notesText} numberOfLines={2}>{s.notes}</Text>
                  </View>
                ) : null}
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
  title:         { fontSize: 24, fontWeight: '600', color: COLORS.black },
  countBadge:    { backgroundColor: COLORS.brandYellow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  countText:     { fontSize: 12, fontWeight: '700', color: COLORS.black },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgLight,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab:           { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive:     { backgroundColor: COLORS.brandYellow },
  tabText:       { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.black, fontWeight: '700' },
  content:       { padding: 20, paddingBottom: 40 },
  empty:         { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '500', color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft:    { flex: 1 },
  typePill:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: COLORS.bgLight, marginBottom: 6 },
  typeText:    { fontSize: 11, fontWeight: '700' },
  sessionDate: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  sessionTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sessionMeta: { fontSize: 12, color: COLORS.textMuted },
  notesRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, padding: 8, backgroundColor: COLORS.bgLight, borderRadius: 8 },
  notesText:   { flex: 1, fontSize: 12, color: COLORS.textMuted },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText:   { fontSize: 11, fontWeight: '700' },
});
