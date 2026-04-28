import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAvailableSessions, bookSession, getMyBookedSessions } from '../../services/sessionApi';
import { COLORS } from '../../theme';

const STATUS_COLORS = {
  Scheduled: { bg: COLORS.blueBg,  text: COLORS.blue  },
  Ongoing:   { bg: '#FFF3CD',      text: '#856404'    },
  Completed: { bg: COLORS.greenBg, text: COLORS.green  },
  Cancelled: { bg: COLORS.redBg,   text: COLORS.red    },
};

export default function AvailableSessionsScreen({ navigation }) {
  const [sessions,       setSessions]       = useState([]);
  const [myBookings,     setMyBookings]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [activeTab,      setActiveTab]      = useState('available');
  const [bookingId,      setBookingId]      = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [avail, booked] = await Promise.all([
        getAvailableSessions(),
        getMyBookedSessions(),
      ]);
      setSessions(avail.data);
      setMyBookings(booked.data);
    } catch {
      Alert.alert('Error', 'Could not load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBook = async (sessionId) => {
    Alert.alert('Book Session', 'Are you sure you want to book this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Book Now',
        onPress: async () => {
          try {
            setBookingId(sessionId);
            await bookSession(sessionId);
            Alert.alert('Booked! ✅', 'Session booked successfully!');
            fetchData();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not book session');
          } finally {
            setBookingId(null);
          }
        },
      },
    ]);
  };

  const isBooked = (sessionId) => myBookings.some(b => b._id === sessionId);

  const renderSession = ({ item }) => {
    const booked  = isBooked(item._id);
    const spots   = item.maxStudents - (item.enrolledStudents?.length || 0);
    const almostFull = spots <= 3;
    const statusColors = STATUS_COLORS[item.status] || { bg: COLORS.gray, text: COLORS.textMuted };

    return (
      <View style={styles.card}>
        {/* Type badge */}
        <View style={styles.cardTop}>
          <View style={styles.badgesWrap}>
            <View style={[styles.typeBadge, {
              backgroundColor: item.sessionType === 'Theory' ? COLORS.blueBg : COLORS.brandYellow,
            }]}>
              <Ionicons
                name={item.sessionType === 'Theory' ? 'book-outline' : 'car-outline'}
                size={12}
                color={item.sessionType === 'Theory' ? COLORS.blue : COLORS.black}
              />
              <Text style={[styles.typeBadgeText, {
                color: item.sessionType === 'Theory' ? COLORS.blue : COLORS.black,
              }]}>{item.sessionType}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>{item.status}</Text>
            </View>
          </View>
          {almostFull && !booked && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Only {spots} left!</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <Text style={styles.sessionDate}>{new Date(item.date).toDateString()}</Text>
        <Text style={styles.sessionTime}>{item.startTime} – {item.endTime}</Text>

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>{item.instructor?.fullName || 'TBA'}</Text>
        </View>
        {item.vehicle && (
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.detailText}>{item.vehicle.brand} {item.vehicle.model} · {item.vehicle.licensePlate}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>
            {item.enrolledStudents?.length || 0}/{item.maxStudents} enrolled · {spots} spots remaining
          </Text>
        </View>

        {/* Book button */}
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
            {bookingId === item._id
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <>
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.white} />
                  <Text style={styles.bookBtnText}>Book This Session</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMyBooking = ({ item }) => {
    const colors = STATUS_COLORS[item.status] || { bg: COLORS.gray, text: COLORS.textMuted };

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, {
            backgroundColor: item.sessionType === 'Theory' ? COLORS.blueBg : COLORS.brandYellow,
          }]}>
            <Text style={[styles.typeBadgeText, {
              color: item.sessionType === 'Theory' ? COLORS.blue : COLORS.black,
            }]}>{item.sessionType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.sessionDate}>{new Date(item.date).toDateString()}</Text>
        <Text style={styles.sessionTime}>{item.startTime} – {item.endTime}</Text>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>{item.instructor?.fullName || 'TBA'}</Text>
        </View>
        {/* Feedback submitted badge */}
        {item.hasFeedback && (
          <TouchableOpacity
            style={styles.feedbackSubmittedBadge}
            onPress={() => setFeedbackModal(item.myFeedback)}
          >
            <Ionicons name="star" size={14} color={COLORS.brandOrange} />
            <Text style={styles.feedbackSubmittedText}>
              {item.myFeedback.rating}/5 {item.myFeedback.comment ? `· ${item.myFeedback.comment.substring(0, 30)}${item.myFeedback.comment.length > 30 ? '...' : ''}` : ''}
            </Text>
          </TouchableOpacity>
        )}
        {/* Mark attendance button for ongoing sessions */}
        {item.status === 'Ongoing' && (
          <TouchableOpacity
            style={styles.markAttendanceBtn}
            onPress={() => navigation.navigate('MarkAttendance', {
              sessionId:   item._id,
              sessionInfo: { sessionType: item.sessionType, date: item.date, startTime: item.startTime },
            })}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.brandOrange} />
            <Text style={styles.markAttendanceBtnText}>Mark Attendance</Text>
          </TouchableOpacity>
        )}
        {/* Rate session button for completed - only if not yet submitted */}
        {item.status === 'Completed' && !item.hasFeedback && (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => navigation.navigate('Feedback', {
              sessionId:   item._id,
              sessionInfo: { sessionType: item.sessionType, date: item.date, startTime: item.startTime },
            })}
          >
            <Ionicons name="star-outline" size={14} color={COLORS.brandOrange} />
            <Text style={styles.rateBtnText}>Rate This Session</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sessions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'available', label: `Available (${sessions.length})` },
          { key: 'mybookings', label: `My Bookings (${myBookings.length})` },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={activeTab === 'available' ? sessions : myBookings}
        keyExtractor={item => item._id}
        renderItem={activeTab === 'available' ? renderSession : renderMyBooking}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.brandOrange} />
            <Text style={styles.emptyText}>
              {activeTab === 'available' ? 'No available sessions right now' : 'No bookings yet'}
            </Text>
          </View>
        }
      />

      {/* Feedback Detail Modal */}
      <Modal visible={!!feedbackModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= feedbackModal?.rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= feedbackModal?.rating ? '#FFB800' : COLORS.borderLight}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{feedbackModal?.rating}/5</Text>
            {feedbackModal?.comment && (
              <View style={styles.commentBox}>
                <Text style={styles.commentLabel}>Your Comment:</Text>
                <Text style={styles.commentText}>{feedbackModal.comment}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  { backgroundColor: COLORS.gray, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  tabRow:  { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  tab:     { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.bgLight },
  tabActive: { backgroundColor: COLORS.brandYellow },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.black },
  list:    { padding: 16, paddingBottom: 40 },
  card:    { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgesWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  urgentBadge:   { backgroundColor: COLORS.redBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  urgentText:    { fontSize: 11, fontWeight: '700', color: COLORS.red },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:    { fontSize: 11, fontWeight: '700' },
  sessionDate:   { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 2 },
  sessionTime:   { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText:    { fontSize: 12, color: COLORS.textMuted },
  bookBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.brandOrange, borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  bookBtnText:   { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  bookedBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.greenBg, borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  bookedBtnText: { color: COLORS.green, fontWeight: '700', fontSize: 14 },
  rateBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.brandOrange, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 10 },
  rateBtnText:   { fontSize: 12, fontWeight: '600', color: COLORS.brandOrange },
  markAttendanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandOrange, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 10 },
  markAttendanceBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.white },
  feedbackSubmittedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.greenBg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 10 },
  feedbackSubmittedText: { fontSize: 12, fontWeight: '600', color: COLORS.green },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black },
  ratingStars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  ratingText: { textAlign: 'center', fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: 20 },
  commentBox: { backgroundColor: COLORS.bgLight, borderRadius: 12, padding: 16 },
  commentLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  commentText: { fontSize: 14, color: COLORS.black, lineHeight: 20 },
  empty:         { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:     { fontSize: 14, color: COLORS.textMuted },
});
