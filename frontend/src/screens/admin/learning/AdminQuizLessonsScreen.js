import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getLearningLessons, getLearningQuizzes } from '../../../services/learningApi';

export default function AdminQuizLessonsScreen({ navigation }) {
  const [lessons, setLessons] = useState([]);
  const [quizCounts, setQuizCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [lessonsRes, quizzesRes] = await Promise.all([
        getLearningLessons(),
        getLearningQuizzes(),
      ]);
      setLessons(lessonsRes.data || []);
      
      // Count quizzes by language for each lesson
      const counts = {};
      (quizzesRes.data || []).forEach((q) => {
        const lid = q.lesson?._id || q.lesson;
        if (!lid) return;
        
        if (!counts[lid]) {
          counts[lid] = { total: 0, en: 0, si: 0, both: 0 };
        }
        counts[lid].total += 1;
        
        // Count by language
        const lang = q.language || 'en';
        if (lang === 'en') counts[lid].en += 1;
        else if (lang === 'si') counts[lid].si += 1;
        else if (lang === 'both') {
          counts[lid].both += 1;
          counts[lid].en += 1;
          counts[lid].si += 1;
        }
      });
      setQuizCounts(counts);
    } catch {
      Alert.alert('Error', 'Could not load lessons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredLessons = lessons.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.topic?.title?.toLowerCase().includes(q)
    );
  });

  const grouped = filteredLessons.reduce((acc, lesson) => {
    // Skip lessons without topics and without quizzes
    const qCount = quizCounts[lesson._id];
    const hasTopic = lesson.topic?._id || lesson.topic;
    if (!hasTopic && !qCount?.total) return acc; // Skip empty lessons
    
    const topicTitle = lesson.topic?.title || 'No Topic';
    const topicId = lesson.topic?._id || 'none';
    if (!acc[topicId]) acc[topicId] = { topicTitle, lessons: [] };
    acc[topicId].lessons.push(lesson);
    return acc;
  }, {});

  const sections = Object.values(grouped);

  const renderLesson = (lesson) => {
    const qCount = quizCounts[lesson._id] || { total: 0, en: 0, si: 0 };
    const hasQuizzes = qCount.total > 0;
    const hasEnglish = qCount.en > 0;
    const hasSinhala = qCount.si > 0;
    
    return (
      <TouchableOpacity
        key={lesson._id}
        style={styles.lessonCard}
        onPress={() => navigation.navigate('AdminLessonQuizzes', {
          lessonId: lesson._id,
          lessonTitle: lesson.title,
          topicTitle: lesson.topic?.title || '',
        })}
        activeOpacity={0.75}
      >
        <View style={[styles.lessonIcon, hasQuizzes && styles.lessonIconHasQuiz]}>
          <Ionicons
            name={hasQuizzes ? 'help-circle' : 'help-circle-outline'}
            size={20}
            color={hasQuizzes ? COLORS.white : COLORS.brandOrange}
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
          <View style={styles.badgeRow}>
            {/* Quiz count summary by language */}
            {hasQuizzes ? (
              <>
                <View style={[styles.badge, styles.badgeHasQuiz]}>
                  <Ionicons name="help-circle-outline" size={10} color={COLORS.brandOrange} />
                  <Text style={[styles.badgeText, { color: COLORS.brandOrange }]}>
                    {qCount.total} total
                  </Text>
                </View>
                {hasEnglish && (
                  <View style={[styles.badge, styles.badgeEnglish]}>
                    <Text style={styles.badgeEnglishText}>En : {qCount.en}</Text>
                  </View>
                )}
                {hasSinhala && (
                  <View style={[styles.badge, styles.badgeSinhala]}>
                    <Text style={styles.badgeSinhalaText}>Si : {qCount.si}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.badge}>
                <Ionicons name="help-circle-outline" size={10} color={COLORS.textMuted} />
                <Text style={styles.badgeText}>No quizzes</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>{lesson.estimatedDuration || 0} min</Text>
            </View>
            <View style={[styles.badge, lesson.status === 'Published' ? styles.badgePublished : null]}>
              <Text style={[styles.badgeText, lesson.status === 'Published' ? styles.badgePublishedText : null]}>
                {lesson.status}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quiz</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search lesson or topic..."
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sections}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="help-circle-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No lessons found</Text>
          </View>
        }
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder-outline" size={14} color={COLORS.brandOrange} />
              <Text style={styles.sectionTitle}>{section.topicTitle}</Text>
            </View>
            {section.lessons.map(renderLesson)}
          </View>
        )}
      />
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
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 4,
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.black },
  list: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.brandOrange, textTransform: 'uppercase', letterSpacing: 0.5 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonIconHasQuiz: { backgroundColor: COLORS.brandOrange },
  flex1: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.bgLight, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.border },
  badgeHasQuiz: { borderColor: COLORS.brandOrange, backgroundColor: '#FFF7ED' },
  badgeEnglish: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  badgeEnglishText: { fontSize: 10, fontWeight: '700', color: '#3B82F6' },
  badgeSinhala: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  badgeSinhalaText: { fontSize: 10, fontWeight: '700', color: '#F97316' },
  badgeText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  badgePublished: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  badgePublishedText: { color: '#16A34A' },
  arrowBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});
