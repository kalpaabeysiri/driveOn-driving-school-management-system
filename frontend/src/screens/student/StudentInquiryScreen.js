import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getInquiries, createInquiry, updateInquiry, deleteInquiry } from '../../services/api';
import { COLORS } from '../../theme';

const STATUS_STYLE = {
  Open:    { bg: '#FEF3C7', text: '#92400E' },
  Replied: { bg: COLORS.greenBg, text: COLORS.green },
  Closed:  { bg: COLORS.redBg,   text: COLORS.red   },
};

export default function StudentInquiryScreen({ navigation }) {
  const [inquiries,   setInquiries]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // New inquiry form
  const [showNew,     setShowNew]     = useState(false);
  const [newMsg,      setNewMsg]      = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  // View detail modal
  const [selected,    setSelected]    = useState(null);

  // Edit modal
  const [editing,     setEditing]     = useState(null);   // the inquiry being edited
  const [editMsg,     setEditMsg]     = useState('');
  const [saving,      setSaving]      = useState(false);

  /* ─── API ──────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      const res = await getInquiries();
      setInquiries(res.data.inquiries || []);
    } catch {
      Alert.alert('Error', 'Could not load inquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newMsg.trim()) return Alert.alert('Required', 'Please enter your message');
    try {
      setSubmitting(true);
      await createInquiry({ message: newMsg.trim() });
      setNewMsg('');
      setShowNew(false);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editMsg.trim()) return Alert.alert('Required', 'Please enter your message');
    try {
      setSaving(true);
      await updateInquiry(editing._id, { message: editMsg.trim() });
      setInquiries(prev =>
        prev.map(i => i._id === editing._id ? { ...i, message: editMsg.trim() } : i)
      );
      setEditing(null);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update inquiry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Inquiry',
      `Delete "${item.messageId}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteInquiry(item._id);
              setInquiries(prev => prev.filter(i => i._id !== item._id));
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Could not delete inquiry');
            }
          },
        },
      ]
    );
  };

  const openEdit = (item) => {
    setEditing(item);
    setEditMsg(item.message);
  };

  /* ─── Render card ──────────────────────────────────────────────────── */
  const renderItem = ({ item }) => {
    const sc      = STATUS_STYLE[item.status] || STATUS_STYLE.Open;
    const isOpen  = item.status === 'Open';

    return (
      <View style={styles.card}>
        {/* Top row: ID + status badge */}
        <View style={styles.cardTop}>
          <Text style={styles.msgId}>{item.messageId}</Text>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Message preview */}
        <Text style={styles.msgText} numberOfLines={2}>{item.message}</Text>

        {/* Reply preview */}
        {item.reply && (
          <View style={styles.replyBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.green} />
            <Text style={styles.replyText} numberOfLines={1}>{item.reply}</Text>
          </View>
        )}

        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => setSelected(item)}
          >
            <Ionicons name="eye-outline" size={15} color={COLORS.blue} />
            <Text style={[styles.actionBtnText, { color: COLORS.blue }]}>View</Text>
          </TouchableOpacity>

          {isOpen && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => openEdit(item)}
            >
              <Ionicons name="create-outline" size={15} color={COLORS.brandOrange} />
              <Text style={[styles.actionBtnText, { color: COLORS.brandOrange }]}>Edit</Text>
            </TouchableOpacity>
          )}

          {isOpen && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.red} />
              <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>My Inquiries</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={inquiries}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color={COLORS.brandOrange} />
            <Text style={styles.emptyTitle}>No inquiries yet</Text>
            <Text style={styles.emptySub}>Tap + to send a message to admin</Text>
          </View>
        }
      />

      {/* ── New Inquiry Modal ─────────────────────────────────────── */}
      <Modal visible={showNew} transparent animationType="slide" onRequestClose={() => setShowNew(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Inquiry</Text>
            <Text style={styles.label}>Your Message</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Describe your question or concern..."
              value={newMsg}
              onChangeText={setNewMsg}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNew(false); setNewMsg(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.submitText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Inquiry Modal ────────────────────────────────────── */}
      <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { marginBottom: 0 }]}>
                Edit {editing?.messageId}
              </Text>
              <TouchableOpacity onPress={() => setEditing(null)}>
                <Ionicons name="close" size={22} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Your Message</Text>
            <TextInput
              style={styles.textarea}
              value={editMsg}
              onChangeText={setEditMsg}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEdit} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.submitText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── View Detail Modal ─────────────────────────────────────── */}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {selected && (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={[styles.sheetTitle, { marginBottom: 0 }]}>{selected.messageId}</Text>
                    <View style={[styles.badge, { backgroundColor: STATUS_STYLE[selected.status]?.bg || '#FEF3C7', marginTop: 4 }]}>
                      <Text style={[styles.badgeText, { color: STATUS_STYLE[selected.status]?.text || '#92400E' }]}>
                        {selected.status}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Ionicons name="close" size={22} color={COLORS.black} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Your Message</Text>
                  <View style={styles.msgBox}>
                    <Text style={styles.msgBoxText}>{selected.message}</Text>
                  </View>
                  <Text style={[styles.dateText, { marginTop: 6 }]}>
                    Submitted: {new Date(selected.createdAt).toLocaleString()}
                  </Text>

                  {selected.reply ? (
                    <>
                      <Text style={[styles.label, { color: COLORS.green, marginTop: 16 }]}>Admin Reply</Text>
                      <View style={[styles.msgBox, { backgroundColor: COLORS.greenBg }]}>
                        <Text style={[styles.msgBoxText, { color: COLORS.green }]}>{selected.reply}</Text>
                      </View>
                      {selected.repliedAt && (
                        <Text style={[styles.dateText, { marginTop: 6 }]}>
                          Replied: {new Date(selected.repliedAt).toLocaleString()}
                        </Text>
                      )}
                    </>
                  ) : (
                    <View style={styles.pendingBox}>
                      <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
                      <Text style={styles.pendingText}>Awaiting admin reply</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.white },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:        { fontSize: 18, fontWeight: '600', color: COLORS.black },
  addBtn:       { backgroundColor: COLORS.brandYellow, borderRadius: 10, padding: 8 },
  list:         { padding: 16, paddingBottom: 40 },

  card:         { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  msgId:        { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  badge:        { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  msgText:      { fontSize: 14, color: COLORS.black, lineHeight: 20, marginBottom: 8 },
  replyBox:     { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: COLORS.greenBg, borderRadius: 8, padding: 8, marginBottom: 8 },
  replyText:    { flex: 1, fontSize: 12, color: COLORS.green },
  dateText:     { fontSize: 11, color: COLORS.textMuted },

  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  actionBtnText:{ fontSize: 12, fontWeight: '600' },
  viewBtn:      { borderColor: COLORS.blue,         backgroundColor: COLORS.blueBg },
  editBtn:      { borderColor: COLORS.brandOrange,  backgroundColor: '#FFF7ED' },
  deleteBtn:    { borderColor: COLORS.red,           backgroundColor: COLORS.redBg },

  empty:        { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: COLORS.black },
  emptySub:     { fontSize: 13, color: COLORS.textMuted },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  textarea:     { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120, borderWidth: 1, borderColor: COLORS.border },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelText:   { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  submitBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.brandOrange },
  saveBtn:      { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.blue },
  submitText:   { fontSize: 14, fontWeight: '700', color: COLORS.white },
  msgBox:       { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 14 },
  msgBoxText:   { fontSize: 14, color: COLORS.black, lineHeight: 20 },
  pendingBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: COLORS.bgLight, borderRadius: 12, marginTop: 16 },
  pendingText:  { fontSize: 13, color: COLORS.textMuted },
});
