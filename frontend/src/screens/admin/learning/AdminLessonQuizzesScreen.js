import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getLearningQuizzes, deleteLearningQuiz, deleteAllLearningQuizzes } from '../../../services/learningApi';

export default function AdminLessonQuizzesScreen({ route, navigation }) {
  const { lessonId, lessonTitle, topicTitle } = route.params || {};

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getLearningQuizzes({ lesson: lessonId });
      setQuizzes(res.data || []);
    } catch {
      Alert.alert('Error', 'Could not load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lessonId]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const confirmDelete = (quiz) => {
    Alert.alert('Delete Quiz', `Delete "${quiz.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLearningQuiz(quiz._id);
            load();
          } catch {
            Alert.alert('Error', 'Could not delete quiz');
          }
        },
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete All Quizzes',
      `Delete all ${quizzes.length} quizzes in this lesson? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteAllLearningQuizzes(lessonId);
              Alert.alert('Success', `Deleted ${res.data.deletedCount} quizzes`);
              load();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not delete quizzes');
            }
          },
        },
      ]
    );
  };

  const getLanguageBadge = (lang) => {
    switch (lang) {
      case 'en': return { label: 'En', bg: '#3B82F6', border: '#3B82F6', text: '#FFFFFF' };
      case 'si': return { label: 'Si', bg: '#F97316', border: '#F97316', text: '#FFFFFF' };
      case 'both': return { label: 'En+Si', bg: '#8B5CF6', border: '#8B5CF6', text: '#FFFFFF' };
      default: return { label: 'En', bg: '#3B82F6', border: '#3B82F6', text: '#FFFFFF' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':    return { bg: '#DCFCE7', border: '#86EFAC', text: '#16A34A' };
      case 'Published': return { bg: '#DCFCE7', border: '#86EFAC', text: '#16A34A' };
      case 'Draft':     return { bg: COLORS.bgLight, border: COLORS.border, text: COLORS.textMuted };
      default:          return { bg: COLORS.bgLight, border: COLORS.border, text: COLORS.textMuted };
    }
  };

  const renderQuiz = ({ item }) => {
    const sc = getStatusColor(item.status);
    const lang = getLanguageBadge(item.language);
    return (
      <View style={styles.quizCard}>
        <View style={styles.quizIcon}>
          <Ionicons name="help-circle" size={18} color={COLORS.white} />
        </View>

        <View style={styles.flex1}>
          <View style={styles.titleRow}>
            <Text style={styles.quizTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.langBadge, { backgroundColor: lang.bg, borderColor: lang.border }]}>
              <Text style={[styles.langText, { color: lang.text }]}>{lang.label}</Text>
            </View>
          </View>
          {!!item.description && (
            <Text style={styles.quizDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="list-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                {item.questions?.length || 0} question{(item.questions?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="timer-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.timeLimit || 0} min</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="checkmark-circle-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.passMark || 0}% pass</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <Text style={[styles.metaText, { color: sc.text }]}>{item.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AdminQuizBuilder', { lessonId, quizId: item._id })}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.brandOrange} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lessonTitle || 'Quizzes'}</Text>
          {!!topicTitle && (
            <View style={styles.breadcrumb}>
              <Ionicons name="folder-outline" size={11} color={COLORS.brandOrange} />
              <Text style={styles.breadcrumbText}>{topicTitle}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {quizzes.length > 0 && (
            <TouchableOpacity style={styles.deleteAllBtn} onPress={confirmDeleteAll}>
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AdminQuizBuilder', { lessonId })}
          >
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>
        : (
          <FlatList
            data={quizzes}
            keyExtractor={(q) => q._id}
            renderItem={renderQuiz}
            contentContainerStyle={styles.list}
            onRefresh={() => { setRefreshing(true); load(); }}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="help-circle-outline" size={52} color={COLORS.brandOrange} />
                <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
                <Text style={styles.emptyText}>
                  Tap the + button to create the first quiz for this lesson.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('AdminQuizBuilder', { lessonId })}
                >
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
                  <Text style={styles.emptyBtnText}>Create Quiz</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      }
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
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.black },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  breadcrumbText: { fontSize: 11, color: COLORS.brandOrange, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteAllBtn: { padding: 8, borderRadius: 12, backgroundColor: '#FEE2E2' },
  addBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  list: { padding: 16, paddingBottom: 40 },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  quizIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flex1: { flex: 1 },
  quizTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  langBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  langText: { fontSize: 10, fontWeight: '700' },
  quizDesc: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, lineHeight: 16 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.bgLight, borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  metaText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  actions: { gap: 6, alignItems: 'flex-end', paddingTop: 2 },
  actionBtn: { padding: 6, borderRadius: 10, backgroundColor: COLORS.bgLight },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.brandOrange, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
