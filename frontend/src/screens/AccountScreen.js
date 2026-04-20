import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getStudentById } from '../services/studentApi';
import { COLORS } from '../theme';

export default function AccountScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        if (user?._id) {
          const { data } = await getStudentById(user._id);
          setStudent(data);
        }
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [user?._id]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'lock-closed-outline', label: 'Security', desc: 'Change password & security options' },
    { icon: 'help-circle-outline', label: 'Help & Support', desc: 'Get help or contact support' },
    { icon: 'document-text-outline', label: 'Terms & Privacy', desc: 'Read our terms and privacy policy' },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.title}>Account</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {student?.profileImage ? (
            <Image
              source={{ uri: student.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={36} color={COLORS.black} />
            </View>
          )}

          <Text style={styles.profileName}>
            {student?.firstName && student?.lastName
              ? `${student.firstName} ${student.lastName}`
              : user?.name}
          </Text>

          <Text style={styles.profileEmail}>
            {student?.email || user?.email}
          </Text>

          {student?.contactNo ? (
            <Text style={styles.profilePhone}>{student.contactNo}</Text>
          ) : null}

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'admin' ? '👑 Admin' : '🎓 Student Driver'}
            </Text>
          </View>
        </View>

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
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
  },
  title: { fontSize: 24, fontWeight: '600', color: COLORS.black },

  content: { padding: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 6,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  profilePhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
  },

  menuList: { gap: 8, marginBottom: 16 },
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
  menuIcon: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 10,
    padding: 8,
  },
  flex1: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  menuDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

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
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.red,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
  },
});