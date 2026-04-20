import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    if (password !== confirm) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }
    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password, phone.trim());
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.black }}>Drive</Text>
            <Text style={{ color: COLORS.brandOrange }}>O</Text>
            <Text style={{ color: COLORS.black }}>n</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your driving journey</Text>

          {[
            { label: 'Full Name *',       value: name,     setter: setName,     placeholder: 'John Silva',           type: 'default' },
            { label: 'Email *',           value: email,    setter: setEmail,    placeholder: 'you@example.com',      type: 'email-address' },
            { label: 'Phone',             value: phone,    setter: setPhone,    placeholder: '077 123 4567',         type: 'phone-pad' },
            { label: 'Password *',        value: password, setter: setPassword, placeholder: 'Min 6 characters',     type: 'default', secure: true },
            { label: 'Confirm Password *',value: confirm,  setter: setConfirm,  placeholder: 'Re-enter password',    type: 'default', secure: true },
          ].map((field) => (
            <View key={field.label}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.type}
                secureTextEntry={!!field.secure}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.brandYellow },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },
  logoWrap:  { alignItems: 'center', marginBottom: 24 },
  logo:      { fontSize: 42, fontWeight: '800' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title:    { fontSize: 24, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  label:    { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  btnText:  { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  link:     { textAlign: 'center', fontSize: 13, color: COLORS.textMuted },
  linkBold: { color: COLORS.brandOrange, fontWeight: '700' },
});
