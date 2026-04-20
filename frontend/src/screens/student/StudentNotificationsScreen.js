import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { COLORS } from '../../theme';

const TYPE_ICONS = {
  Notice:           { icon: 'megaphone-outline',       color: COLORS.brandOrange },
  SessionAssigned:  { icon: 'calendar-outline',        color: COLORS.blue        },
  General:          { icon: 'information-circle-outline', color: COLORS.textMuted },
  InsuranceExpiry:  { icon: 'warning-outline',         color: COLORS.red         },
};

export default function StudentNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await getNotifications();
      const data = res.data.notifications || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status === 'Unread').length);
    } catch {
      Alert.alert('Error', 'Could not load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, status: 'Read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
      setUnreadCount(0);
    } catch {
      Alert.alert('Error', 'Could not mark all as read');
    }
  };

  const renderItem = ({ item }) => {
    const isUnread = item.status === 'Unread';
    const { icon, color } = TYPE_ICONS[item.type] || TYPE_ICONS.General;
    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={() => isUnread && handleMarkRead(item._id)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardType, { color }]}>{item.type || 'Notice'}</Text>
            {isUnread && <View style={styles.dot} />}
          </View>
          <Text style={styles.cardMsg}>{item.message}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.date || item.createdAt).toLocaleString()}
          </Text>
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
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="ellipse" size={10} color={COLORS.brandOrange} />
          <Text style={styles.unreadText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={52} color={COLORS.brandOrange} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>You'll see notices and updates here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.white },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:       { fontSize: 18, fontWeight: '600', color: COLORS.black },
  markAll:     { fontSize: 13, fontWeight: '600', color: COLORS.brandOrange },
  unreadBanner:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10 },
  unreadText:  { fontSize: 13, color: COLORS.brandOrange, fontWeight: '600' },
  list:        { padding: 16, paddingBottom: 40 },
  card:        { flexDirection: 'row', gap: 12, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardUnread:  { borderColor: COLORS.brandOrange, backgroundColor: '#FFFBF5' },
  iconBox:     { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardBody:    { flex: 1 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardType:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brandOrange },
  cardMsg:     { fontSize: 14, color: COLORS.black, lineHeight: 20, marginBottom: 6 },
  cardDate:    { fontSize: 11, color: COLORS.textMuted },
  empty:       { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle:  { fontSize: 16, fontWeight: '600', color: COLORS.black },
  emptySub:    { fontSize: 13, color: COLORS.textMuted },
});
