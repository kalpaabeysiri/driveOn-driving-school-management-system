import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStaff, deleteStaff } from '../../../services/api';
import { COLORS } from '../../../theme';

export default function StaffListScreen({ navigation }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      const params = {};

      if (search) {
        params.search = search;
      }

      const response = await getStaff(params);
      setStaff(response.data.staff || []);
    } catch (error) {
      console.error('Load staff error:', error);
      Alert.alert('Error', 'Could not load staff');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = staffMember => {
    Alert.alert('Deactivate Staff', `Deactivate ${staffMember.fullName}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStaff(staffMember._id);
            fetchStaff();
          } catch (error) {
            console.error('Delete staff error:', error);
            Alert.alert('Error', 'Could not deactivate staff');
          }
        },
      },
    ]);
  };

  const renderStaffItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EditStaff', { staffId: item._id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.fullName || 'S')
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Text>
      </View>

      <View style={styles.flex1}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.meta}>{item.email}</Text>
        <Text style={styles.meta}>{item.contactNumber}</Text>

        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: COLORS.blueBg }]}>
            <Text style={[styles.tagText, { color: COLORS.blue }]}>
              {item.position || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: item.isActive ? COLORS.greenBg : COLORS.redBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: item.isActive ? COLORS.green : COLORS.red,
              },
            ]}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('EditStaff', { staffId: item._id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.blue} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleDelete(item)}
          >
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.title}>Staff</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.attendBtn}
            onPress={() => navigation.navigate('StaffAttendance')}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={18}
              color={COLORS.black}
            />
            <Text style={styles.attendBtnText}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateStaff')}
          >
            <Ionicons name="add" size={22} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color={COLORS.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, NIC..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.count}>{staff.length} total</Text>
      </View>

      <FlatList
        data={staff}
        keyExtractor={item => item._id}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStaff();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="people-outline"
              size={48}
              color={COLORS.brandOrange}
            />
            <Text style={styles.emptyText}>No staff found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  addBtn: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 12,
    padding: 8,
  },

  attendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  attendBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },

  searchRow: {
    padding: 16,
    paddingBottom: 8,
  },

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

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },

  countRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'flex-end',
  },

  count: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

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

  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  flex1: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },

  meta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },

  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  actions: {
    alignItems: 'flex-end',
    gap: 6,
  },

  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  actionBtns: {
    flexDirection: 'row',
    gap: 4,
  },

  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.bgLight,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },

  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
});