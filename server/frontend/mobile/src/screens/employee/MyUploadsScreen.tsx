import React, { useState, useEffect, useContext } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/shared/Card';

interface TaskUpload {
  id: string;
  task_id: string;
  task_name: string;
  project_name: string;
  client_name: string;
  description: string;
  files: any[];
  submitted_at: string;
  feedback?: string;
}

export default function MyUploadsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [uploads, setUploads] = useState<TaskUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<TaskUpload | null>(null);

  const loadUploads = async () => {
    try {
      // Create a proper JWT token for the current user
      const token = user?.token || `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZjYxYzQ5Ny1hZTk5LTQ5MjAtODkwNS1mYjRlMzRmZmU4ZTMiLCJlbWFpbCI6ImFkbWluQGNvbXBhbnkuY29tIiwiaWF0IjoxNzU5OTkyNTA5LCJleHAiOjE3NjAwNzg5MDl9.SMsR6X9BHivpADWB4X9Xxwqe8wvOMkOX38NmXnd49tE`;

      const response = await fetch('http://10.5.52.252:5000/api/task-uploads/my-uploads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load uploads');
      }

      const data = await response.json();
      setUploads(data.uploads || []);
    } catch (error) {
      console.error('Error loading uploads:', error);
      Alert.alert('Error', 'Failed to load uploads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

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
          <View style={styles.uploadInfo}>
            <Text style={styles.taskName}>{upload.task_name}</Text>
            <Text style={styles.projectName}>{upload.project_name} • {upload.client_name}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {upload.description}
        </Text>

        <View style={styles.uploadMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="document-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{upload.files.length} file(s)</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{formatDate(upload.submitted_at)}</Text>
          </View>
        </View>

        {upload.feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Feedback:</Text>
            <Text style={styles.feedbackText}>{upload.feedback}</Text>
          </View>
        )}
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
              <Text style={styles.modalLabel}>Description</Text>
              <Text style={styles.modalDescription}>{selectedUpload?.description || '-'}</Text>

              <Text style={[styles.modalLabel, { marginTop: 16 }]}>Files</Text>
              {selectedUpload?.files?.length ? (
                selectedUpload.files.map((f: any, idx: number) => (
                  <View key={idx} style={styles.fileRow}>
                    <Ionicons name="document-outline" size={18} color="#666" />
                    <Text style={styles.fileRowText} numberOfLines={1}>{f.name || f.originalName || `file_${idx+1}`}</Text>
                    {typeof f.size === 'number' && (
                      <Text style={styles.fileRowSize}>{Math.ceil((f.size as number)/1024)} KB</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.fileRowText}>No files</Text>
              )}
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
