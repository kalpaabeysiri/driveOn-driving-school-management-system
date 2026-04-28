import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { instructorLogin } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function InstructorLoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Please enter email and password');
    }
    try {
      setLoading(true);
      const { data } = await instructorLogin({ email: email.trim(), password });

      // Save instructor token and info
      await SecureStore.setItemAsync('instructorToken', data.token);
      await SecureStore.setItemAsync('instructorId',    data._id);
      await SecureStore.setItemAsync('instructorName',  data.fullName);

      // Navigate to instructor main
      navigation.replace('InstructorMain');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header with logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
          <Text style={styles.tagline}>Instructor Portal</Text>
        </View>

        {/* Welcome card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-outline" size={32} color={COLORS.brandOrange} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to manage your sessions and student attendance</Text>

          {/* Email input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          {/* Password input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
          </View>

          {/* Login button */}
          <TouchableOpacity 
            style={[styles.btn, (!email || !password || loading) && styles.btnDisabled]} 
            onPress={handleLogin} 
            disabled={!email || !password || loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                  <Text style={styles.btnText}>Sign In</Text>
                </>
              )
            }
          </TouchableOpacity>

          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={16} color={COLORS.textMuted} />
            <Text style={styles.backText}>Back to main login</Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Need help? Contact your administrator</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bgLight },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 32 },
  logo:      { fontSize: 48, fontWeight: '800' },
  tagline:   { fontSize: 15, color: COLORS.textMuted, marginTop: 6, fontWeight: '500' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brandOrange + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  title:    { fontSize: 26, fontWeight: '700', color: COLORS.black, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 28, textAlign: 'center', lineHeight: 20 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginBottom: 16,
  },
  inputIcon: { paddingHorizontal: 14 },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontSize: 15,
    color: COLORS.black,
  },
  btn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  btnDisabled: {
    backgroundColor: COLORS.gray,
  },
  btnText:  { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  footer:    { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});