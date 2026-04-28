import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme';
import { getVideoTutorials } from '../../../services/learningApi';

export default function ResourceDetailScreen({ route, navigation }) {
  const { resourceId } = route.params || {};
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadResource = useCallback(async () => {
    if (!resourceId) return;
    
    try {
      const res = await getVideoTutorials({ _id: resourceId });
      const resourceData = res.data?.[0];
      
      if (!resourceData) {
        throw new Error('Resource not found');
      }
      
      setResource(resourceData);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not load resource');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resourceId]);

  useEffect(() => {
    loadResource();
  }, [loadResource]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadResource();
  }, [loadResource]);

  const handleDownload = async () => {
    try {
      Alert.alert('Download Started', `Downloading ${resource.title}...`);
      // In real app, implement actual download logic
      // For video tutorials, you might open the video URL or provide a download link
      if (resource.videoUrl) {
        await Linking.openURL(resource.videoUrl);
      }
    } catch (error) {
      Alert.alert('Download Failed', 'Could not download the resource. Please try again.');
    }
  };

  const handleOpenResource = async () => {
    try {
      if (resource.videoUrl) {
        await Linking.openURL(resource.videoUrl);
      } else {
        Alert.alert('Info', 'No video URL available for this resource');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open the resource');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandOrange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Resource not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle} numberOfLines={1}>Resource Details</Text>
        <TouchableOpacity style={styles.favoriteBtn}>
          <Ionicons name="heart-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Resource Header */}
        <View style={styles.resourceHeader}>
          <View style={styles.resourceIconContainer}>
            <Ionicons name="play-circle-outline" size={32} color={COLORS.brandOrange} />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
            <Text style={styles.resourceDescription}>{resource.description || 'Video tutorial for learning'}</Text>
          </View>
        </View>

        {/* Resource Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="play-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.statText}>Video Tutorial</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.statText}>{resource.duration || 0} min</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.statText}>{resource.status || 'Active'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenResource}>
            <Ionicons name="play-outline" size={20} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Play Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color={COLORS.brandOrange} />
            <Text style={styles.secondaryBtnText}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Resource Content */}
        <View style={styles.contentSection}>
          <Text style={styles.containerTitle}>About This Resource</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              {resource.description || 'This video tutorial provides comprehensive coverage of the topic. ' +
               'It includes detailed explanations, practical examples, and step-by-step demonstrations ' +
               'to help you understand the concepts thoroughly.'}
            </Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.containerTitle}>Additional Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{resource.duration || 0} minutes</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{resource.status || 'Active'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>Video Tutorial</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Added Date</Text>
            <Text style={styles.infoValue}>
              {resource.createdDate ? new Date(resource.createdDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Related Resources */}
        <View style={styles.relatedContainer}>
          <Text style={styles.containerTitle}>More Resources</Text>
          <Text style={styles.relatedText}>
            Check out more video tutorials and learning materials in the Lessons section.
          </Text>
          <TouchableOpacity 
            style={styles.backToLessonsBtn}
            onPress={() => navigation.navigate('StudentLearning', { screen: 'Lessons' })}
          >
            <Ionicons name="book-outline" size={20} color={COLORS.brandOrange} />
            <Text style={styles.backToLessonsText}>Back to Lessons</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.textMuted, marginBottom: 16 },
  backBtn: { backgroundColor: COLORS.brandOrange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: COLORS.white, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.gray,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.black, textAlign: 'center', marginHorizontal: 16 },
  favoriteBtn: { padding: 8 },
  content: { padding: 20, paddingBottom: 40 },
  
  // Resource Header
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  resourceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.brandOrange + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  resourceDescription: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statText: { fontSize: 12, color: COLORS.textMuted },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.brandOrange },
  
  // Content Section
  contentSection: { marginBottom: 32 },
  containerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  contentText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  
  // Info
  infoContainer: { marginBottom: 32 },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: { fontSize: 14, color: COLORS.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  
  // Related
  relatedContainer: { marginBottom: 32 },
  relatedText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  backToLessonsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  backToLessonsText: { fontSize: 14, fontWeight: '600', color: COLORS.brandOrange },
});
