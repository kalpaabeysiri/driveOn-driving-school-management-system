import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';

export default function QuizResultScreen({ route, navigation }) {
  const { result, quizTitle } = route.params;

  const passed = result?.status === 'Passed';
  const score = result?.percentage ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={COLORS.black} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Result</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.scoreCircle, { backgroundColor: passed ? COLORS.brandYellow : COLORS.redBg }]}>
          <Text style={styles.scoreValue}>{Math.round(score)}%</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>

        <Text style={styles.resultTitle}>{passed ? 'Passed' : 'Failed'}</Text>
        <Text style={styles.resultSub}>{quizTitle || 'Quiz'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result?.scoreObtained ?? 0}</Text>
            <Text style={styles.statLabel}>Marks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result?.totalScore ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result?.attemptNumber ?? 1}</Text>
            <Text style={styles.statLabel}>Attempt</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.primaryBtnText}>Back to Learning</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 16 },
  scoreValue: { fontSize: 36, fontWeight: '900', color: COLORS.black },
  scoreLabel: { fontSize: 12, color: COLORS.textMuted },
  resultTitle: { fontSize: 22, fontWeight: '900', color: COLORS.black },
  resultSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 18, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  statValue: { fontSize: 18, fontWeight: '900', color: COLORS.black },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  primaryBtn: { width: '100%', backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '900', color: COLORS.white },
});

