import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import {
  getAvailableSessions,
  bookSession,
  getMyBookedSessions,
} from '../../services/sessionApi';

import { COLORS } from '../../theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STATUS_COLORS = {
  Scheduled: { bg: COLORS.blueBg, text: COLORS.blue },
  Ongoing: { bg: '#FFF3CD', text: '#856404' },
  Completed: { bg: COLORS.greenBg, text: COLORS.green },
  Cancelled: { bg: COLORS.redBg, text: COLORS.red },
};

export default function AvailableSessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [bookingId, setBookingId] = useState(null);
  const [reminderLoadingId, setReminderLoadingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [avail, booked] = await Promise.all([
        getAvailableSessions(),
        getMyBookedSessions(),
      ]);

      setSessions(avail.data || []);
      setMyBookings(booked.data || []);
    } catch (error) {
      console.log('Load sessions error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('booking-reminders', {
          name: 'Booking Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF7A00',
        });
      }

      const currentPermission = await Notifications.getPermissionsAsync();

      if (currentPermission.status === 'granted') {
        return true;
      }

      const requestedPermission = await Notifications.requestPermissionsAsync();

      return requestedPermission.status === 'granted';
    } catch (error) {
      console.log('Notification permission error:', error);
      return false;
    }
  };

  const parseSessionDateTime = (dateValue, startTime) => {
    if (!dateValue || !startTime) {
      return null;
    }

    const sessionDate = new Date(dateValue);

    if (Number.isNaN(sessionDate.getTime())) {
      return null;
    }

    const cleanTime = String(startTime).trim();

    /*
      Supports:
      09:30
      9:30
      09:30 AM
      9:30 PM
    */
    const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

    if (!timeMatch) {
      return null;
    }

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const period = timeMatch[3]?.toUpperCase();

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (period) {
      if (hours < 1 || hours > 12) {
        return null;
      }

      if (period === 'PM' && hours < 12) {
        hours += 12;
      }

      if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    } else {
      if (hours < 0 || hours > 23) {
        return null;
      }
    }

    sessionDate.setHours(hours);
    sessionDate.setMinutes(minutes);
    sessionDate.setSeconds(0);
    sessionDate.setMilliseconds(0);

    return sessionDate;
  };

  const buildDateTrigger = (reminderTime) => {
    if (Notifications.SchedulableTriggerInputTypes?.DATE) {
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
        channelId: Platform.OS === 'android' ? 'booking-reminders' : undefined,
      };
    }

    return reminderTime;
  };

  const setBookingReminder = async (booking) => {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission Needed',
        'Please allow notifications from your phone settings to set booking reminders.'
      );
      return;
    }

    Alert.alert('Set Reminder', 'When do you want to be reminded?', [
      {
        text: '10 minutes before',
        onPress: () => scheduleReminder(booking, 10),
      },
      {
        text: '30 minutes before',
        onPress: () => scheduleReminder(booking, 30),
      },
      {
        text: '1 hour before',
        onPress: () => scheduleReminder(booking, 60),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const scheduleReminder = async (booking, minutesBefore) => {
    try {
      setReminderLoadingId(booking._id);

      const sessionDate = parseSessionDateTime(booking.date, booking.startTime);

      if (!sessionDate) {
        Alert.alert(
          'Invalid Session Time',
          'Could not read the session date or start time.'
        );
        return;
      }

      const reminderTime = new Date(
        sessionDate.getTime() - minutesBefore * 60 * 1000
      );

      if (reminderTime <= new Date()) {
        Alert.alert(
          'Invalid Reminder',
          'This reminder time has already passed. Please select another reminder time.'
        );
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Booking Reminder 🚗',
          body: `Your ${booking.sessionType || 'driving'} session starts at ${booking.startTime}`,
          sound: 'default',
          data: {
            bookingId: booking._id,
            sessionType: booking.sessionType,
            sessionDate: booking.date,
            startTime: booking.startTime,
          },
        },
        trigger: buildDateTrigger(reminderTime),
      });

      console.log('Reminder scheduled successfully:', notificationId);

      Alert.alert(
        'Reminder Set ✅',
        `You will be reminded ${minutesBefore} minutes before the session.`
      );
    } catch (error) {
      console.log('Reminder error full:', error);

      Alert.alert(
        'Error',
        error?.message || 'Could not set reminder. Please try again.'
      );
    } finally {
      setReminderLoadingId(null);
    }
  };

  const handleBook = async (sessionId) => {
    Alert.alert('Book Session', 'Are you sure you want to book this session?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Book Now',
        onPress: async () => {
          try {
            setBookingId(sessionId);

            await bookSession(sessionId);

            Alert.alert('Booked! ✅', 'Session booked successfully!');
            fetchData();
          } catch (err) {
            console.log('Book session error:', err.response?.data || err.message);

            Alert.alert(
              'Error',
              err.response?.data?.message || 'Could not book session'
            );
          } finally {
            setBookingId(null);
          }
        },
      },
    ]);
  };

  const isBooked = (sessionId) =>
    myBookings.some((booking) => booking._id === sessionId);

  const renderSession = ({ item }) => {
    const booked = isBooked(item._id);
    const spots = item.maxStudents - (item.enrolledStudents?.length || 0);
    const almostFull = spots <= 3;

    const statusColors =
      STATUS_COLORS[item.status] || {
        bg: COLORS.gray,
        text: COLORS.textMuted,
      };

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.badgesWrap}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    item.sessionType === 'Theory'
                      ? COLORS.blueBg
                      : COLORS.brandYellow,
                },
              ]}
            >
              <Ionicons
                name={
                  item.sessionType === 'Theory'
                    ? 'book-outline'
                    : 'car-outline'
                }
                size={12}
                color={
                  item.sessionType === 'Theory'
                    ? COLORS.blue
                    : COLORS.black
                }
              />

              <Text
                style={[
                  styles.typeBadgeText,
                  {
                    color:
                      item.sessionType === 'Theory'
                        ? COLORS.blue
                        : COLORS.black,
                  },
                ]}
              >
                {item.sessionType}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.bg },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors.text },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          {almostFull && !booked && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Only {spots} left!</Text>
            </View>
          )}
        </View>

        <Text style={styles.sessionDate}>
          {new Date(item.date).toDateString()}
        </Text>

        <Text style={styles.sessionTime}>
          {item.startTime} – {item.endTime}
        </Text>

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>
            {item.instructor?.fullName || 'TBA'}
          </Text>
        </View>

        {item.vehicle && (
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {item.vehicle.brand} {item.vehicle.model} ·{' '}
              {item.vehicle.licensePlate}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>
            {item.enrolledStudents?.length || 0}/{item.maxStudents} enrolled ·{' '}
            {spots} spots remaining
          </Text>
        </View>

        {booked ? (
          <View style={styles.bookedBtn}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
            <Text style={styles.bookedBtnText}>Already Booked</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => handleBook(item._id)}
            disabled={bookingId === item._id}
          >
            {bookingId === item._id ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.bookBtnText}>Book This Session</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMyBooking = ({ item }) => {
    const colors =
      STATUS_COLORS[item.status] || {
        bg: COLORS.gray,
        text: COLORS.textMuted,
      };

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  item.sessionType === 'Theory'
                    ? COLORS.blueBg
                    : COLORS.brandYellow,
              },
            ]}
          >
            <Ionicons
              name={
                item.sessionType === 'Theory'
                  ? 'book-outline'
                  : 'car-outline'
              }
              size={12}
              color={
                item.sessionType === 'Theory'
                  ? COLORS.blue
                  : COLORS.black
              }
            />

            <Text
              style={[
                styles.typeBadgeText,
                {
                  color:
                    item.sessionType === 'Theory'
                      ? COLORS.blue
                      : COLORS.black,
                },
              ]}
            >
              {item.sessionType}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.sessionDate}>
          {new Date(item.date).toDateString()}
        </Text>

        <Text style={styles.sessionTime}>
          {item.startTime} – {item.endTime}
        </Text>

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>
            {item.instructor?.fullName || 'TBA'}
          </Text>
        </View>

        {item.vehicle && (
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {item.vehicle.brand} {item.vehicle.model} ·{' '}
              {item.vehicle.licensePlate}
            </Text>
          </View>
        )}

        {item.status === 'Scheduled' && (
          <TouchableOpacity
            style={styles.reminderBtn}
            onPress={() => setBookingReminder(item)}
            disabled={reminderLoadingId === item._id}
          >
            {reminderLoadingId === item._id ? (
              <ActivityIndicator size="small" color={COLORS.blue} />
            ) : (
              <Ionicons name="alarm-outline" size={14} color={COLORS.blue} />
            )}

            <Text style={styles.reminderBtnText}>
              {reminderLoadingId === item._id ? 'Setting...' : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
        )}

        {item.status === 'Completed' && (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() =>
              navigation.navigate('Feedback', {
                sessionId: item._id,
                sessionInfo: {
                  sessionType: item.sessionType,
                  date: item.date,
                  startTime: item.startTime,
                },
              })
            }
          >
            <Ionicons
              name="star-outline"
              size={14}
              color={COLORS.brandOrange}
            />
            <Text style={styles.rateBtnText}>Rate This Session</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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

        <Text style={styles.headerTitle}>Sessions</Text>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'available', label: `Available (${sessions.length})` },
          { key: 'mybookings', label: `My Bookings (${myBookings.length})` },
        ].map((tabItem) => (
          <TouchableOpacity
            key={tabItem.key}
            style={[styles.tab, activeTab === tabItem.key && styles.tabActive]}
            onPress={() => setActiveTab(tabItem.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tabItem.key && styles.tabTextActive,
              ]}
            >
              {tabItem.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={activeTab === 'available' ? sessions : myBookings}
        keyExtractor={(item) => item._id}
        renderItem={activeTab === 'available' ? renderSession : renderMyBooking}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={COLORS.brandOrange}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'available'
                ? 'No available sessions right now'
                : 'No bookings yet'}
            </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
  },

  tabActive: {
    backgroundColor: COLORS.brandYellow,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  tabTextActive: {
    color: COLORS.black,
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  badgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  urgentBadge: {
    backgroundColor: COLORS.redBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.red,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  sessionDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 2,
  },

  sessionTime: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  detailText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandOrange,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },

  bookBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  bookedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.greenBg,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },

  bookedBtnText: {
    color: COLORS.green,
    fontWeight: '700',
    fontSize: 14,
  },

  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  reminderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
  },

  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.brandOrange,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  rateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandOrange,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});