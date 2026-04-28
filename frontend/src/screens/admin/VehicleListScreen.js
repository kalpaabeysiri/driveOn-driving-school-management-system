import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllVehicles, deleteVehicle, getExpiryAlerts } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

const statusColors = {
  'Active':            { bg: COLORS.greenBg,  text: COLORS.green },
  'In Use':            { bg: COLORS.blueBg,   text: COLORS.blue  },
  'Under Maintenance': { bg: '#FFF3CD',        text: '#856404'    },
  'Retired':           { bg: COLORS.redBg,    text: COLORS.red   },
};

export default function VehicleListScreen({ navigation }) {
  const [vehicles,  setVehicles]  = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'All') params.vehicleType = filter;
      const [v, a] = await Promise.all([getAllVehicles(params), getExpiryAlerts()]);
      setVehicles(v.data);
      setAlerts(a.data);
    } catch {
      Alert.alert('Error', 'Could not load vehicles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = (vehicle) => {
    Alert.alert('Delete Vehicle', `Delete ${vehicle.brand} ${vehicle.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteVehicle(vehicle._id); fetchAll(); }
          catch { Alert.alert('Error', 'Could not delete vehicle'); }
        },
      },
    ]);
  };

  const renderVehicle = ({ item }) => {
    const colors    = statusColors[item.usageStatus] || { bg: COLORS.gray, text: COLORS.textMuted };
    const hasAlert  = alerts.some(a => a.vehicle?._id === item._id || a.vehicle === item._id);

    return (
      <TouchableOpacity
        style={[styles.card, hasAlert && styles.cardAlert]}
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
      >
        <View style={styles.vehicleIcon}>
          <Ionicons name="car-outline" size={24} color={COLORS.black} />
          {hasAlert && <View style={styles.alertDot} />}
        </View>
        <View style={styles.flex1}>
          <Text style={styles.name}>{item.brand} {item.model} ({item.year})</Text>
          <Text style={styles.plate}>{item.licensePlate}</Text>
          <Text style={styles.meta}>{item.vehicleType} · {item.transmission} · {item.fuelType}</Text>
          {item.owner && <Text style={styles.meta}>Owner: {item.owner.name}</Text>}
        </View>
        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.usageStatus}</Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddEditVehicle', { vehicleId: item._id })}>
              <Ionicons name="create-outline" size={18} color={COLORS.blue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        </View>
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
        <Text style={styles.title}>Vehicles</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.ownersBtn} onPress={() => navigation.navigate('OwnersList')}>
            <Ionicons name="people-outline" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('VehicleUsageReport')}>
            <Ionicons name="bar-chart-outline" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddEditVehicle')}>
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expiry Alerts Banner */}
      {alerts.length > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={() => navigation.navigate('ExpiryAlerts')}>
          <Ionicons name="warning-outline" size={18} color="#856404" />
          <Text style={styles.alertBannerText}>
            {alerts.length} vehicle(s) have expiring documents — Tap to view
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#856404" />
        </TouchableOpacity>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search by plate, brand, model..." value={search} onChangeText={setSearch} />
        </View>
      </View>

      <View style={styles.filterRow}>
        {['All', 'Car', 'Van', 'Motorcycle', 'Bus'].map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="car-outline" size={48} color={COLORS.brandOrange} /><Text style={styles.emptyText}>No vehicles found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title:   { fontSize: 24, fontWeight: '600', color: COLORS.black },
  headerBtns: { flexDirection: 'row', gap: 10 },
  ownersBtn:  { backgroundColor: COLORS.blueBg, borderRadius: 12, padding: 8 },
  reportBtn:  { backgroundColor: COLORS.white, borderRadius: 12, padding: 8 },
  addBtn:     { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  alertBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF3CD', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FFEAA7' },
  alertBannerText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#856404' },
  searchRow: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bgLight },
  filterBtnActive: { backgroundColor: COLORS.brandYellow },
  filterText: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.black, fontWeight: '700' },
  list:    { padding: 16, paddingBottom: 40 },
  card:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardAlert: { borderColor: '#FFEAA7', backgroundColor: '#FFFDF0' },
  vehicleIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  alertDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.red, borderWidth: 2, borderColor: COLORS.white },
  flex1:   { flex: 1 },
  name:    { fontSize: 15, fontWeight: '600', color: COLORS.black },
  plate:   { fontSize: 13, fontWeight: '700', color: COLORS.brandOrange, marginTop: 1 },
  meta:    { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  actions: { alignItems: 'flex-end', gap: 6 },
  badge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: COLORS.bgLight },
  empty:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});
