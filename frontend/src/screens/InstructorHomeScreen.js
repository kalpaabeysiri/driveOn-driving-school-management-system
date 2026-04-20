import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getInstructorById, getNotifications, markAllRead } from '../services/instructorVehicleApi';
import { COLORS } from '../theme';

export default function InstructorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [instructor, setInstructor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ins, notifs] = await Promise.all([
          getInstructorById(user._id),
          getNotifications(user._id),
        ]);
        setInstructor(ins.data);
        setNotifications(notifs.data);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchData();
    else setLoading(false);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(user._id);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
    } catch {}
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const unreadCount  = notifications.filter(n => n.status === 'Unread').length;
  const upcomingSessions = instructor?.sessions?.filter(
    s => s.status === 'Scheduled' || s.status === 'Ongoing'
  ) || [];
  const completedSessions = instructor?.sessions?.filter(
    s => s.status === 'Completed'
  ) || [];

  const notifTypeColors = {
    SessionAssigned: { bg: COLORS.greenBg, text: COLORS.green,       icon: 'calendar-outline'   },
    SessionCancelled:{ bg: COLORS.redBg,   text: COLORS.red,         icon: 'close-circle-outline'},
    InsuranceExpiry: { bg: '#FFF3CD',      text: '#856404',           icon: 'warning-outline'    },
    General:         { bg: COLORS.blueBg,  text: COLORS.blue,        icon: 'information-circle-outline' },
  };

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
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('InstructorNotifications', { instructorId: user._id })}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.black} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.instructorBadge}>
            <Ionicons name="car" size={14} color={COLORS.black} />
            <Text style={styles.instructorBadgeText}>Instructor</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}>Hello, {(instructor?.fullName || user?.fullName || 'Instructor').split(' ')[0]} 👋</Text>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(instructor?.fullName || user?.fullName || 'I')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.name}>{instructor?.fullName || user?.fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.spec}>{instructor?.specialization || 'Both'} · {instructor?.experience || 0} yrs exp</Text>
          </View>
          <View style={[styles.availBadge, {
            backgroundColor: instructor?.available ? COLORS.greenBg : COLORS.redBg,
          }]}>
            <Text style={[styles.availText, {
              color: instructor?.available ? COLORS.green : COLORS.red,
            }]}>{instructor?.available ? 'Available' : 'Busy'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Upcoming',   value: upcomingSessions.length    },
            { label: 'Completed',  value: completedSessions.length   },
            { label: 'Vehicles',   value: instructor?.assignedVehicles?.length || 0 },
            { label: 'Unread',     value: unreadCount                },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Categorised Quick Actions */}
        {[
          {
            title: 'My Work',
            icon:  'briefcase-outline',
            items: [
              { icon: 'calendar-outline',       label: 'My Sessions',  screen: 'Sessions',               color: COLORS.greenBg,    tab: true },
              { icon: 'notifications-outline',  label: 'Notifications', screen: 'InstructorNotifications', color: COLORS.brandYellow, params: { instructorId: user._id } },
            ],
          },
          {
            title: 'Account',
            icon:  'person-circle-outline',
            items: [
              { icon: 'person-outline', label: 'My Profile', screen: 'Account', color: COLORS.blueBg, tab: true },
            ],
          },
        ].map((group) => (
          <View key={group.title} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <Ionicons name={group.icon} size={15} color={COLORS.brandOrange} />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            <View style={styles.actionsGrid}>
              {group.items.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.actionCard, { backgroundColor: a.color }]}
                  onPress={() => a.tab ? navigation.jumpTo(a.screen) : navigation.navigate(a.screen, a.params)}
                >
                  <Ionicons name={a.icon} size={24} color={COLORS.black} />
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Assigned Vehicles */}
        {instructor?.assignedVehicles?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            {instructor.assignedVehicles.map((v) => (
              <View key={v._id} style={styles.vehicleCard}>
                <View style={styles.vehicleIcon}>
                  <Ionicons name="car-outline" size={22} color={COLORS.black} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.vehicleName}>{v.brand} {v.model}</Text>
                  <Text style={styles.vehicleMeta}>{v.licensePlate} · {v.vehicleType}</Text>
                </View>
                <View style={[styles.availBadge, {
                  backgroundColor: v.available ? COLORS.greenBg : COLORS.redBg,
                }]}>
                  <Text style={[styles.availText, { color: v.available ? COLORS.green : COLORS.red }]}>
                    {v.available ? 'Available' : 'In Use'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Notifications */}
        <View style={styles.notifHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyNotif}>
            <Ionicons name="notifications-off-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyNotifText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.slice(0, 5).map((n) => {
            const colors = notifTypeColors[n.type] || notifTypeColors.General;
            return (
              <View key={n._id} style={[styles.notifCard, n.status === 'Unread' && styles.notifCardUnread]}>
                <View style={[styles.notifIcon, { backgroundColor: colors.bg }]}>
                  <Ionicons name={colors.icon} size={18} color={colors.text} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.notifMessage}>{n.message}</Text>
                  <Text style={styles.notifDate}>{new Date(n.date).toLocaleDateString()}</Text>
                </View>
                {n.status === 'Unread' && <View style={styles.unreadDot} />}
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  logo:         { fontSize: 28, fontWeight: '800' },
  dateText:     { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  welcome:      { fontSize: 22, fontWeight: '700', color: COLORS.black, marginTop: 4, marginBottom: 20 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, alignItems: 'center', justifyContent: 'center' },
  notifBadge:    { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.red, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: COLORS.gray },
  notifBadgeText:{ fontSize: 9, fontWeight: '800', color: COLORS.white },
  instructorBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandYellow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  instructorBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  groupBlock:   { marginBottom: 20 },
  groupHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  groupTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.black },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:   { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  actionLabel:  { fontSize: 13, fontWeight: '700', color: COLORS.black },
  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.brandYellow, borderRadius: 20, padding: 16, marginBottom: 16 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '800', color: COLORS.black },
  flex1:        { flex: 1 },
  name:         { fontSize: 16, fontWeight: '700', color: COLORS.black },
  email:        { fontSize: 12, color: COLORS.textMuted },
  spec:         { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  availBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  availText:    { fontSize: 11, fontWeight: '700' },
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  statValue:    { fontSize: 20, fontWeight: '800', color: COLORS.black },
  statLabel:    { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  vehicleCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  vehicleIcon:  { backgroundColor: COLORS.brandYellow, borderRadius: 10, padding: 10 },
  vehicleName:  { fontSize: 14, fontWeight: '600', color: COLORS.black },
  vehicleMeta:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  notifHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  markAllText:  { fontSize: 13, fontWeight: '600', color: COLORS.brandOrange },
  emptyNotif:   { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyNotifText: { fontSize: 13, color: COLORS.textMuted },
  notifCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  notifCardUnread: { borderColor: COLORS.brandOrange, backgroundColor: '#FFF8ED' },
  notifIcon:    { borderRadius: 10, padding: 8 },
  notifMessage: { fontSize: 13, color: COLORS.black, lineHeight: 18 },
  notifDate:    { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brandOrange, marginTop: 4 },
});
