import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllRead } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

const notifIcons = {
  SessionAssigned:  { icon: 'calendar-outline',  bg: COLORS.blueBg,  color: COLORS.blue  },
  SessionCancelled: { icon: 'close-circle-outline',bg: COLORS.redBg,  color: COLORS.red   },
  InsuranceExpiry:  { icon: 'warning-outline',    bg: '#FFF3CD',      color: '#856404'    },
  MaintenanceDue:   { icon: 'construct-outline',  bg: COLORS.greenBg, color: COLORS.green },
  General:          { icon: 'notifications-outline',bg: COLORS.gray,  color: COLORS.textMuted },
};

export default function InstructorNotificationsScreen({ route, navigation }) {
  const { instructorId } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await getNotifications(instructorId);
      setNotifications(data);
    } catch {
      Alert.alert('Error', 'Could not load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      fetchNotifications();
    } catch {
      Alert.alert('Error', 'Could not mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(instructorId);
      fetchNotifications();
    } catch {
      Alert.alert('Error', 'Could not update notifications');
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  const renderNotification = ({ item }) => {
    const style  = notifIcons[item.type] || notifIcons.General;
    const isRead = item.status === 'Read';

    return (
      <TouchableOpacity
        style={[styles.card, isRead && styles.cardRead]}
        onPress={() => !isRead && handleMarkRead(item._id)}
      >
        <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
          <Ionicons name={style.icon} size={22} color={style.color} />
        </View>
        <View style={styles.flex1}>
          <Text style={[styles.message, isRead && styles.messageRead]}>{item.message}</Text>
          {item.session && (
            <Text style={styles.meta}>
              Session: {item.session.type} · {new Date(item.session.date).toDateString()}
            </Text>
          )}
          {item.vehicle && (
            <Text style={styles.meta}>
              Vehicle: {item.vehicle.brand} {item.vehicle.model} · {item.vehicle.licensePlate}
            </Text>
          )}
          <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
        </View>
        {!isRead && <View style={styles.unreadDot} />}
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
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.unreadCount}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  unreadCount: { fontSize: 11, color: COLORS.brandOrange, fontWeight: '600' },
  markAllText: { fontSize: 13, fontWeight: '600', color: COLORS.brandOrange },
  list:    { padding: 16, paddingBottom: 40 },
  card:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardRead:{ backgroundColor: COLORS.bgLight, borderColor: COLORS.borderLight },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  flex1:   { flex: 1 },
  message: { fontSize: 14, fontWeight: '600', color: COLORS.black, lineHeight: 20 },
  messageRead: { fontWeight: '400', color: COLORS.textMuted },
  meta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  date:    { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brandOrange, flexShrink: 0, marginTop: 4 },
  empty:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});
