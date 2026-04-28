import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getSessions, getProgress, updateProfile } from '../services/api';
import { COLORS } from '../theme';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const [sessions,  setSessions]  = useState([]);
  const [progress,  setProgress]  = useState([]);
  const [editing,   setEditing]   = useState(false);
  const [name,      setName]      = useState(user?.name  || '');
  const [phone,     setPhone]     = useState(user?.phone || '');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, p] = await Promise.all([getSessions(), getProgress()]);
        setSessions(s.data);
        setProgress(p.data);
      } catch (err) {
        console.log(err.message);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    try {
      setSaving(true);
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const done      = sessions.filter(s => s.status === 'Completed').length;
  const upcoming  = sessions.filter(s => s.status === 'Pending' || s.status === 'Confirmed').length;
  const avgScore  = progress.length
    ? Math.round(progress.reduce((a, b) => a + b.score, 0) / progress.length)
    : 0;

  const menuItems = [
    { icon: 'notifications-outline', label: 'Notifications',    desc: 'Manage notification preferences' },
    { icon: 'lock-closed-outline',   label: 'Security',         desc: 'Change password & security options' },
    { icon: 'help-circle-outline',   label: 'Help & Support',   desc: 'Get help or contact support' },
    { icon: 'document-text-outline', label: 'Terms & Privacy',  desc: 'Read our terms and privacy policy' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color={COLORS.black} />
          </View>
          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
              <TextInput
                style={styles.editInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.saveBtnText}>Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.phone && <Text style={styles.profilePhone}>{user.phone}</Text>}
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role === 'admin' ? '👑 Admin' : '🎓 Student Driver'}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Sessions Done', value: done },
            { label: 'Upcoming',      value: upcoming },
            { label: 'Avg Score',     value: `${avgScore}%` },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={COLORS.black} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DriveOn v1.0.0 · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title:        { fontSize: 24, fontWeight: '600', color: COLORS.black },
  content:      { padding: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileName:  { fontSize: 20, fontWeight: '700', color: COLORS.black },
  profileEmail: { fontSize: 13, color: COLORS.textMuted },
  profilePhone: { fontSize: 13, color: COLORS.textMuted },
  roleBadge:    { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleText:     { fontSize: 13, fontWeight: '600', color: COLORS.black },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  editBtnText:    { fontSize: 13, fontWeight: '700', color: COLORS.black },
  editForm:       { width: '100%', gap: 10 },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    width: '100%',
  },
  editActions:    { flexDirection: 'row', gap: 10 },
  cancelEditBtn:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelEditText: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  saveBtn:        { flex: 1, backgroundColor: COLORS.brandOrange, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  saveBtnText:    { fontSize: 13, fontWeight: '700', color: COLORS.white },
  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue:   { fontSize: 20, fontWeight: '700', color: COLORS.brandOrange },
  statLabel:   { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  menuList:    { gap: 8, marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
  },
  menuIcon:    { backgroundColor: COLORS.brandYellow, borderRadius: 10, padding: 8 },
  flex1:       { flex: 1 },
  menuLabel:   { fontSize: 14, fontWeight: '600', color: COLORS.black },
  menuDesc:    { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.red },
  version:    { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
});
