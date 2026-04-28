import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
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
  getLearningQuizzes,
  deleteLearningQuiz,
} from '../../../services/learningApi';

export default function AdminLessonDetailScreen({ route, navigation }) {
  const { lessonId, lessonTitle } = route.params;

  // Validate required params
  React.useEffect(() => {
    if (!lessonId) {
      Alert.alert('Error', 'Lesson ID is required');
      navigation.goBack();
    }
  }, [lessonId, navigation]);

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  // video modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', videoUrl: '', duration: '0', status: 'Active' });
  const [pickedVideo, setPickedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const title = useMemo(() => lessonTitle || 'Lesson', [lessonTitle]);

  const load = useCallback(async () => {
    if (!lessonId) return;
    try {
      const [v, q] = await Promise.all([
        getVideoTutorials({ lesson: lessonId }),
        getLearningQuizzes({ lesson: lessonId }),
      ]);
      setVideos(v.data || []);
      setQuizzes(q.data || []);
    } catch {
      Alert.alert('Error', 'Could not load lesson content');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);

  const openAddVideo = () => {
    setEditingVideo(null);
    setPickedVideo(null);
    setVideoForm({ title: '', description: '', videoUrl: '', duration: '0', status: 'Active' });
    setVideoModalOpen(true);
  };

  const openEditVideo = (video) => {
    setEditingVideo(video);
    setPickedVideo(null);
    setVideoForm({
      title: video.title || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      duration: String(video.duration ?? 0),
      status: video.status || 'Active',
    });
    setVideoModalOpen(true);
  };

  const viewVideo = (video) => {
    const url = video.videoUrl;
    if (!url) return Alert.alert('No URL', 'This video has no external URL. It was uploaded as a file.');
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open video URL'));
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
    const mime = asset.mimeType || 'video/mp4';
    setPickedVideo({ uri: asset.uri, name, type: mime });
  };

  const submitVideo = async () => {
    if (!videoForm.title.trim()) return Alert.alert('Error', 'Video title is required');
    if (!editingVideo && !pickedVideo && !videoForm.videoUrl.trim()) return Alert.alert('Error', 'Provide a video URL or upload a file');
    if (!lessonId) return Alert.alert('Error', 'Lesson ID is required');

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
      setVideoModalOpen(false);
      setEditingVideo(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save video tutorial');
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteVideo = (video) => {
    Alert.alert('Delete Video', 'Delete this video tutorial?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteVideoTutorial(video._id); load(); }
          catch { Alert.alert('Error', 'Could not delete video'); }
        },
      },
    ]);
  };

  const confirmDeleteQuiz = (quiz) => {
    Alert.alert('Delete Quiz', 'Delete this quiz?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteLearningQuiz(quiz._id); load(); }
          catch { Alert.alert('Error', 'Could not delete quiz'); }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

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
        {/* Videos */}
        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>Video Tutorials</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={openAddVideo}>
            <Ionicons name="add" size={16} color={COLORS.black} />
            <Text style={styles.smallBtnText}>Add Video</Text>
          </TouchableOpacity>
        </View>

        {videos.length === 0 ? (
          <Text style={styles.empty}>No videos yet.</Text>
        ) : (
          videos.map((v) => (
            <View key={v._id} style={styles.itemCard}>
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>{v.title}</Text>
                {!!v.description && <Text style={styles.itemMeta} numberOfLines={2}>{v.description}</Text>}
                <Text style={styles.itemMeta}>
                  {v.status} · {v.duration || 0}s · {v.videoUrl ? 'URL' : 'Upload'}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => viewVideo(v)}>
                  <Ionicons name="play-circle-outline" size={18} color={COLORS.blue} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEditVideo(v)}>
                  <Ionicons name="create-outline" size={18} color={COLORS.brandOrange} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDeleteVideo(v)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Quizzes */}
        <View style={[styles.sectionTop, { marginTop: 18 }]}>
          <Text style={styles.sectionTitle}>Quizzes</Text>
          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => navigation.navigate('AdminQuizBuilder', { lessonId })}
          >
            <Ionicons name="add" size={16} color={COLORS.black} />
            <Text style={styles.smallBtnText}>Create Quiz</Text>
          </TouchableOpacity>
        </View>

        {quizzes.length === 0 ? (
          <Text style={styles.empty}>No quizzes yet.</Text>
        ) : (
          quizzes.map((q) => (
            <View key={q._id} style={styles.itemCard}>
              <TouchableOpacity
                style={styles.flex1}
                onPress={() => navigation.navigate('AdminQuizBuilder', { lessonId, quizId: q._id })}
              >
                <Text style={styles.itemTitle}>{q.title}</Text>
                <Text style={styles.itemMeta}>
                  {q.status} · {q.questions?.length || 0} Q · Pass {q.passMark || 0}%
                </Text>
              </TouchableOpacity>
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => navigation.navigate('AdminQuizAnalytics', { quizId: q._id, quizTitle: q.title })}
                >
                  <Ionicons name="stats-chart-outline" size={18} color={COLORS.green} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDeleteQuiz(q)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={videoModalOpen} transparent animationType="slide" onRequestClose={() => setVideoModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editingVideo ? 'Edit Video Tutorial' : 'Add Video Tutorial'}</Text>

              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} value={videoForm.title} onChangeText={(v) => setVideoForm((p) => ({ ...p, title: v }))} />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={videoForm.description}
                onChangeText={(v) => setVideoForm((p) => ({ ...p, description: v }))}
                multiline
              />

              <Text style={styles.label}>Video URL (optional)</Text>
              <TextInput style={styles.input} value={videoForm.videoUrl} onChangeText={(v) => setVideoForm((p) => ({ ...p, videoUrl: v }))} placeholder="https://..." />

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
                <Ionicons name="cloud-upload-outline" size={18} color={COLORS.black} />
                <Text style={styles.pickBtnText}>{pickedVideo ? pickedVideo.name : 'Pick video file to upload'}</Text>
              </TouchableOpacity>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setVideoModalOpen(false)} disabled={uploading}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={submitVideo} disabled={uploading}>
                  {uploading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Save</Text>}
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
  content: { padding: 16, paddingBottom: 40 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandYellow, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  empty: { fontSize: 13, color: COLORS.textMuted, paddingVertical: 12 },
  itemCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  itemTitle: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  itemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  flex1: { flex: 1 },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.bgLight },
  cardActions: { gap: 6, alignItems: 'flex-end' },

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
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 12 },
  pickBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.black, flex: 1 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  saveBtn: { flex: 1, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});

