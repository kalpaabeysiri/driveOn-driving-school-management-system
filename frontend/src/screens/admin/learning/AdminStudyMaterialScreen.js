import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../../../theme';
import {
  getStudyMaterials, createStudyMaterial, deleteStudyMaterial,
  getLearningTopics, getLearningLessons,
} from '../../../services/learningApi';

const FILE_TYPE_ICONS = {
  image: { name: 'image-outline', color: '#3B82F6' },
  video: { name: 'videocam-outline', color: '#EF4444' },
  pdf: { name: 'document-text-outline', color: '#F97316' },
  document: { name: 'document-outline', color: '#8B5CF6' },
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminStudyMaterialScreen({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getStudyMaterials();
      setMaterials(res.data || []);
    } catch {
      Alert.alert('Error', 'Could not load study materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const loadTopics = async () => {
    try {
      const res = await getLearningTopics();
      setTopics(res.data || []);
    } catch {}
  };

  const openUpload = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setSelectedTopic(null);
    loadTopics();
    setModalOpen(true);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'image/*',
          'video/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
        if (!title) {
          const name = result.assets[0].name?.replace(/\.[^.]+$/, '') || '';
          setTitle(name);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not pick file');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!selectedFile) return Alert.alert('Error', 'Please select a file');

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (selectedTopic) formData.append('topic', selectedTopic);
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name || `file_${Date.now()}`,
      });

      await createStudyMaterial(formData);
      setModalOpen(false);
      Alert.alert('Success', 'Study material uploaded!');
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not upload material');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = (material) => {
    Alert.alert('Delete Material', `Delete "${material.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudyMaterial(material._id);
            load();
          } catch {
            Alert.alert('Error', 'Could not delete material');
          }
        },
      },
    ]);
  };

  const renderMaterial = ({ item }) => {
    const icon = FILE_TYPE_ICONS[item.fileType] || FILE_TYPE_ICONS.document;
    return (
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {!!item.description && (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.fileType}</Text>
            </View>
            {!!item.fileSize && (
              <Text style={styles.metaText}>{formatFileSize(item.fileSize)}</Text>
            )}
            {!!item.topic?.title && (
              <View style={[styles.badge, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                <Text style={[styles.badgeText, { color: '#2563EB' }]}>{item.topic.title}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Materials</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openUpload}>
          <Ionicons name="cloud-upload-outline" size={20} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(m) => m._id}
          renderItem={renderMaterial}
          contentContainerStyle={styles.list}
          onRefresh={() => { setRefreshing(true); load(); }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cloud-upload-outline" size={52} color={COLORS.brandOrange} />
              <Text style={styles.emptyTitle}>No Study Materials</Text>
              <Text style={styles.emptyText}>
                Upload images, videos, PDFs, or documents for your students.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openUpload}>
                <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Upload Material</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Upload Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Upload Study Material</Text>

              {/* File Picker */}
              <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
                {selectedFile ? (
                  <View style={styles.fileSelected}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                      <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Ionicons name="close-circle" size={20} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.fileEmpty}>
                    <Ionicons name="cloud-upload-outline" size={32} color={COLORS.textMuted} />
                    <Text style={styles.fileEmptyText}>Tap to select a file</Text>
                    <Text style={styles.fileEmptyHint}>Images, Videos, PDFs, Documents</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Material title"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                multiline
              />

              {/* Topic selector */}
              <Text style={styles.label}>Topic (optional)</Text>
              <View style={styles.topicRow}>
                <TouchableOpacity
                  style={[styles.topicChip, !selectedTopic && styles.topicChipActive]}
                  onPress={() => setSelectedTopic(null)}
                >
                  <Text style={[styles.topicChipText, !selectedTopic && styles.topicChipTextActive]}>None</Text>
                </TouchableOpacity>
                {topics.map((t) => (
                  <TouchableOpacity
                    key={t._id}
                    style={[styles.topicChip, selectedTopic === t._id && styles.topicChipActive]}
                    onPress={() => setSelectedTopic(t._id)}
                  >
                    <Text style={[styles.topicChipText, selectedTopic === t._id && styles.topicChipTextActive]} numberOfLines={1}>
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveText}>Upload</Text>
                  )}
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
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  addBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  list: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  cardDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: {
    backgroundColor: COLORS.bgLight, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textTransform: 'capitalize' },
  metaText: { fontSize: 10, color: COLORS.textMuted },
  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: '#FEE2E2' },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.brandOrange, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  keyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12,
  },

  filePicker: {
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    borderRadius: 16, marginBottom: 14, overflow: 'hidden',
  },
  fileEmpty: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  fileEmptyText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  fileEmptyHint: { fontSize: 11, color: COLORS.textMuted },
  fileSelected: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  fileName: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  fileSize: { fontSize: 11, color: COLORS.textMuted },

  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  topicChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border,
  },
  topicChipActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  topicChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  topicChipTextActive: { color: COLORS.white },

  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  saveBtn: { flex: 1, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});
