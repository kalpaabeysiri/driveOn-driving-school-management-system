import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../../../theme';

const CreateExamScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Exam</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.examTypeCard}
          onPress={() => navigation.navigate('CreateTheoryExam')}
        >
          <View style={styles.examTypeIcon}>
            <Ionicons name="book-outline" size={32} color={COLORS.blue} />
          </View>
          <View style={styles.examTypeContent}>
            <Text style={styles.examTypeTitle}>Theory Exam</Text>
            <Text style={styles.examTypeDescription}>Create written driving theory exams</Text>
          </View>
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.examTypeCard}
          onPress={() => navigation.navigate('CreatePracticalExam')}
        >
          <View style={styles.examTypeIcon}>
            <Ionicons name="car-outline" size={32} color={COLORS.brandOrange} />
          </View>
          <View style={styles.examTypeContent}>
            <Text style={styles.examTypeTitle}>Practical Exam</Text>
            <Text style={styles.examTypeDescription}>Create practical driving tests</Text>
          </View>
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
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
  placeholder: { width: 24 },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 20,
    paddingVertical: 40
  },
  examTypeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  examTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  examTypeContent: {
    flex: 1
  },
  examTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4
  },
  examTypeDescription: {
    fontSize: 14,
    color: COLORS.textMuted
  },
  arrowIcon: {
    marginLeft: 16
  }
});

export default CreateExamScreen;
