import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import {
  createLearningQuiz,
  getLearningQuizById,
  updateLearningQuiz,
} from '../../../services/learningApi';

function makeEmptyQuestion() {
  return {
    questionText: '',
    marks: '1',
    options: [
      { optionText: '', isCorrect: true },
      { optionText: '', isCorrect: false },
    ],
  };
}

export default function AdminQuizBuilderScreen({ route, navigation }) {
  const { lessonId, quizId } = route.params || {};

  const [loading, setLoading] = useState(!!quizId);
  const [saving, setSaving] = useState(false);

  const [meta, setMeta] = useState({
    title: '',
    description: '',
    passMark: '60',
    timeLimit: '15',
    attemptLimit: '1',
    status: 'Draft',
  });
  const [questions, setQuestions] = useState([makeEmptyQuestion()]);

  const screenTitle = useMemo(() => (quizId ? 'Edit Quiz' : 'Create Quiz'), [quizId]);

  const load = useCallback(async () => {
    if (!quizId) return;
    try {
      const { data } = await getLearningQuizById(quizId);
      setMeta({
        title: data.title || '',
        description: data.description || '',
        passMark: String(data.passMark ?? 60),
        timeLimit: String(data.timeLimit ?? 15),
        attemptLimit: String(data.attemptLimit ?? 1),
        status: data.status || 'Draft',
      });
      setQuestions(
        (data.questions || []).map((q) => ({
          questionText: q.questionText || '',
          marks: String(q.marks ?? 1),
          options: (q.options || []).map((o) => ({
            _id: o._id,
            optionText: o.optionText || '',
            isCorrect: !!o.isCorrect,
          })),
        }))
      );
    } catch {
      Alert.alert('Error', 'Could not load quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [quizId, navigation]);

  useEffect(() => { load(); }, [load]);

  const setCorrectOption = (qIdx, optIdx) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((o, j) => ({ ...o, isCorrect: j === optIdx })),
      };
    }));
  };

  const addQuestion = () => setQuestions((p) => [...p, makeEmptyQuestion()]);
  const removeQuestion = (idx) => setQuestions((p) => p.filter((_, i) => i !== idx));

  const addOption = (qIdx) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: [...q.options, { optionText: '', isCorrect: false }] };
    }));
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const nextOpts = q.options.filter((_, j) => j !== optIdx);
      const correctCount = nextOpts.filter((o) => o.isCorrect).length;
      const fixed = correctCount === 1 ? nextOpts : nextOpts.map((o, j) => ({ ...o, isCorrect: j === 0 }));
      return { ...q, options: fixed };
    }));
  };

  const validate = () => {
    if (!meta.title.trim()) return 'Quiz title is required';
    if (!questions.length) return 'Add at least one question';
    for (const q of questions) {
      if (!q.questionText.trim()) return 'Each question must have text';
      if (!q.options || q.options.length < 2) return 'Each question must have at least 2 options';
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (correct !== 1) return 'Each question must have exactly one correct option';
      const emptyOpt = q.options.some((o) => !o.optionText.trim());
      if (emptyOpt) return 'All options must have text';
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return Alert.alert('Error', err);

    try {
      setSaving(true);
      const payload = {
        title: meta.title.trim(),
        description: meta.description.trim(),
        passMark: parseInt(meta.passMark || '0', 10),
        timeLimit: parseInt(meta.timeLimit || '0', 10),
        attemptLimit: parseInt(meta.attemptLimit || '1', 10),
        status: meta.status,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          marks: parseInt(q.marks || '0', 10),
          options: q.options.map((o) => ({ optionText: o.optionText.trim(), isCorrect: !!o.isCorrect })),
        })),
      };

      // Only add lesson if it exists
      if (lessonId) {
        payload.lesson = lessonId;
      }

      if (quizId) await updateLearningQuiz(quizId, payload);
      else await createLearningQuiz(payload);

      Alert.alert('Success', 'Quiz saved', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <TouchableOpacity style={styles.saveIconBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.black} /> : <Ionicons name="save-outline" size={20} color={COLORS.black} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Quiz Details</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={meta.title} onChangeText={(v) => setMeta((p) => ({ ...p, title: v }))} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={meta.description}
          onChangeText={(v) => setMeta((p) => ({ ...p, description: v }))}
          multiline
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Pass mark (%)</Text>
            <TextInput style={styles.input} value={meta.passMark} keyboardType="numeric" onChangeText={(v) => setMeta((p) => ({ ...p, passMark: v.replace(/[^0-9]/g, '') }))} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Time limit (mins)</Text>
            <TextInput style={styles.input} value={meta.timeLimit} keyboardType="numeric" onChangeText={(v) => setMeta((p) => ({ ...p, timeLimit: v.replace(/[^0-9]/g, '') }))} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Attempt limit</Text>
            <TextInput style={styles.input} value={meta.attemptLimit} keyboardType="numeric" onChangeText={(v) => setMeta((p) => ({ ...p, attemptLimit: v.replace(/[^0-9]/g, '') }))} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.chipRow}>
              {['Draft', 'Published', 'Inactive'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, meta.status === s && styles.chipActive]}
                  onPress={() => setMeta((p) => ({ ...p, status: s }))}
                >
                  <Text style={[styles.chipText, meta.status === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>Questions</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={addQuestion}>
            <Ionicons name="add" size={16} color={COLORS.black} />
            <Text style={styles.smallBtnText}>Add Question</Text>
          </TouchableOpacity>
        </View>

        {questions.map((q, qIdx) => (
          <View key={qIdx} style={styles.qCard}>
            <View style={styles.qHeader}>
              <Text style={styles.qTitle}>Question {qIdx + 1}</Text>
              {questions.length > 1 && (
                <TouchableOpacity onPress={() => removeQuestion(qIdx)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Question text *</Text>
            <TextInput
              style={styles.input}
              value={q.questionText}
              onChangeText={(v) => setQuestions((prev) => prev.map((x, i) => i === qIdx ? { ...x, questionText: v } : x))}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Marks</Text>
                <TextInput
                  style={styles.input}
                  value={q.marks}
                  keyboardType="numeric"
                  onChangeText={(v) => setQuestions((prev) => prev.map((x, i) => i === qIdx ? { ...x, marks: v.replace(/[^0-9]/g, '') } : x))}
                />
              </View>
              <View style={styles.flex1} />
            </View>

            <View style={styles.optTop}>
              <Text style={styles.label}>Options *</Text>
              <TouchableOpacity style={styles.smallBtnGhost} onPress={() => addOption(qIdx)}>
                <Ionicons name="add" size={14} color={COLORS.black} />
                <Text style={styles.smallBtnText}>Add Option</Text>
              </TouchableOpacity>
            </View>

            {q.options.map((o, optIdx) => (
              <View key={optIdx} style={styles.optRow}>
                <TouchableOpacity
                  style={[styles.radio, o.isCorrect && styles.radioOn]}
                  onPress={() => setCorrectOption(qIdx, optIdx)}
                >
                  {o.isCorrect && <View style={styles.radioDot} />}
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.optInput]}
                  value={o.optionText}
                  onChangeText={(v) => setQuestions((prev) => prev.map((x, i) => {
                    if (i !== qIdx) return x;
                    return { ...x, options: x.options.map((oo, j) => j === optIdx ? { ...oo, optionText: v } : oo) };
                  }))}
                  placeholder={`Option ${optIdx + 1}`}
                />
                {q.options.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(qIdx, optIdx)}>
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.red} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <Text style={styles.help}>Tap the circle to set the correct option.</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Save Quiz</Text>}
        </TouchableOpacity>
      </ScrollView>
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
  saveIconBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.black, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  input: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.brandOrange, borderColor: COLORS.brandOrange },
  chipText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.white },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandYellow, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallBtnGhost: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.bgLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  qCard: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  qHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  qTitle: { fontSize: 14, fontWeight: '800', color: COLORS.black },
  optTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: COLORS.green },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green },
  optInput: { flex: 1, marginBottom: 0 },
  help: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  saveBtn: { backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});

