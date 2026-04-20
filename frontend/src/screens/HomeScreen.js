import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getSessions, getProgress } from '../services/api';
import { COLORS } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [sessions,  setSessions]  = useState([]);
  const [progress,  setProgress]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, p] = await Promise.all([getSessions(), getProgress()]);
        setSessions(s.data);
        setProgress(p.data);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcoming = sessions.filter(s => s.status !== 'Completed' && s.status !== 'Cancelled');
  const done     = sessions.filter(s => s.status === 'Completed');
  const avgScore = progress.length
    ? Math.round(progress.reduce((a, b) => a + b.score, 0) / progress.length)
    : 0;

  const nextSession = upcoming[0];

  // ── Quick Actions — admin sees Students button, student doesn't ──
  const quickActions = [
    { icon: 'calendar-outline', label: 'Book Session', screen: 'BookSession' },
    { icon: 'school-outline',   label: 'Take Quiz',    screen: 'Learning' },
    { icon: 'card-outline',     label: 'Pay Now',      screen: 'Payments', tab: true },
    { icon: 'person-outline',   label: 'Profile',      screen: 'Account' },
   ...(user?.role === 'admin'
  ? [
      { icon: 'people-outline',  label: 'Students',    screen: 'StudentList'    },
      { icon: 'person-outline',  label: 'Instructors', screen: 'InstructorList' },
      { icon: 'car-outline',     label: 'Vehicles',    screen: 'VehicleList'    },
      { icon: 'calendar-outline',  label: 'Sessions', screen: 'AdminSessions'   }, // ← ADD THIS
    ]
  : []
),
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <Text style={styles.welcome}>Welcome, {(user?.name || 'User').split(' ')[0]}! 👋</Text>
        <Text style={styles.subtitle}>Here's your driving progress overview.</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Sessions Done', value: done.length },
            { label: 'Upcoming',      value: upcoming.length },
            { label: 'Avg Quiz Score',value: `${avgScore}%` },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Next Session */}
        {nextSession ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NEXT SESSION</Text>
            <Text style={styles.sessionType}>{nextSession.type} Session</Text>
            <Text style={styles.sessionMeta}>
              {new Date(nextSession.date).toDateString()} · {nextSession.startTime}
            </Text>
            <Text style={styles.sessionMeta}>
              Instructor: {nextSession.instructor?.name || 'TBA'}
            </Text>
            <View style={[styles.badge, { backgroundColor: COLORS.blueBg }]}>
              <Text style={[styles.badgeText, { color: COLORS.blue }]}>{nextSession.status}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NEXT SESSION</Text>
            <Text style={styles.sessionMeta}>No upcoming sessions</Text>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => navigation.navigate('BookSession')}
            >
              <Text style={styles.bookBtnText}>Book a Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => action.tab ? navigation.jumpTo(action.screen) : navigation.navigate(action.screen)}
            >
              <Ionicons name={action.icon} size={24} color={COLORS.brandOrange} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Quiz Results */}
        {progress.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Quiz Results</Text>
            {progress.slice(0, 3).map((p) => (
              <View key={p._id} style={styles.resultRow}>
                <View>
                  <Text style={styles.resultTitle}>{p.quiz?.title || 'Quiz'}</Text>
                  <Text style={styles.resultMeta}>{new Date(p.completedAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.scoreBadge, {
                  backgroundColor: p.passed ? COLORS.greenBg : COLORS.redBg,
                }]}>
                  <Text style={[styles.scoreText, {
                    color: p.passed ? COLORS.green : COLORS.red,
                  }]}>{p.score}%</Text>
                </View>
              </View>
            ))}
          </>
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
  logo:        { fontSize: 28, fontWeight: '800' },
  notifBtn:    { padding: 4 },
  content:     { padding: 20, paddingBottom: 40 },
  welcome:     { fontSize: 22, fontWeight: '600', color: COLORS.black, marginTop: 4 },
  subtitle:    { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue:    { fontSize: 22, fontWeight: '700', color: COLORS.black },
  statLabel:    { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    gap: 6,
  },
  cardLabel:    { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5 },
  sessionType:  { fontSize: 17, fontWeight: '600', color: COLORS.black },
  sessionMeta:  { fontSize: 13, color: COLORS.textMuted },
  badge:        { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  bookBtn: {
    marginTop: 8,
    backgroundColor: COLORS.brandOrange,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookBtnText:  { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  actionsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.bgLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actionLabel:  { fontSize: 12, fontWeight: '600', color: COLORS.black },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  resultTitle:  { fontSize: 14, fontWeight: '600', color: COLORS.black },
  resultMeta:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  scoreBadge:   { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  scoreText:    { fontSize: 14, fontWeight: '700' },
});