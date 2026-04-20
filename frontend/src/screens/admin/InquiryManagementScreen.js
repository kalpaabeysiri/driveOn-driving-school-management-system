import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getInquiries, replyToInquiry, closeInquiry, getInquiryStats } from '../../services/api';
import { COLORS } from '../../theme';

const STATUS_STYLE = {
  Open:    { bg: '#FEF3C7', text: '#92400E' },
  Replied: { bg: COLORS.greenBg, text: COLORS.green },
  Closed:  { bg: COLORS.bgLight, text: COLORS.textMuted },
};

export default function InquiryManagementScreen({ navigation }) {
  const [inquiries,  setInquiries]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('All');
  const [selected,   setSelected]   = useState(null);
  const [reply,      setReply]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = filter !== 'All' ? { status: filter } : {};
      const [inqRes, statsRes] = await Promise.all([
        getInquiries(params),
        getInquiryStats(),
      ]);
      setInquiries(inqRes.data.inquiries || []);
      setStats(statsRes.data);
    } catch {
      Alert.alert('Error', 'Could not load inquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async () => {
    if (!reply.trim()) return Alert.alert('Required', 'Please enter a reply');
    try {
      setSubmitting(true);
      await replyToInquiry(selected._id, { reply: reply.trim() });
      setReply('');
      setSelected(null);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (id) => {
    Alert.alert('Close Inquiry', 'Mark this inquiry as closed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        try {
          await closeInquiry(id);
          setSelected(null);
          load();
        } catch {
          Alert.alert('Error', 'Could not close inquiry');
        }
      }},
    ]);
  };

  const renderItem = ({ item }) => {
    const sc = STATUS_STYLE[item.status] || STATUS_STYLE.Open;
    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelected(item); setReply(''); }} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.msgId}>{item.messageId} · {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.msgPreview} numberOfLines={2}>{item.message}</Text>
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
        <Text style={styles.title}>Inquiries</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          {[
            { label: 'Open',    value: stats.open,    color: '#92400E', bg: '#FEF3C7' },
            { label: 'Replied', value: stats.replied, color: COLORS.green, bg: COLORS.greenBg },
            { label: 'Closed',  value: stats.closed,  color: COLORS.textMuted, bg: COLORS.bgLight },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filter */}
      <View style={styles.filterRow}>
        {['All', 'Open', 'Replied', 'Closed'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={inquiries}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No inquiries found</Text>
          </View>
        }
      />

      {/* Inquiry Detail + Reply Modal */}
      {selected && (
        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>{selected.studentName}</Text>
                  <Text style={styles.sheetSub}>{selected.messageId} · {new Date(selected.createdAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={22} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Student Message</Text>
                <View style={styles.msgBox}><Text style={styles.msgBoxText}>{selected.message}</Text></View>

                {selected.reply ? (
                  <>
                    <Text style={[styles.label, { color: COLORS.green, marginTop: 16 }]}>Your Reply</Text>
                    <View style={[styles.msgBox, { backgroundColor: COLORS.greenBg }]}>
                      <Text style={[styles.msgBoxText, { color: COLORS.green }]}>{selected.reply}</Text>
                    </View>
                  </>
                ) : selected.status !== 'Closed' && (
                  <>
                    <Text style={[styles.label, { marginTop: 16 }]}>Write Reply</Text>
                    <TextInput
                      style={styles.textarea}
                      placeholder="Type your reply..."
                      value={reply}
                      onChangeText={setReply}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      blurOnSubmit
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <TouchableOpacity style={styles.replyBtn} onPress={handleReply} disabled={submitting}>
                      {submitting
                        ? <ActivityIndicator color={COLORS.white} size="small" />
                        : <><Ionicons name="send-outline" size={16} color={COLORS.white} /><Text style={styles.replyBtnText}>Send Reply</Text></>
                      }
                    </TouchableOpacity>
                  </>
                )}

                {selected.status !== 'Closed' && (
                  <TouchableOpacity style={styles.closeBtn} onPress={() => handleClose(selected._id)}>
                    <Text style={styles.closeBtnText}>Close Inquiry</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.white },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:       { fontSize: 18, fontWeight: '600', color: COLORS.black },
  statsRow:    { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:    { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statVal:     { fontSize: 22, fontWeight: '800' },
  statLbl:     { fontSize: 11, fontWeight: '600', marginTop: 2 },
  filterRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterBtn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.bgLight },
  filterBtnActive:  { backgroundColor: COLORS.brandYellow },
  filterText:       { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.black, fontWeight: '700' },
  list:        { padding: 16, paddingBottom: 40 },
  card:        { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  studentName: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  msgId:       { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  badge:       { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  msgPreview:  { fontSize: 13, color: COLORS.textDark, lineHeight: 18 },
  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:   { fontSize: 15, color: COLORS.textMuted },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle:  { fontSize: 17, fontWeight: '700', color: COLORS.black },
  sheetSub:    { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  label:       { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  msgBox:      { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 14 },
  msgBoxText:  { fontSize: 14, color: COLORS.black, lineHeight: 20 },
  textarea:    { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: COLORS.border },
  replyBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  replyBtnText:{ fontSize: 14, fontWeight: '700', color: COLORS.white },
  closeBtn:    { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginTop: 10 },
  closeBtnText:{ fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
});
