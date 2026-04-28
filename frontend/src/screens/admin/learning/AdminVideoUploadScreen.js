import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getLearningLessons, getVideoTutorials } from '../../../services/learningApi';

export default function AdminVideoUploadScreen({ navigation }) {
  const [lessons, setLessons] = useState([]);
  const [videoCounts, setVideoCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [lessonsRes, videosRes] = await Promise.all([
        getLearningLessons(),
        getVideoTutorials(),
      ]);
      setLessons(lessonsRes.data || []);
      const counts = {};
      (videosRes.data || []).forEach((v) => {
        const lid = v.lesson?._id || v.lesson;
        if (lid) counts[lid] = (counts[lid] || 0) + 1;
      });
      setVideoCounts(counts);
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

  // Group lessons by topic
  const grouped = filteredLessons.reduce((acc, lesson) => {
    // Skip lessons without topics and without videos
    const vCount = videoCounts[lesson._id] || 0;
    const hasTopic = lesson.topic?._id || lesson.topic;
    if (!hasTopic && vCount === 0) return acc; // Skip empty lessons
    
    const topicTitle = lesson.topic?.title || 'No Topic';
    const topicId = lesson.topic?._id || 'none';
    if (!acc[topicId]) acc[topicId] = { topicTitle, lessons: [] };
    acc[topicId].lessons.push(lesson);
    return acc;
  }, {});

  const sections = Object.values(grouped);

  const renderLesson = (lesson) => {
    const vCount = videoCounts[lesson._id] || 0;
    const hasVideos = vCount > 0;
    return (
      <TouchableOpacity
        key={lesson._id}
        style={styles.lessonCard}
        onPress={() => navigation.navigate('AdminLessonVideos', {
          lessonId: lesson._id,
          lessonTitle: lesson.title,
          topicTitle: lesson.topic?.title || '',
        })}
        activeOpacity={0.75}
      >
        <View style={[styles.lessonIcon, hasVideos && styles.lessonIconHasVideo]}>
          <Ionicons name={hasVideos ? 'film' : 'videocam-outline'} size={20} color={hasVideos ? COLORS.white : COLORS.brandOrange} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, hasVideos && styles.badgeHasVideo]}>
              <Ionicons name="film-outline" size={10} color={hasVideos ? COLORS.brandOrange : COLORS.textMuted} />
              <Text style={[styles.badgeText, hasVideos && { color: COLORS.brandOrange }]}>
                {vCount} video{vCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>{lesson.estimatedDuration || 0} min</Text>
            </View>
            <View style={[styles.badge, lesson.status === 'Published' ? styles.badgePublished : styles.badgeDraft]}>
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
        <Text style={styles.headerTitle}>Upload Video Tutorial</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
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
            <Ionicons name="videocam-outline" size={48} color={COLORS.brandOrange} />
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
  flex1: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.bgLight, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.border },
  badgeText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  badgePublished: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  badgePublishedText: { color: '#16A34A' },
  badgeDraft: {},
  arrowBtn: { padding: 4 },
  lessonIconHasVideo: { backgroundColor: COLORS.brandOrange },
  badgeHasVideo: { borderColor: COLORS.brandOrange, backgroundColor: '#FFF7ED' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});
