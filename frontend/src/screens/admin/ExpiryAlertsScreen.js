import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getExpiryAlerts } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function ExpiryAlertsScreen({ navigation }) {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await getExpiryAlerts();
        setAlerts(data);
      } catch {
        Alert.alert('Error', 'Could not load alerts');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expiry Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {alerts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.green} />
            <Text style={styles.emptyTitle}>All Good!</Text>
            <Text style={styles.emptyText}>No upcoming expiries in the next 30 days.</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryBanner}>
              <Ionicons name="warning-outline" size={20} color="#856404" />
              <Text style={styles.summaryText}>{alerts.length} vehicle(s) need attention</Text>
            </View>

            {alerts.map((alert, i) => (
              <View key={i} style={styles.alertCard}>
                <View style={styles.vehicleRow}>
                  <View style={styles.vehicleIcon}>
                    <Ionicons name="car-outline" size={20} color={COLORS.black} />
                  </View>
                  <View>
                    <Text style={styles.vehicleName}>
                      {alert.vehicle?.brand} {alert.vehicle?.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>{alert.vehicle?.licensePlate}</Text>
                  </View>
                </View>

                {alert.issues.map((issue, j) => (
                  <View key={j} style={[styles.issueRow, { backgroundColor: issue.urgent ? COLORS.redBg : '#FFF3CD' }]}>
                    <Ionicons
                      name={issue.urgent ? 'alert-circle-outline' : 'time-outline'}
                      size={16}
                      color={issue.urgent ? COLORS.red : '#856404'}
                    />
                    <View style={styles.flex1}>
                      <Text style={[styles.issueType, { color: issue.urgent ? COLORS.red : '#856404' }]}>
                        {issue.type}
                      </Text>
                      <Text style={styles.issueMessage}>{issue.message}</Text>
                      <Text style={styles.issueDate}>
                        Date: {new Date(issue.date).toDateString()}
                      </Text>
                    </View>
                    {issue.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.updateBtn}
                  onPress={() => navigation.navigate('VehicleDetail', { vehicleId: alert.vehicle?._id })}
                >
                  <Text style={styles.updateBtnText}>Update Details →</Text>
                </TouchableOpacity>
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
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  empty:   { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  emptyText:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  summaryBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF3CD', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FFEAA7' },
  summaryText: { fontSize: 14, fontWeight: '600', color: '#856404' },
  alertCard: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, overflow: 'hidden' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  vehicleIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  vehiclePlate: { fontSize: 13, fontWeight: '700', color: COLORS.brandOrange },
  issueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, marginHorizontal: 14, marginTop: 10, borderRadius: 10 },
  flex1:   { flex: 1 },
  issueType: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  issueMessage: { fontSize: 13, color: COLORS.textDark },
  issueDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  urgentBadge: { backgroundColor: COLORS.red, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  urgentText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  updateBtn: { margin: 14, marginTop: 10, backgroundColor: COLORS.bgLight, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  updateBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.brandOrange },
});
