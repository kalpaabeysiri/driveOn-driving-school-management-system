import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../../theme';
import {
  getVideoTutorials,
  createVideoTutorial,
  updateVideoTutorial,
  deleteVideoTutorial,
  deleteAllVideoTutorials,
} from '../../../services/learningApi';

export default function AdminLessonVideosScreen({ route, navigation }) {
  const { lessonId, lessonTitle, topicTitle } = route.params || {};

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', videoUrl: '', duration: '0', status: 'Active' });
  const [pickedVideo, setPickedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getVideoTutorials({ lesson: lessonId });
      setVideos(res.data || []);
    } catch {
      Alert.alert('Error', 'Could not load videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingVideo(null);
    setPickedVideo(null);
    setVideoForm({ title: '', description: '', videoUrl: '', duration: '0', status: 'Active' });
    setModalOpen(true);
  };

  const openEdit = (video) => {
    setEditingVideo(video);
    setPickedVideo(null);
    setVideoForm({
      title: video.title || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      duration: String(video.duration ?? 0),
      status: video.status || 'Active',
    });
    setModalOpen(true);
  };

  const viewVideo = (video) => {
    if (!video.videoUrl) return Alert.alert('No URL', 'This video was uploaded as a file and has no external URL.');
    Linking.openURL(video.videoUrl).catch(() => Alert.alert('Error', 'Could not open video URL'));
  };

  const confirmDelete = (video) => {
    Alert.alert('Delete Video', `Delete "${video.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideoTutorial(video._id);
            load();
          } catch {
            Alert.alert('Error', 'Could not delete video');
          }
        },
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete All Videos',
      `Delete all ${videos.length} videos in this lesson? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteAllVideoTutorials(lessonId);
              Alert.alert('Success', `Deleted ${res.data.deletedCount} videos`);
              load();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not delete videos');
            }
          },
        },
      ]
    );
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow media library access to pick a video.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const uriParts = asset.uri.split('/');
    const name = uriParts[uriParts.length - 1] || `video-${Date.now()}.mp4`;
    setPickedVideo({ uri: asset.uri, name, type: asset.mimeType || 'video/mp4' });
  };

  const submitVideo = async () => {
    if (!videoForm.title.trim()) return Alert.alert('Error', 'Video title is required');
    if (!editingVideo && !pickedVideo && !videoForm.videoUrl.trim())
      return Alert.alert('Error', 'Provide a video URL or pick a file');

    try {
      setUploading(true);
      const payload = {
        title: videoForm.title.trim(),
        description: videoForm.description.trim(),
        videoUrl: videoForm.videoUrl.trim() || undefined,
        duration: parseInt(videoForm.duration || '0', 10),
        status: videoForm.status,
        lesson: lessonId,
      };
      if (editingVideo) {
        await updateVideoTutorial(editingVideo._id, payload, pickedVideo || undefined);
      } else {
        await createVideoTutorial(payload, pickedVideo);
      }
      setModalOpen(false);
      setEditingVideo(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save video');
    } finally {
      setUploading(false);
    }
  };

  const renderVideo = ({ item, index }) => (
    <View style={styles.videoCard}>
      {/* Index badge */}
      <View style={styles.indexBadge}>
        <Ionicons name="videocam" size={14} color={COLORS.white} />
      </View>

      <View style={styles.flex1}>
        <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
        {!!item.description && (
          <Text style={styles.videoDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.duration || 0}s</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name={item.videoUrl ? 'link-outline' : 'cloud-upload-outline'} size={10} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.videoUrl ? 'URL' : 'Uploaded'}</Text>
          </View>
          <View style={[styles.metaBadge, item.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.metaText, item.status === 'Active' ? styles.badgeActiveText : styles.badgeInactiveText]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => viewVideo(item)}>
          <Ionicons name="play-circle-outline" size={20} color={COLORS.blue} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="create-outline" size={20} color={COLORS.brandOrange} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(item)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lessonTitle || 'Videos'}</Text>
          {!!topicTitle && (
            <View style={styles.breadcrumb}>
              <Ionicons name="folder-outline" size={11} color={COLORS.brandOrange} />
              <Text style={styles.breadcrumbText}>{topicTitle}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {videos.length > 0 && (
            <TouchableOpacity style={styles.deleteAllBtn} onPress={confirmDeleteAll}>
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>
        : (
          <FlatList
            data={videos}
            keyExtractor={(v) => v._id}
            renderItem={renderVideo}
            contentContainerStyle={styles.list}
            onRefresh={() => { setRefreshing(true); load(); }}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="film-outline" size={52} color={COLORS.brandOrange} />
                <Text style={styles.emptyTitle}>No Videos Yet</Text>
                <Text style={styles.emptyText}>Tap the + button to upload the first video for this lesson.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.white} />
                  <Text style={styles.emptyBtnText}>Upload Video</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      }

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.flex1}>
                  <Text style={styles.modalTitle}>{editingVideo ? 'Edit Video' : 'Add Video'}</Text>
                  <View style={styles.modalBreadcrumb}>
                    <Ionicons name="folder-outline" size={11} color={COLORS.brandOrange} />
                    <Text style={styles.modalBreadcrumbText} numberOfLines={1}>
                      {topicTitle} › {lessonTitle}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={videoForm.title}
                onChangeText={(v) => setVideoForm((p) => ({ ...p, title: v }))}
                placeholder="e.g. Introduction to Road Signs"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
                value={videoForm.description}
                onChangeText={(v) => setVideoForm((p) => ({ ...p, description: v }))}
                placeholder="Brief description..."
                multiline
              />

              <Text style={styles.label}>Video URL (YouTube / external)</Text>
              <TextInput
                style={styles.input}
                value={videoForm.videoUrl}
                onChangeText={(v) => setVideoForm((p) => ({ ...p, videoUrl: v }))}
                placeholder="https://youtube.com/..."
                autoCapitalize="none"
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Duration (seconds)</Text>
                  <TextInput
                    style={styles.input}
                    value={videoForm.duration}
                    onChangeText={(v) => setVideoForm((p) => ({ ...p, duration: v.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.chipRow}>
                    {['Active', 'Inactive'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.chip, videoForm.status === s && styles.chipActive]}
                        onPress={() => setVideoForm((p) => ({ ...p, status: s }))}
                      >
                        <Text style={[styles.chipText, videoForm.status === s && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.pickBtn} onPress={pickVideo}>
                <Ionicons name="cloud-upload-outline" size={18} color={pickedVideo ? COLORS.green : COLORS.black} />
                <Text style={[styles.pickBtnText, pickedVideo && { color: COLORS.green }]}>
                  {pickedVideo ? `✓ ${pickedVideo.name}` : 'Or pick a video file from device'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)} disabled={uploading}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={submitVideo} disabled={uploading}>
                  {uploading
                    ? <ActivityIndicator color={COLORS.white} />
                    : <Text style={styles.saveText}>{editingVideo ? 'Update' : 'Save Video'}</Text>
                  }
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
  videoCard: {
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
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flex1: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  videoDesc: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, lineHeight: 16 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.bgLight, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.border },
  metaText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  badgeActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  badgeActiveText: { color: '#16A34A' },
  badgeInactive: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  badgeInactiveText: { color: '#DC2626' },
  actions: { gap: 6, alignItems: 'flex-end', paddingTop: 2 },
  actionBtn: { padding: 6, borderRadius: 10, backgroundColor: COLORS.bgLight },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  keyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  modalBreadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  modalBreadcrumbText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  input: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  chipText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.white },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 14 },
  pickBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.black, flex: 1 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  saveBtn: { flex: 1, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});
