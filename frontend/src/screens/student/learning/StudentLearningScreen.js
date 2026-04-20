import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import LessonsTab from './components/LessonsTab';
import QuizzesTab from './components/QuizzesTab';
import PerformanceTab from './components/PerformanceTab';

export default function StudentLearningScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('lessons');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'lessons':
        return <LessonsTab navigation={navigation} />;
      case 'quizzes':
        return <QuizzesTab navigation={navigation} />;
      case 'performance':
        return <PerformanceTab navigation={navigation} />;
      default:
        return <LessonsTab navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Learning & Exams</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
          onPress={() => setActiveTab('lessons')}
        >
          <Ionicons 
            name="book-outline" 
            size={20} 
            color={activeTab === 'lessons' ? COLORS.brandOrange : COLORS.textMuted} 
          />
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>
            Lessons
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]}
          onPress={() => setActiveTab('quizzes')}
        >
          <Ionicons 
            name="help-circle-outline" 
            size={20} 
            color={activeTab === 'quizzes' ? COLORS.brandOrange : COLORS.textMuted} 
          />
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>
            Quizzes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
          onPress={() => setActiveTab('performance')}
        >
          <Ionicons 
            name="analytics-outline" 
            size={20} 
            color={activeTab === 'performance' ? COLORS.brandOrange : COLORS.textMuted} 
          />
          <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>
            Performance
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brandOrange,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.brandOrange,
  },
  content: {
    flex: 1,
  },
});
