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
  createLearningTopic,
  updateLearningTopic,
  deleteLearningTopic,
} from '../../../services/learningApi';

export default function AdminTopicsScreen({ navigation }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', displayOrder: '0', status: 'Active' });

  const load = useCallback(async () => {
    try {
      const res = await getLearningTopics();
      setTopics(res.data || []);
    } catch {
      Alert.alert('Error', 'Could not load topics');
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
      Alert.alert('Error', err.response?.data?.message || 'Could not save topic');
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

  const renderTopic = ({ item }) => {
    if (!item || !item._id) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AdminLessons', { topicId: item._id, topicTitle: item.title })}
      >
        <View style={styles.cardTop}>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!item.description && <Text style={styles.cardMeta} numberOfLines={2}>{item.description}</Text>}
            <Text style={styles.cardMeta}>Order: {item.displayOrder ?? 0} · {item.status}</Text>
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
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
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
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  cardMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  flex1: { flex: 1 },
  actions: { gap: 6, alignItems: 'flex-end' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.bgLight },
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

