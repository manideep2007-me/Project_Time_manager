import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/shared/Card';
import { api } from '../../api/client';
import { resolveUploadUrl } from '../../utils/mediaUrl';

interface TaskUpload {
  id: string;
  task_id: string;
  task_name: string;
  project_name: string;
  client_name?: string;
  description?: string;
  submitted_at: string;
  photo_url?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  work_type?: string | null;
}

export default function MyUploadsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [uploads, setUploads] = useState<TaskUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<TaskUpload | null>(null);

  const loadUploads = useCallback(async () => {
    try {
      if (!user?.id) {
        setUploads([]);
        return;
      }

      // Backend endpoint: GET /api/task-photo-proofs/me
      const res = await api.get('/api/task-photo-proofs/me', {
        // Cache-bust so we never get a 304 with empty body after a new upload
        params: { limit: 50, _t: Date.now() },
      });

      const list = Array.isArray(res.data?.proofs) ? res.data.proofs : null;
      // If server didn't include a body (rare 304/empty response), don't wipe UI.
      if (!list) return;

      const mapped: TaskUpload[] = list.map((p: any) => ({
        id: String(p.id),
        task_id: String(p.task_id),
        task_name: p.task_name || 'Task',
        project_name: p.project_name || '',
        client_name: p.client_name,
        description: p.address || p.work_type || 'Photo proof',
        submitted_at: p.captured_at || p.created_at || new Date().toISOString(),
        photo_url: p.photo_url,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        work_type: p.work_type,
      }));

      setUploads(mapped);
    } catch (error) {
      console.error('Error loading uploads:', error);
      Alert.alert('Error', 'Failed to load uploads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Wait for user to be available
    if (user?.id) void loadUploads();
  }, [user?.id, loadUploads]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUploads();
    setRefreshing(false);
  };

  // status display removed per requirements

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const UploadCard = ({ upload }: { upload: TaskUpload }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        setSelectedUpload(upload);
        setShowDetails(true);
      }}
    >
      <Card style={styles.uploadCard}>
        <View style={styles.uploadHeader}>
          {upload.photo_url ? (
            <Image
              source={{ uri: resolveUploadUrl(upload.photo_url) || undefined }}
              style={styles.uploadThumb}
            />
          ) : (
            <View style={styles.uploadThumbPlaceholder} />
          )}
          <View style={styles.uploadInfo}>
            <Text style={styles.taskName}>{upload.task_name}</Text>
            <Text style={styles.projectName}>
              {upload.project_name} • {upload.client_name || 'No client'}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {upload.description}
        </Text>

        <View style={styles.uploadMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="image-outline" size={16} color="#666" />
            <Text style={styles.metaText}>1 photo proof</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{formatDate(upload.submitted_at)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading uploads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Task Uploads</Text>
        <Text style={styles.subtitle}>View your submitted work and feedback</Text>
      </View>

      <FlatList
        data={uploads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UploadCard upload={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cloud-upload-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Uploads Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete tasks and upload your work to see them here
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => navigation.navigate('TaskUpload', { 
                taskId: 'general', 
                taskName: 'General Work Upload' 
              })}
            >
              <Text style={styles.uploadButtonText}>Upload Work</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal visible={showDetails} transparent animationType="slide" onRequestClose={() => setShowDetails(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Details</Text>
            <ScrollView style={styles.modalBody}>
              {selectedUpload?.photo_url ? (
                <Image
                  source={{ uri: resolveUploadUrl(selectedUpload.photo_url) || undefined }}
                  style={styles.modalImage}
                />
              ) : null}
              <Text style={styles.modalLabel}>Description</Text>
              <Text style={styles.modalDescription}>{selectedUpload?.description || '-'}</Text>

              <Text style={[styles.modalLabel, { marginTop: 16 }]}>Captured At</Text>
              <Text style={styles.modalDescription}>
                {selectedUpload ? formatDate(selectedUpload.submitted_at) : '-'}
              </Text>

              {selectedUpload?.address ? (
                <>
                  <Text style={[styles.modalLabel, { marginTop: 16 }]}>Location</Text>
                  <Text style={styles.modalDescription}>{selectedUpload.address}</Text>
                </>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetails(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  uploadCard: {
    marginBottom: 16,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  uploadThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  uploadThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  uploadInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  uploadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  feedbackContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalBody: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F0F0F0',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  fileRowText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  fileRowSize: {
    fontSize: 12,
    color: '#666',
  },
  modalCloseBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
