import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVehicleById, updateVehicleStatus, deleteVehicle } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

const statusColors = {
  'Active':            { bg: COLORS.greenBg,  text: COLORS.green },
  'In Use':            { bg: COLORS.blueBg,   text: COLORS.blue  },
  'Under Maintenance': { bg: '#FFF3CD',        text: '#856404'    },
  'Retired':           { bg: COLORS.redBg,    text: COLORS.red   },
};

export default function VehicleDetailScreen({ navigation, route }) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const { data } = await getVehicleById(vehicleId);
        setVehicle(data);
      } catch {
        Alert.alert('Error', 'Could not load vehicle details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [vehicleId]);

  const handleStatusChange = (newStatus) => {
    Alert.alert(
      'Update Status',
      `Change vehicle status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateVehicleStatus(vehicleId, { usageStatus: newStatus });
              setVehicle({ ...vehicle, usageStatus: newStatus });
              Alert.alert('Success', 'Vehicle status updated');
            } catch {
              Alert.alert('Error', 'Could not update vehicle status');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Vehicle',
      `Delete ${vehicle?.brand} ${vehicle?.model}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              Alert.alert('Success', 'Vehicle deleted');
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not delete vehicle');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Vehicle not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const colors = statusColors[vehicle.usageStatus] || { bg: COLORS.gray, text: COLORS.textMuted };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddEditVehicle', { vehicleId })}>
          <Ionicons name="create-outline" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Vehicle Overview Card */}
        <View style={styles.card}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="car-outline" size={32} color={COLORS.black} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
              <Text style={styles.vehicleYear}>{vehicle.year}</Text>
              <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>{vehicle.usageStatus}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Specifications */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Vehicle Type</Text>
            <Text style={styles.specValue}>{vehicle.vehicleType}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Transmission</Text>
            <Text style={styles.specValue}>{vehicle.transmission}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Fuel Type</Text>
            <Text style={styles.specValue}>{vehicle.fuelType}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Capacity</Text>
            <Text style={styles.specValue}>{vehicle.capacity} seats</Text>
          </View>
        </View>

        {/* Owner Information */}
        {vehicle.owner && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Owner Information</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerIcon}>
                <Ionicons name="person-outline" size={20} color={COLORS.black} />
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{vehicle.owner.name}</Text>
                <Text style={styles.ownerContact}>{vehicle.owner.contact}</Text>
                {vehicle.owner.email && <Text style={styles.ownerEmail}>{vehicle.owner.email}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Status Management */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status Management</Text>
          <View style={styles.statusOptions}>
            {Object.keys(statusColors).filter(status => status !== 'Retired').map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  vehicle.usageStatus === status && styles.statusOptionActive,
                  { backgroundColor: statusColors[status].bg }
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <Text style={[
                  styles.statusOptionText,
                  vehicle.usageStatus === status && styles.statusOptionTextActive,
                  { color: statusColors[status].text }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delete Vehicle */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.sectionTitle}>Delete Vehicle</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            <Text style={styles.deleteBtnText}>Delete Vehicle</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  vehicleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  vehicleYear: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  licensePlate: { fontSize: 16, fontWeight: '700', color: COLORS.brandOrange, marginTop: 4 },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  specLabel: { fontSize: 14, color: COLORS.textMuted },
  specValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  ownerContact: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  ownerEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 1 },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionActive: {
    borderColor: COLORS.black,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    fontWeight: '700',
  },
  dangerCard: {
    borderColor: COLORS.red,
    backgroundColor: '#FFF5F5',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.redBg,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.red,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
