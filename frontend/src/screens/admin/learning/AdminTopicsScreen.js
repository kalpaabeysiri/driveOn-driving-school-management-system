import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import {
  getLearningTopics,
  getLearningLessons,
  createLearningTopic,
  updateLearningTopic,
  deleteLearningTopic,
  reorderLearningTopics,
  deleteAllLearningTopics,
} from '../../../services/learningApi';

export default function AdminTopicsScreen({ navigation }) {
  const [topics, setTopics] = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', displayOrder: '0', status: 'Active' });

  const load = useCallback(async () => {
    try {
      // Reorder silently — don't block loading if it fails
      try { await reorderLearningTopics(); } catch (e) {
        console.log('Reorder failed (non-critical):', e.response?.status, e.response?.data?.message);
      }
      const [topicsRes, lessonsRes] = await Promise.all([
        getLearningTopics(),
        getLearningLessons(),
      ]);
      setTopics(topicsRes.data || []);
      const counts = {};
      (lessonsRes.data || []).forEach((l) => {
        const tid = l.topic?._id || l.topic;
        if (tid) counts[tid] = (counts[tid] || 0) + 1;
      });
      setLessonCounts(counts);
    } catch (err) {
      console.log('Load topics error:', err.response?.status, JSON.stringify(err.response?.data));
      Alert.alert('Error', err.response?.data?.message || 'Could not load topics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', displayOrder: String(topics.length), status: 'Active' });
    setModalOpen(true);
  };

  const openEdit = (topic) => {
    if (!topic || !topic._id) {
      Alert.alert('Error', 'Invalid topic data');
      return;
    }
    setEditing(topic);
    setForm({
      title: topic.title || '',
      description: topic.description || '',
      displayOrder: String(topic.displayOrder ?? 0),
      status: topic.status || 'Active',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return Alert.alert('Error', 'Title is required');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        displayOrder: parseInt(form.displayOrder || '0', 10),
        status: form.status,
      };
      if (editing?._id) await updateLearningTopic(editing._id, payload);
      else await createLearningTopic(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      console.log('Save topic error:', err.response?.status, JSON.stringify(err.response?.data));
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not save topic');
    }
  };

  const confirmDelete = (topic) => {
    if (!topic || !topic._id) {
      Alert.alert('Error', 'Invalid topic data');
      return;
    }
    
    Alert.alert('Delete Topic', 'Delete this topic? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLearningTopic(topic._id);
            load();
          } catch {
            Alert.alert('Error', 'Could not delete topic');
          }
        },
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete All Topics',
      'This will permanently delete ALL topics, lessons, videos, and quizzes. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllLearningTopics();
              load();
            } catch (err) {
              console.log('Delete all error:', err.response?.status, JSON.stringify(err.response?.data));
              Alert.alert('Error', err.response?.data?.message || err.message || 'Could not delete all topics');
            }
          },
        },
      ]
    );
  };

  const renderTopic = ({ item }) => {
    if (!item || !item._id) return null;
    const lessons = lessonCounts[item._id] || 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AdminLessons', { topicId: item._id, topicTitle: item.title })}
      >
        <View style={styles.cardTop}>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!item.description && <Text style={styles.cardMeta} numberOfLines={2}>{item.description}</Text>}
            <View style={styles.summaryRow}>
              <View style={styles.summaryBadge}>
                <Ionicons name="book-outline" size={12} color={COLORS.blue} />
                <Text style={styles.summaryText}>{lessons} lesson{lessons !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Ionicons name="layers-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.summaryText}>Order {item.displayOrder ?? 0}</Text>
              </View>
              <View style={[styles.summaryBadge, item.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.summaryText, item.status === 'Active' ? styles.badgeActiveText : styles.badgeInactiveText]}>{item.status}</Text>
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
        <Text style={styles.headerTitle}>Learning Topics</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {topics.length > 0 && (
            <TouchableOpacity style={styles.deleteAllBtn} onPress={confirmDeleteAll}>
              <Ionicons name="trash-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[...topics].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))}
        keyExtractor={(i) => i._id}
        renderItem={renderTopic}
        contentContainerStyle={styles.list}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No topics yet</Text>
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
              <Text style={styles.modalTitle}>{editing ? 'Edit Topic' : 'Create Topic'}</Text>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
                placeholder="Topic title"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                placeholder="Topic description"
                multiline
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Display Order</Text>
                  <TextInput
                    style={styles.input}
                    value={form.displayOrder}
                    onChangeText={(v) => setForm((p) => ({ ...p, displayOrder: v.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusRow}>
                    {['Active', 'Inactive'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, form.status === s && styles.statusBtnActive]}
                        onPress={() => setForm((p) => ({ ...p, status: s }))}
                      >
                        <Text style={[styles.statusText, form.status === s && styles.statusTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
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
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  addBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  deleteAllBtn: { backgroundColor: COLORS.redBg, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  cardMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  flex1: { flex: 1 },
  actions: { gap: 6, alignItems: 'flex-end' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.bgLight },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  summaryText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  badgeActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  badgeActiveText: { color: '#16A34A' },
  badgeInactive: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  badgeInactiveText: { color: '#DC2626' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  keyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  input: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  statusBtnActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  statusTextActive: { color: COLORS.white },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  saveBtn: { flex: 1, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});

