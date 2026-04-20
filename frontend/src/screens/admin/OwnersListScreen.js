import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllOwners, deleteOwner } from '../../services/ownerApi';
import { COLORS } from '../../theme';

export default function OwnersListScreen({ navigation }) {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);

  const fetchOwners = async () => {
    try {
      const { data } = await getAllOwners();
      setOwners(data);
    } catch {
      Alert.alert('Error', 'Could not load owners');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleDelete = (owner) => {
    Alert.alert(
      'Delete Owner',
      `Delete ${owner.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOwner(owner._id);
              setOwners(prev => prev.filter(o => o._id !== owner._id));
              Alert.alert('Success', 'Owner deleted successfully');
            } catch {
              Alert.alert('Error', 'Could not delete owner');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (owner) => {
    navigation.navigate('AddEditOwner', {
      ownerId: owner._id,
      onOwnerUpdated: (updatedOwner) => {
        setOwners(prev => prev.map(o => o._id === updatedOwner._id ? updatedOwner : o));
        Alert.alert('Success', `${updatedOwner.name} has been updated!`);
      }
    });
  };

  const filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(search.toLowerCase()) ||
    owner.email.toLowerCase().includes(search.toLowerCase()) ||
    owner.contactNumber.includes(search)
  );

  const renderOwner = ({ item }) => (
    <TouchableOpacity style={styles.ownerCard} onPress={() => setSelectedOwner(item)} activeOpacity={0.7}>
      <View style={styles.ownerInfo}>
        <View style={styles.ownerIcon}>
          <Ionicons name="person-outline" size={20} color={COLORS.black} />
        </View>
        <View style={styles.ownerDetails}>
          <Text style={styles.ownerName}>{item.name}</Text>
          <Text style={styles.ownerMeta}>{item.contactNumber}</Text>
          <Text style={styles.ownerMeta}>{item.email}</Text>
          {item.address && <Text style={styles.ownerAddress}>{item.address}</Text>}
        </View>
      </View>
      <View style={styles.ownerActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={18} color={COLORS.blue} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* Owner Detail Modal */}
      <Modal
        visible={!!selectedOwner}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOwner(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedOwner(null)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="person" size={28} color={COLORS.black} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>{selectedOwner?.name}</Text>
                <Text style={styles.modalNIC}>NIC: {selectedOwner?.NIC}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOwner(null)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {[
                { icon: 'call-outline',     label: 'Contact',  value: selectedOwner?.contactNumber },
                { icon: 'mail-outline',     label: 'Email',    value: selectedOwner?.email },
                { icon: 'location-outline', label: 'Address',  value: selectedOwner?.address },
                { icon: 'car-outline',      label: 'Vehicles', value: selectedOwner?.vehicles?.length ? `${selectedOwner.vehicles.length} vehicle(s) registered` : 'No vehicles linked' },
              ].map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons name={row.icon} size={18} color={COLORS.brandOrange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value || '—'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => { setSelectedOwner(null); handleEdit(selectedOwner); }}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.white} />
                <Text style={styles.editBtnText}>Edit Owner</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => { setSelectedOwner(null); handleDelete(selectedOwner); }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Owners</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddEditOwner')}>
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by name, email, or phone..." 
            value={search} 
            onChangeText={setSearch} 
          />
        </View>
      </View>

      <FlatList
        data={filteredOwners}
        keyExtractor={(item) => item._id}
        renderItem={renderOwner}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              fetchOwners();
            }} 
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>
              {search ? 'No owners found matching your search' : 'No owners registered yet'}
            </Text>
            {!search && (
              <TouchableOpacity 
                style={styles.emptyAddBtn} 
                onPress={() => navigation.navigate('AddEditOwner')}
              >
                <Text style={styles.emptyAddBtnText}>Add First Owner</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: '600', color: COLORS.black },
  addBtn: { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  searchRow: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  ownerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerDetails: { flex: 1 },
  ownerName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  ownerMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  ownerAddress: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  ownerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center' },
  emptyAddBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyAddBtnText: { color: COLORS.white, fontWeight: '600' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center', justifyContent: 'center',
  },
  modalName: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  modalNIC:  { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  modalBody: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detailIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.brandOrange + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2, fontWeight: '600' },
  detailValue: { fontSize: 14, color: COLORS.black, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.brandOrange, borderRadius: 14, paddingVertical: 14,
  },
  editBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    width: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.redBg || '#FFF0F0', borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.red,
  },
});
