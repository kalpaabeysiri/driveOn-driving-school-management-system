import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import {
  getLearningLessons,
  createLearningLesson,
  updateLearningLesson,
  deleteLearningLesson,
  reorderLearningLessons,
  getVideoTutorials,
  getLearningQuizzes,
  deleteAllLearningLessons,
} from '../../../services/learningApi';

export default function AdminLessonsScreen({ route, navigation }) {
  const { topicId, topicTitle } = route.params || {};

  const [lessons, setLessons] = useState([]);
  const [videoCounts, setVideoCounts] = useState({});
  const [quizCounts, setQuizCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'Mixed',
    estimatedDuration: '0',
    displayOrder: '0',
    status: 'Draft',
  });

  const title = useMemo(() => topicTitle || 'Lessons', [topicTitle]);

  const load = useCallback(async () => {
    try {
      await reorderLearningLessons(topicId);
      const params = topicId ? { topic: topicId } : {};
      const [lessonsRes, videosRes, quizzesRes] = await Promise.all([
        getLearningLessons(params),
        getVideoTutorials(),
        getLearningQuizzes(),
      ]);
      setLessons(lessonsRes.data || []);

      const vCounts = {};
      (videosRes.data || []).forEach((v) => {
        const lid = v.lesson?._id || v.lesson;
        if (lid) vCounts[lid] = (vCounts[lid] || 0) + 1;
      });
      setVideoCounts(vCounts);

      const qCounts = {};
      (quizzesRes.data || []).forEach((q) => {
        const lid = q.lesson?._id || q.lesson;
        if (lid) qCounts[lid] = (qCounts[lid] || 0) + 1;
      });
      setQuizCounts(qCounts);
    } catch {
      Alert.alert('Error', 'Could not load lessons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [topicId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      contentType: 'Mixed',
      estimatedDuration: '0',
      displayOrder: String(lessons.length),
      status: 'Draft',
    });
    setModalOpen(true);
  };

  const openEdit = (lesson) => {
    if (!lesson || !lesson._id) {
      Alert.alert('Error', 'Invalid lesson data');
      return;
    }
    setEditing(lesson);
    setForm({
      title: lesson.title || '',
      description: lesson.description || '',
      contentType: lesson.contentType || 'Mixed',
      estimatedDuration: String(lesson.estimatedDuration ?? 0),
      displayOrder: String(lesson.displayOrder ?? 0),
      status: lesson.status || 'Draft',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return Alert.alert('Error', 'Title is required');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        contentType: form.contentType,
        estimatedDuration: parseInt(form.estimatedDuration || '0', 10),
        displayOrder: parseInt(form.displayOrder || '0', 10),
        status: form.status,
      };
      
      // Only add topic if it exists
      if (topicId) {
        payload.topic = topicId;
      }
      
      if (editing?._id) await updateLearningLesson(editing._id, payload);
      else await createLearningLesson(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save lesson');
    }
  };

  const confirmDelete = (lesson) => {
    if (!lesson || !lesson._id) {
      Alert.alert('Error', 'Invalid lesson data');
      return;
    }
    
    Alert.alert('Delete Lesson', 'Delete this lesson? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLearningLesson(lesson._id);
            load();
          } catch {
            Alert.alert('Error', 'Could not delete lesson');
          }
        },
      },
    ]);
  };

  const confirmDeleteAll = () => {
    if (!topicId) {
      Alert.alert('Error', 'No topic selected');
      return;
    }
    Alert.alert(
      'Delete All Lessons',
      `Delete all lessons in this topic? This will also delete all videos and quizzes in those lessons. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteAllLearningLessons(topicId);
              Alert.alert('Success', `Deleted ${res.data.deletedCount} lessons`);
              load();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not delete lessons');
            }
          },
        },
      ]
    );
  };

  const contentTypeIcon = (type) => {
    if (type === 'Video') return 'videocam-outline';
    if (type === 'Text') return 'document-text-outline';
    return 'layers-outline';
  };

  const renderLesson = ({ item }) => {
    if (!item || !item._id) return null;
    const videos = videoCounts[item._id] || 0;
    const quizzes = quizCounts[item._id] || 0;
    const isPublished = item.status === 'Published';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AdminLessonDetail', { lessonId: item._id, lessonTitle: item.title })}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{item.displayOrder ?? 0}</Text>
          </View>
        </View>
        <View style={styles.flex1}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusPill, isPublished ? styles.pillPublished : styles.pillDraft]}>
              <Text style={[styles.pillText, isPublished ? styles.pillPublishedText : styles.pillDraftText]}>
                {item.status}
              </Text>
            </View>
          </View>
          {!!item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name={contentTypeIcon(item.contentType)} size={11} color={COLORS.blue} />
              <Text style={styles.badgeText}>{item.contentType}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>{item.estimatedDuration || 0} min</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="videocam-outline" size={11} color={COLORS.red} />
              <Text style={styles.badgeText}>{videos} video{videos !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="help-circle-outline" size={11} color={COLORS.brandOrange} />
              <Text style={styles.badgeText}>{quizzes} quiz{quizzes !== 1 ? 'zes' : ''}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
            <Ionicons name="create-outline" size={18} color={COLORS.blue} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.red} />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerActions}>
          {lessons.length > 0 && (
            <TouchableOpacity style={styles.deleteAllBtn} onPress={confirmDeleteAll}>
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[...lessons].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))}
        keyExtractor={(i) => i._id}
        renderItem={renderLesson}
        contentContainerStyle={styles.list}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No lessons yet</Text>
          </View>
        }
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Lesson' : 'Create Lesson'}</Text>

              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                multiline
              />

              <Text style={styles.label}>Content Type</Text>
              <View style={styles.chipRow}>
                {['Text', 'Video', 'Mixed'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, form.contentType === t && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, contentType: t }))}
                  >
                    <Text style={[styles.chipText, form.contentType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Estimated Duration (mins)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.estimatedDuration}
                    onChangeText={(v) => setForm((p) => ({ ...p, estimatedDuration: v.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Display Order</Text>
                  <TextInput
                    style={styles.input}
                    value={form.displayOrder}
                    onChangeText={(v) => setForm((p) => ({ ...p, displayOrder: v.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.chipRow}>
                {['Draft', 'Published', 'Archived'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, form.status === s && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, status: s }))}
                  >
                    <Text style={[styles.chipText, form.status === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={submit}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteAllBtn: { padding: 8, borderRadius: 12, backgroundColor: '#FEE2E2' },
  addBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardLeft: { alignItems: 'center', paddingTop: 2 },
  orderBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.brandOrange, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
  flex1: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.black },
  cardDesc: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, lineHeight: 16 },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  pillPublished: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  pillPublishedText: { color: '#16A34A', fontSize: 10, fontWeight: '700' },
  pillDraft: { backgroundColor: COLORS.bgLight, borderColor: COLORS.border },
  pillDraftText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  pillText: { fontSize: 10, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.bgLight, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  badgeText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  actions: { gap: 6, alignItems: 'flex-end' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.bgLight },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  keyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  input: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  chipText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.white },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  saveBtn: { flex: 1, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});

