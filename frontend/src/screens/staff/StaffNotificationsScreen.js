import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { COLORS } from '../../theme';

const StaffNotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, status: 'Read' } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'Read' }))
      );
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SessionAssigned':
      case 'SessionCancelled':
        return 'calendar-outline';
      case 'ExamScheduled':
      case 'ExamResult':
        return 'document-text-outline';
      case 'PaymentReminder':
        return 'card-outline';
      case 'Notice':
      case 'General':
        return 'megaphone-outline';
      case 'SystemUpdate':
        return 'settings-outline';
      case 'Holiday':
        return 'beer-outline';
      case 'Urgent':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'Urgent') return COLORS.red;
    if (priority === 'High') return COLORS.brandOrange;
    
    switch (type) {
      case 'ExamScheduled':
      case 'ExamResult':
        return COLORS.blue;
      case 'PaymentReminder':
        return COLORS.purple;
      case 'SystemUpdate':
        return COLORS.green;
      default:
        return COLORS.gray;
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.status === 'Unread' && styles.unreadNotification
      ]}
      onPress={() => {
        if (item.status === 'Unread') {
          handleMarkAsRead(item._id);
        }
        // Handle navigation if actionUrl exists
        if (item.actionUrl) {
          Alert.alert('Navigation', 'Would navigate to: ' + item.actionUrl);
        }
      }}
    >
      <View style={styles.notificationLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type, item.priority) + '20' }
        ]}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={20}
            color={getNotificationColor(item.type, item.priority)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationMessage,
            item.status === 'Unread' && styles.unreadText
          ]}>
            {item.message}
          </Text>
          <View style={styles.notificationMeta}>
            <Text style={styles.notificationTime}>
              {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.priority !== 'Normal' && (
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getNotificationColor(item.type, item.priority) }
              ]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {item.status === 'Unread' && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => {
    const unreadCount = notifications.filter(n => n.status === 'Unread').length;
    
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotificationItem}
        ListHeaderComponent={renderHeader()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
            colors={[COLORS.brandOrange]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Ionicons name="notifications-off-outline" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.brandOrange + '20',
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.brandOrange,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  unreadNotification: {
    backgroundColor: '#fff8f0',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    color: COLORS.black,
    marginBottom: 6,
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brandOrange,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default StaffNotificationsScreen;
