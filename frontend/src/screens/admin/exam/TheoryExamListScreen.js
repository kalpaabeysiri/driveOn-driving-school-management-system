import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
  TextInput, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { getTheoryExams, deleteTheoryExam } from '../../../services/examApi';
import { useAuth } from '../../../context/AuthContext';

export default function TheoryExamListScreen({ navigation }) {
  const { user } = useAuth();
  
  // Authentication check - redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
      return;
    }
    if (user.role !== 'admin') {
      navigation.replace('Home'); // Redirect non-admin users
      return;
    }
  }, [user, navigation]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterLanguage) params.language = filterLanguage;
      
      const response = await getTheoryExams(params);
      setExams(response.data);
      setFilteredExams(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load theory exams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, filterLanguage]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    // Apply search filter
    let filtered = exams;
    if (search) {
      filtered = filtered.filter(exam =>
        exam.examName.toLowerCase().includes(search.toLowerCase()) ||
        exam.locationOrHall.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredExams(filtered);
  }, [search, exams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Exams</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {['', 'Scheduled', 'Completed', 'Cancelled'].map(status => (
                <TouchableOpacity
                  key={status || 'all'}
                  style={[
                    styles.filterOption,
                    filterStatus === status && styles.filterOptionActive
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterStatus === status && styles.filterOptionTextActive
                  ]}>
                    {status || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Language</Text>
            <View style={styles.filterOptions}>
              {['', 'English', 'Sinhala', 'Tamil'].map(lang => (
                <TouchableOpacity
                  key={lang || 'all'}
                  style={[
                    styles.filterOption,
                    filterLanguage === lang && styles.filterOptionActive
                  ]}
                  onPress={() => setFilterLanguage(lang)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterLanguage === lang && styles.filterOptionTextActive
                  ]}>
                    {lang || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setFilterStatus('');
              setFilterLanguage('');
              setShowFilters(false);
            }}
          >
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const handleDelete = (exam) => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.examName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTheoryExam(exam._id);
              setExams(prev => prev.filter(e => e._id !== exam._id));
              setFilteredExams(prev => prev.filter(e => e._id !== exam._id));
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete exam');
            }
          }
        }
      ]
    );
  };

  const renderExamCard = (exam) => {
    const seatsUsed = exam.enrolledStudents?.length || 0;
    const seatsAvailable = exam.maxSeats - seatsUsed;
    const isFull = seatsAvailable === 0;
    const utilizationRate = Math.round((seatsUsed / exam.maxSeats) * 100);

    const getStatusColor = (status) => {
      switch (status) {
        case 'Scheduled': return COLORS.blue;
        case 'Completed': return COLORS.green;
        case 'Cancelled': return COLORS.red;
        default: return COLORS.textMuted;
      }
    };

    const getLanguageColor = (language) => {
      switch (language) {
        case 'English': return COLORS.brandOrange;
        case 'Sinhala': return COLORS.purple;
        case 'Tamil': return COLORS.green;
        default: return COLORS.textMuted;
      }
    };

    return (
      <View key={exam._id} style={styles.examCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ExamDetails', { examType: 'theory', examId: exam._id })}
        >
        <View style={styles.examHeader}>
          <View style={styles.examInfo}>
            <Text style={styles.examTitle}>{exam.examName}</Text>
            <Text style={styles.examDate}>
              {new Date(exam.date).toLocaleDateString()} • {exam.startTime} - {exam.endTime}
            </Text>
          </View>
          <View style={styles.examBadges}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) }]}>
              <Text style={styles.statusBadgeText}>{exam.status}</Text>
            </View>
            <View style={[
              styles.seatBadge,
              { backgroundColor: isFull ? COLORS.red : COLORS.green }
            ]}>
              <Text style={styles.seatBadgeText}>
                {seatsUsed}/{exam.maxSeats}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.examDetails}>
          <View style={styles.examDetailRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.examDetailText}>{exam.locationOrHall}</Text>
          </View>
          <View style={styles.examDetailRow}>
            <Ionicons name="language-outline" size={16} color={getLanguageColor(exam.language)} />
            <Text style={[styles.examDetailText, { color: getLanguageColor(exam.language) }]}>
              Language: {exam.language}
            </Text>
          </View>
        </View>

        <View style={styles.examFooter}>
          <View style={styles.utilizationContainer}>
            <View style={styles.utilizationBar}>
              <View style={[
                styles.utilizationFill,
                { width: `${utilizationRate}%`, backgroundColor: isFull ? COLORS.red : COLORS.brandOrange }
              ]} />
            </View>
            <Text style={styles.utilizationText}>
              {seatsAvailable} seats left • {utilizationRate}% full
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </View>
        </TouchableOpacity>
        {user?.role === 'admin' && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditTheoryExam', { exam })}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(exam)}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Theory Exam Schedule</Text>
        <View style={styles.headerActions}>
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.createBtn} 
              onPress={() => navigation.navigate('CreateExam')}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exams..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        {(filterStatus || filterLanguage) && (
          <View style={styles.activeFilters}>
            {filterStatus && (
              <TouchableOpacity
                style={styles.activeFilter}
                onPress={() => setFilterStatus('')}
              >
                <Text style={styles.activeFilterText}>Status: {filterStatus}</Text>
                <Ionicons name="close" size={12} color={COLORS.white} />
              </TouchableOpacity>
            )}
            {filterLanguage && (
              <TouchableOpacity
                style={styles.activeFilter}
                onPress={() => setFilterLanguage('')}
              >
                <Text style={styles.activeFilterText}>Language: {filterLanguage}</Text>
                <Ionicons name="close" size={12} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredExams.length > 0 ? (
          filteredExams.map(renderExamCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {search || filterStatus || filterLanguage
                ? 'No exams found matching your criteria'
                : 'No theory exams available'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {renderFilterModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.black, flex: 1, textAlign: 'center' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  createBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchSection: { padding: 20, paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.black
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  activeFilterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6
  },
  container: { flex: 1 },
  listContent: { paddingTop: 8, paddingBottom: 32 },
  examCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  examInfo: { flex: 1 },
  examTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.black,
    flex: 1,
    flexWrap: 'wrap'
  },
  examDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  examBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  seatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  seatBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  examDetails: { marginBottom: 12 },
  examDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  examDetailText: { 
    fontSize: 14, 
    color: COLORS.textMuted, 
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap'
  },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  utilizationContainer: { flex: 1 },
  utilizationBar: {
    height: 4,
    backgroundColor: COLORS.bgLight,
    borderRadius: 2,
    marginBottom: 6
  },
  utilizationFill: { height: '100%', borderRadius: 2 },
  utilizationText: { fontSize: 12, color: COLORS.textMuted },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.red,
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16
  },
  modalSafe: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  modalContent: { flex: 1, padding: 20 },
  filterSection: { marginBottom: 24 },
  filterLabel: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterOptionActive: {
    backgroundColor: COLORS.brandOrange,
    borderColor: COLORS.brandOrange
  },
  filterOptionText: { fontSize: 14, color: COLORS.textMuted },
  filterOptionTextActive: { color: COLORS.white },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  resetBtnText: { fontSize: 16, fontWeight: '500', color: COLORS.textMuted },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.brandOrange,
    alignItems: 'center'
  },
  applyBtnText: { fontSize: 16, fontWeight: '500', color: COLORS.white }
});
