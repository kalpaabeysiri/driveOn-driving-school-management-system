import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { BASE_URL } from '../../../services/api';
import { startLearningQuizAttempt } from '../../../services/learningApi';

export default function LessonScreen({ route, navigation }) {
  const { lesson } = route.params;
  const [startingQuizId, setStartingQuizId] = useState(null);

  // Validate lesson parameter
  React.useEffect(() => {
    if (!lesson) {
      Alert.alert('Error', 'Lesson data is required');
      navigation.goBack();
    }
  }, [lesson, navigation]);

  const videos = lesson?.videoTutorials || [];
  const quizzes = lesson?.quizzes || [];

  const openVideo = async (v) => {
    const url = v.videoUrl || (v.filePath ? `${BASE_URL}${v.filePath}` : null);
    if (!url) return Alert.alert('Error', 'No video URL available');
    const can = await Linking.canOpenURL(url);
    if (!can) return Alert.alert('Error', 'Cannot open this video URL');
    Linking.openURL(url);
  };

  const startQuiz = async (quiz) => {
    try {
      if (!quiz || !quiz._id) {
        Alert.alert('Error', 'Invalid quiz data');
        return;
      }
      setStartingQuizId(quiz._id);
      const { data } = await startLearningQuizAttempt(quiz._id);
      navigation.navigate('LearningQuizTake', { quizId: quiz._id, attemptId: data.attemptId });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not start quiz');
    } finally {
      setStartingQuizId(null);
    }
  };

  const title = useMemo(() => lesson?.title || 'Lesson', [lesson]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!!lesson?.description && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>About</Text>
            <Text style={styles.desc}>{lesson.description}</Text>
          </View>
        )}

        <View style={styles.block}>
          <View style={styles.blockTop}>
            <Text style={styles.blockTitle}>Videos</Text>
            <Text style={styles.blockMeta}>{videos.length}</Text>
          </View>
          {videos.length === 0 ? (
            <Text style={styles.empty}>No videos for this lesson.</Text>
          ) : (
            videos.map((v) => (
              <TouchableOpacity key={v._id} style={styles.item} onPress={() => openVideo(v)}>
                <Ionicons name="play-circle-outline" size={20} color={COLORS.brandOrange} />
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>{v.title}</Text>
                  <Text style={styles.itemMeta}>{v.duration || 0}s · {v.videoUrl ? 'URL' : 'Upload'}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.block}>
          <View style={styles.blockTop}>
            <Text style={styles.blockTitle}>Quizzes</Text>
            <Text style={styles.blockMeta}>{quizzes.length}</Text>
          </View>
          {quizzes.length === 0 ? (
            <Text style={styles.empty}>No quizzes for this lesson.</Text>
          ) : (
            quizzes.map((q) => (
              <TouchableOpacity key={q._id} style={styles.item} onPress={() => startQuiz(q)} disabled={startingQuizId === q._id}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.brandOrange} />
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>{q.title}</Text>
                  <Text style={styles.itemMeta}>{q.questions?.length || 0} questions · Pass {q.passMark || 0}%</Text>
                </View>
                {startingQuizId === q._id
                  ? <ActivityIndicator color={COLORS.brandOrange} />
                  : <Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} />
                }
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
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
  content: { padding: 16, paddingBottom: 40 },
  block: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  blockTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  blockTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  blockMeta: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  desc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  empty: { fontSize: 13, color: COLORS.textMuted, paddingVertical: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight },
  itemTitle: { fontSize: 13, fontWeight: '800', color: COLORS.black },
  itemMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  flex1: { flex: 1 },
});

