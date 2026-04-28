import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getLearningQuizAnalytics } from '../../../services/learningApi';

export default function AdminQuizAnalyticsScreen({ route, navigation }) {
  const { quizId, quizTitle } = route.params || {};

  // Validate required params
  React.useEffect(() => {
    if (!quizId) {
      Alert.alert('Error', 'Quiz ID is required');
      navigation.goBack();
    }
  }, [quizId, navigation]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!quizId) return;
    try {
      const res = await getLearningQuizAnalytics(quizId);
      setData(res.data);
    } catch {
      Alert.alert('Error', 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const cards = [
    { label: 'Total attempts', value: data?.totalAttempts ?? 0, icon: 'people-outline' },
    { label: 'Average score', value: `${Math.round((data?.averageScore ?? 0) * 10) / 10}%`, icon: 'analytics-outline' },
    { label: 'Highest score', value: `${Math.round((data?.highestScore ?? 0) * 10) / 10}%`, icon: 'trending-up-outline' },
    { label: 'Lowest score', value: `${Math.round((data?.lowestScore ?? 0) * 10) / 10}%`, icon: 'trending-down-outline' },
    { label: 'Pass count', value: data?.passCount ?? 0, icon: 'checkmark-circle-outline' },
    { label: 'Fail count', value: data?.failCount ?? 0, icon: 'close-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{quizTitle || data?.quiz?.title || 'Quiz Analytics'}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setLoading(true); load(); }}>
          <Ionicons name="refresh-outline" size={20} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pass mark</Text>
          <Text style={styles.summaryValue}>{data?.quiz?.passMark ?? 0}%</Text>
          <Text style={styles.summaryMeta}>Generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : '-'}</Text>
        </View>

        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={styles.statCard}>
              <Ionicons name={c.icon} size={18} color={COLORS.brandOrange} />
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.black, textAlign: 'center' },
  refreshBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: { backgroundColor: COLORS.brandYellow, borderRadius: 16, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  summaryValue: { fontSize: 28, fontWeight: '900', color: COLORS.black, marginTop: 4 },
  summaryMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 6 },
  statValue: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  statLabel: { fontSize: 11, color: COLORS.textMuted },
});

