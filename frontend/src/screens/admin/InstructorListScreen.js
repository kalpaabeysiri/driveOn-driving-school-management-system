import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllInstructors, deleteInstructor } from '../../services/instructorVehicleApi';
import { COLORS } from '../../theme';

export default function InstructorListScreen({ navigation }) {
  const [instructors, setInstructors] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');

  const fetchInstructors = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filter === 'Available')   params.available = true;
      if (filter === 'Unavailable') params.available = false;
      const { data } = await getAllInstructors(params);
      setInstructors(data);
    } catch {
      Alert.alert('Error', 'Could not load instructors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => { fetchInstructors(); }, [fetchInstructors]);

  const handleDelete = (instructor) => {
    Alert.alert('Delete Instructor', `Delete ${instructor.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteInstructor(instructor._id);
            fetchInstructors();
          } catch {
            Alert.alert('Error', 'Could not delete instructor');
          }
        },
      },
    ]);
  };

  const renderInstructor = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InstructorDetail', { instructorId: item._id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.fullName || 'I').split(' ').map(n => n[0]).join('').slice(0, 2)}
        </Text>
      </View>
      <View style={styles.flex1}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.meta}>{item.email}</Text>
        <Text style={styles.meta}>{item.contactNumber}</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.specialization || 'Both'}</Text>
          </View>
          {item.assignedVehicles?.length > 0 && (
            <View style={[styles.tag, { backgroundColor: COLORS.blueBg }]}>
              <Text style={[styles.tagText, { color: COLORS.blue }]}>
                {item.assignedVehicles.length} vehicle(s)
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <View style={[styles.badge, {
          backgroundColor: item.available ? COLORS.greenBg : COLORS.redBg,
        }]}>
          <Text style={[styles.badgeText, {
            color: item.available ? COLORS.green : COLORS.red,
          }]}>{item.available ? 'Available' : 'Busy'}</Text>
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('AddEditInstructor', { instructorId: item._id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.blue} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Instructors</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddEditInstructor')}>
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, NIC..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {['All', 'Available', 'Unavailable'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{instructors.length} total</Text>
      </View>

      <FlatList
        data={instructors}
        keyExtractor={(item) => item._id}
        renderItem={renderInstructor}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInstructors(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No instructors found</Text>
          </View>
        }
      />
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
  title:        { fontSize: 24, fontWeight: '600', color: COLORS.black },
  addBtn:       { backgroundColor: COLORS.brandYellow, borderRadius: 12, padding: 8 },
  searchRow:    { padding: 16, paddingBottom: 8 },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:  { flex: 1, fontSize: 14 },
  filterRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bgLight },
  filterBtnActive: { backgroundColor: COLORS.brandYellow },
  filterText:   { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.black, fontWeight: '700' },
  count:        { marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted },
  list:         { padding: 16, paddingBottom: 40 },
  card:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.brandYellow, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 15, fontWeight: '700', color: COLORS.black },
  flex1:        { flex: 1 },
  name:         { fontSize: 15, fontWeight: '600', color: COLORS.black },
  meta:         { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  tagsRow:      { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag:          { backgroundColor: COLORS.brandYellow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:      { fontSize: 10, fontWeight: '600', color: COLORS.black },
  actions:      { alignItems: 'flex-end', gap: 6 },
  badge:        { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { fontSize: 10, fontWeight: '700' },
  actionBtns:   { flexDirection: 'row', gap: 4 },
  iconBtn:      { padding: 6, borderRadius: 8, backgroundColor: COLORS.bgLight },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:    { fontSize: 15, color: COLORS.textMuted },
});
