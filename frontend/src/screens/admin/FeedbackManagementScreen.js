import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../theme';
import {
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
  getFeedbackTemplates,
  createFeedbackTemplate,
  deleteFeedbackTemplate,
} from '../../services/feedbackApi';

const FeedbackManagementScreen = ({ navigation }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateQuestions, setNewTemplateQuestions] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [feedbacksRes, templatesRes] = await Promise.all([
        getAllFeedbacks(),
        getFeedbackTemplates(),
      ]);
      setFeedbacks(feedbacksRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteFeedback = (feedbackId) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFeedback(feedbackId);
              setFeedbacks(feedbacks.filter(f => f._id !== feedbackId));
              Alert.alert('Success', 'Feedback deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete feedback');
            }
          },
        },
      ]
    );
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateQuestions.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setCreatingTemplate(true);
    try {
      const questions = newTemplateQuestions.split('\n').filter(q => q.trim());
      await createFeedbackTemplate({
        name: newTemplateName,
        questions,
      });
      Alert.alert('Success', 'Template created successfully');
      setNewTemplateName('');
      setNewTemplateQuestions('');
      setShowCreateTemplate(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create template');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFeedbackTemplate(templateId);
              setTemplates(templates.filter(t => t._id !== templateId));
              Alert.alert('Success', 'Template deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const renderFeedbackItem = (feedback) => (
    <View key={feedback._id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{feedback.student ? `${feedback.student.firstName} ${feedback.student.lastName}` : 'Anonymous'}</Text>
          <Text style={styles.date}>
            {new Date(feedback.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.rating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= feedback.rating ? 'star' : 'star-outline'}
              size={16}
              color={star <= feedback.rating ? COLORS.gold : COLORS.textMuted}
            />
          ))}
        </View>
      </View>
      {feedback.comment && (
        <Text style={styles.comment}>{feedback.comment}</Text>
      )}
      {feedback.session && (
        <Text style={styles.sessionInfo}>
          Session: {feedback.session.type || 'N/A'} - {feedback.session.date}
        </Text>
      )}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteFeedback(feedback._id)}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.red} />
      </TouchableOpacity>
    </View>
  );

  const renderTemplateItem = (template) => (
    <View key={template._id} style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateName}>{template.name}</Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteTemplate(template._id)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.red} />
        </TouchableOpacity>
      </View>
      {template.questions && template.questions.map((question, index) => (
        <Text key={index} style={styles.question}>
          • {question}
        </Text>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Create Template Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback Templates</Text>
            
            {!showCreateTemplate ? (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setShowCreateTemplate(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.createBtnText}>Create Template</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.createForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Template name"
                  value={newTemplateName}
                  onChangeText={setNewTemplateName}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Questions (one per line)"
                  value={newTemplateQuestions}
                  onChangeText={setNewTemplateQuestions}
                  multiline
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.cancelBtn]}
                    onPress={() => {
                      setShowCreateTemplate(false);
                      setNewTemplateName('');
                      setNewTemplateQuestions('');
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.submitBtn]}
                    onPress={handleCreateTemplate}
                    disabled={creatingTemplate}
                  >
                    {creatingTemplate ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.submitBtnText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {templates.map(renderTemplateItem)}
          </View>

          {/* Feedbacks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Feedbacks</Text>
            {feedbacks.length === 0 ? (
              <Text style={styles.emptyText}>No feedbacks yet</Text>
            ) : (
              feedbacks.map(renderFeedbackItem)
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  flex1: { flex: 1 },
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
  
  // Card styles
  card: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rating: { flexDirection: 'row' },
  comment: { fontSize: 14, color: COLORS.textDark, marginBottom: 8 },
  sessionInfo: { fontSize: 12, color: COLORS.textMuted },
  deleteBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  
  // Template styles
  templateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  question: { fontSize: 14, color: COLORS.textDark, marginBottom: 4 },
  
  // Create form
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  createBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  createForm: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  submitBtn: { backgroundColor: COLORS.brandOrange },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  
  emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 16 },
});

export default FeedbackManagementScreen;
