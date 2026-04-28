import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendNotification } from '../../services/api';
import { COLORS } from '../../theme';

const AUDIENCE_OPTIONS = [
  { key: 'AllStudents',    label: 'All Students',    icon: 'school-outline'    },
  { key: 'AllInstructors', label: 'All Instructors', icon: 'person-outline'    },
  { key: 'AllStaff',       label: 'All Staff',       icon: 'business-outline'  },
  { key: 'AllUsers',       label: 'Everyone',        icon: 'people-outline'    },
];

const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];

const PRIORITY_COLORS = {
  Low:    COLORS.textMuted,
  Normal: COLORS.blue,
  High:   COLORS.brandOrange,
  Urgent: COLORS.red,
};

export default function SendNoticeScreen({ navigation }) {
  const [broadcastTo, setBroadcastTo] = useState('AllStudents');
  const [message,     setMessage]     = useState('');
  const [priority,    setPriority]    = useState('Normal');
  const [sending,     setSending]     = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return Alert.alert('Required', 'Please enter a message');
    try {
      setSending(true);
      const res = await sendNotification({
        message:     message.trim(),
        type:        'Notice',
        priority,
        broadcastTo,
      });
      Alert.alert(
        'Sent ✅',
        `Notice delivered to ${res.data.count} recipient(s)`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not send notice');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Send Notice</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Audience */}
        <Text style={styles.label}>Send To</Text>
        <View style={styles.audienceGrid}>
          {AUDIENCE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.audienceCard, broadcastTo === opt.key && styles.audienceCardActive]}
              onPress={() => setBroadcastTo(opt.key)}
            >
              <Ionicons
                name={opt.icon}
                size={22}
                color={broadcastTo === opt.key ? COLORS.black : COLORS.textMuted}
              />
              <Text style={[styles.audienceLabel, broadcastTo === opt.key && styles.audienceLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityBtn, priority === p && { backgroundColor: PRIORITY_COLORS[p] + '25', borderColor: PRIORITY_COLORS[p] }]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.priorityText, priority === p && { color: PRIORITY_COLORS[p], fontWeight: '700' }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Write your notice here..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          blurOnSubmit
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        {/* Preview */}
        {message.trim().length > 0 && (
          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <Ionicons name="megaphone-outline" size={16} color={COLORS.brandOrange} />
              <Text style={styles.previewTitle}>Preview</Text>
            </View>
            <Text style={styles.previewAudience}>
              To: {AUDIENCE_OPTIONS.find(o => o.key === broadcastTo)?.label}
            </Text>
            <Text style={styles.previewMessage}>{message}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
          {sending
            ? <ActivityIndicator color={COLORS.black} />
            : <>
                <Ionicons name="send-outline" size={20} color={COLORS.black} />
                <Text style={styles.sendBtnText}>Send Notice</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.white },
  header:       { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:        { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  label:        { fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 10, marginTop: 20 },
  audienceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  audienceCard: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderWidth: 1.5, borderColor: COLORS.border },
  audienceCardActive: { backgroundColor: COLORS.brandYellow, borderColor: COLORS.brandYellow },
  audienceLabel:       { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  audienceLabelActive: { color: COLORS.black },
  priorityRow:  { flexDirection: 'row', gap: 8 },
  priorityBtn:  { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bgLight },
  priorityText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  textarea:     { backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 16, fontSize: 14, minHeight: 130, borderWidth: 1, borderColor: COLORS.border },
  preview:      { backgroundColor: '#FFFBF5', borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.brandOrange + '40' },
  previewHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  previewTitle: { fontSize: 12, fontWeight: '700', color: COLORS.brandOrange },
  previewAudience: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  previewMessage:  { fontSize: 14, color: COLORS.black, lineHeight: 20 },
  sendBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.brandYellow, borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  sendBtnText:  { fontSize: 16, fontWeight: '700', color: COLORS.black },
});
