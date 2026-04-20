import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

export default function LoginScreen() {
  const { login, signing }  = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert('Error', 'Please enter your email and password');
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>
              <Text style={{ color: COLORS.black }}>Drive</Text>
              <Text style={{ color: COLORS.brandOrange }}>O</Text>
              <Text style={{ color: COLORS.black }}>n</Text>
            </Text>
            <Text style={styles.tagline}>Driving School Management System</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPass ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={signing}>
              {signing
                ? <ActivityIndicator color={COLORS.white} />
                : <>
                    <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                    <Text style={styles.btnText}>Sign In</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoText}>
                Use your registered email and password. Contact your admin if you need access.
              </Text>
            </View>
          </View>

          {/* Role pills */}
          <View style={styles.rolesRow}>
            {[
              { icon: 'shield-checkmark-outline', label: 'Admin' },
              { icon: 'person-outline',           label: 'Student' },
              { icon: 'car-outline',              label: 'Instructor' },
            ].map((r) => (
              <View key={r.label} style={styles.roleItem}>
                <Ionicons name={r.icon} size={20} color={COLORS.brandOrange} />
                <Text style={styles.roleLabel}>{r.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>© 2026 DriveOn. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {signing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Signing in...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.brandYellow },
  flex1:     { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },
  logoWrap:  { alignItems: 'center', marginBottom: 32 },
  logo:      { fontSize: 48, fontWeight: '800' },
  tagline:   { fontSize: 13, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  title:    { fontSize: 24, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  label:    { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, marginBottom: 16, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, fontSize: 14, paddingVertical: 12, color: COLORS.black },
  eyeBtn:    { padding: 4 },
  btn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
    marginTop: 4, marginBottom: 16,
  },
  btnText:  { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.bgLight, borderRadius: 10, padding: 12 },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  rolesRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  roleItem: { alignItems: 'center', gap: 4 },
  roleLabel:{ fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  footer: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 24 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
});
