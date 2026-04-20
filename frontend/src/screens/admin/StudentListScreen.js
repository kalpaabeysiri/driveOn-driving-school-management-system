import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllStudents, updateStudentStatus, deleteStudent } from '../../services/studentApi';
import { COLORS } from '../../theme';

export default function StudentListScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchStudents = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'All') params.status = filter;
      const { data } = await getAllStudents(params);
      setStudents(data);
    } catch {
      Alert.alert('Error', 'Could not load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStatusToggle = (student) => {
    const newStatus = student.accountStatus === 'Active' ? 'Suspended' : 'Active';

    Alert.alert(
      `${newStatus === 'Suspended' ? 'Suspend' : 'Activate'} Student`,
      `Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} ${student.firstName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'Suspended' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateStudentStatus(student._id, newStatus);
              fetchStudents();
            } catch {
              Alert.alert('Error', 'Could not update status');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (student) => {
    Alert.alert(
      'Delete Student',
      `Delete ${student.firstName} ${student.lastName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student._id);
              fetchStudents();
            } catch {
              Alert.alert('Error', 'Could not delete student');
            }
          },
        },
      ]
    );
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('StudentDetail', {
          studentId: item._id,
          isAdminView: true,
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.firstName[0]}{item.lastName[0]}
        </Text>
      </View>

      <View style={styles.flex1}>
        <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.meta}>{item.email}</Text>
        <Text style={styles.meta}>{item.contactNo} · {item.city}</Text>
        <Text style={styles.nic}>NIC: {item.NIC}</Text>
      </View>

      <View style={styles.actions}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                item.accountStatus === 'Active' ? COLORS.greenBg : COLORS.redBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: item.accountStatus === 'Active' ? COLORS.green : COLORS.red,
              },
            ]}
          >
            {item.accountStatus}
          </Text>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('EditStudent', { studentId: item._id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.blue} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => handleStatusToggle(item)}>
            <Ionicons
              name={item.accountStatus === 'Active' ? 'ban-outline' : 'checkmark-circle-outline'}
              size={18}
              color={item.accountStatus === 'Active' ? COLORS.red : COLORS.green}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.title}>Students</Text>

        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => navigation.navigate('MonthlyReport')}
          >
            <Ionicons name="bar-chart-outline" size={20} color={COLORS.black} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddStudent')}
          >
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, NIC..."
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {['All', 'Active', 'Suspended'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{students.length} students</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStudents();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>No students found</Text>
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
  backBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  headerBtns: { flexDirection: 'row', gap: 10 },
  reportBtn: { backgroundColor: COLORS.white, borderRadius: 12, padding: 8 },
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
  searchInput: { flex: 1, fontSize: 14, color: COLORS.black },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bgLight,
  },
  filterBtnActive: { backgroundColor: COLORS.brandYellow },
  filterText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.black, fontWeight: '700' },
  count: { marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted },

  list: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  flex1: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  nic: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },

  actions: { alignItems: 'flex-end', gap: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: COLORS.bgLight },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});