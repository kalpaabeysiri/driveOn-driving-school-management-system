import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getInstructorById, getNotifications, markAllRead } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function InstructorDashboardScreen({ route, navigation }) {
  const { instructorId, fullName } = route.params;

  const [instructor,     setInstructor]     = useState(null);
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);

  const fetchData = async () => {
    try {
      const [ins, notifs] = await Promise.all([
        getInstructorById(instructorId),
        getNotifications(instructorId),
      ]);
      setInstructor(ins.data);
      setNotifications(notifs.data);
    } catch {
      Alert.alert('Error', 'Could not load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('instructorToken');
          await SecureStore.deleteItemAsync('instructorId');
          await SecureStore.deleteItemAsync('instructorName');
          navigation.replace('InstructorLogin');
        },
      },
    ]);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(instructorId);
      fetchData();
    } catch {
      Alert.alert('Error', 'Could not update notifications');
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.brandOrange} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
          <Text style={styles.portalText}>Instructor Portal</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(fullName || 'I').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.instructorName}>{fullName}</Text>
            <Text style={styles.instructorEmail}>{instructor?.email}</Text>
            <View style={[styles.availBadge, {
              backgroundColor: instructor?.available ? COLORS.greenBg : COLORS.redBg,
            }]}>
              <Text style={[styles.availText, {
                color: instructor?.available ? COLORS.green : COLORS.red,
              }]}>
                {instructor?.available ? '✓ Available' : '✗ Unavailable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Sessions',         value: instructor?.sessions?.length       || 0 },
            { label: 'Vehicles',         value: instructor?.assignedVehicles?.length|| 0 },
            { label: 'Notifications',    value: notifications.length },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.notifHeader}>
          <Text style={styles.sectionTitle}>
            Notifications {unreadCount > 0 && (
              <Text style={styles.unreadBadge}> {unreadCount} new</Text>
            )}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyNotif}>
            <Ionicons name="notifications-off-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <View
              key={notif._id}
              style={[styles.notifCard, notif.status === 'Read' && styles.notifCardRead]}
            >
              <View style={[styles.notifIcon, {
                backgroundColor: notif.type === 'SessionAssigned'  ? COLORS.blueBg  :
                                 notif.type === 'SessionCancelled' ? COLORS.redBg   :
                                 notif.type === 'InsuranceExpiry'  ? '#FFF3CD'      : COLORS.gray,
              }]}>
                <Ionicons
                  name={
                    notif.type === 'SessionAssigned'  ? 'calendar-outline'      :
                    notif.type === 'SessionCancelled' ? 'close-circle-outline'  :
                    notif.type === 'InsuranceExpiry'  ? 'warning-outline'       :
                    'notifications-outline'
                  }
                  size={20}
                  color={
                    notif.type === 'SessionAssigned'  ? COLORS.blue    :
                    notif.type === 'SessionCancelled' ? COLORS.red     :
                    notif.type === 'InsuranceExpiry'  ? '#856404'      :
                    COLORS.textMuted
                  }
                />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.notifMessage, notif.status === 'Read' && styles.notifMessageRead]}>
                  {notif.message}
                </Text>
                <Text style={styles.notifDate}>
                  {new Date(notif.date).toLocaleString()}
                </Text>
              </View>
              {notif.status === 'Unread' && <View style={styles.unreadDot} />}
            </View>
          ))
        )}

        {/* Assigned Vehicles */}
        {instructor?.assignedVehicles?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Assigned Vehicles</Text>
            {instructor.assignedVehicles.map((v) => (
              <View key={v._id} style={styles.vehicleCard}>
                <Ionicons name="car-outline" size={20} color={COLORS.black} />
                <View style={styles.flex1}>
                  <Text style={styles.vehicleName}>{v.brand} {v.model}</Text>
                  <Text style={styles.vehiclePlate}>{v.licensePlate}</Text>
                </View>
                <View style={[styles.availBadge, {
                  backgroundColor: v.available ? COLORS.greenBg : COLORS.redBg,
                }]}>
                  <Text style={[styles.availText, {
                    color: v.available ? COLORS.green : COLORS.red,
                  }]}>{v.usageStatus}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  logo:       { fontSize: 28, fontWeight: '800' },
  portalText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  logoutBtn:  { padding: 8, backgroundColor: COLORS.redBg, borderRadius: 12 },
  content:    { padding: 20, paddingBottom: 40 },
  profileCard:{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.brandYellow, borderRadius: 20, padding: 16, marginBottom: 16 },
  avatar:     { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  flex1:      { flex: 1 },
  instructorName:  { fontSize: 18, fontWeight: '700', color: COLORS.black },
  instructorEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  availBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  availText:  { fontSize: 11, fontWeight: '700' },
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:   { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue:  { fontSize: 20, fontWeight: '700', color: COLORS.brandOrange },
  statLabel:  { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  notifHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:{ fontSize: 16, fontWeight: '600', color: COLORS.black },
  unreadBadge:{ fontSize: 13, color: COLORS.brandOrange, fontWeight: '700' },
  markAllText:{ fontSize: 13, fontWeight: '600', color: COLORS.brandOrange },
  emptyNotif: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText:  { fontSize: 14, color: COLORS.textMuted },
  notifCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  notifCardRead: { backgroundColor: COLORS.bgLight, borderColor: COLORS.borderLight },
  notifIcon:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifMessage:    { fontSize: 13, fontWeight: '600', color: COLORS.black, lineHeight: 20 },
  notifMessageRead:{ fontWeight: '400', color: COLORS.textMuted },
  notifDate:  { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  unreadDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brandOrange, flexShrink: 0, marginTop: 4 },
  vehicleCard:{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgLight, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  vehicleName:{ fontSize: 14, fontWeight: '600', color: COLORS.black },
  vehiclePlate:{ fontSize: 12, fontWeight: '700', color: COLORS.brandOrange, marginTop: 2 },
});