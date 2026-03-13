import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

const PRIMARY_PURPLE = '#877ED2';
const BG_COLOR = '#F5F5F8';

interface PendingRegistration {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  gender?: string;
  age?: number;
  salutation?: string;
  designation_id?: string;
  employment_type?: string;
  salary_type?: string;
  salary_amount?: number;
  status: string;
  created_at: string;
}

export default function PendingApprovalsScreen() {
  const navigation = useNavigation<any>();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      const response = await api.get('/api/pending-registrations');
      setRegistrations(response.data?.registrations || []);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh list when screen is focused (coming back from AddEmployeeScreen)
  useFocusEffect(
    useCallback(() => {
      fetchPending();
    }, [fetchPending])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPending();
  };

  const handleApprove = (item: PendingRegistration) => {
    // Navigate to AddEmployeeScreen with pre-filled data
    navigation.navigate('AddEmployee', {
      pendingRegistration: {
        id: item.id,
        email: item.email,
        phone: item.phone,
        first_name: item.first_name,
        last_name: item.last_name,
        gender: item.gender,
        age: item.age,
      }
    });
  };

  const openRejectModal = (item: PendingRegistration) => {
    setRejectId(item.id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setProcessingId(rejectId);
    setRejectModalVisible(false);
    try {
      await api.post(`/api/pending-registrations/${rejectId}/reject`, { reason: rejectReason || 'Rejected by admin' });
      Alert.alert('Rejected', 'The registration request has been rejected.');
      setRegistrations(prev => prev.filter(r => r.id !== rejectId));
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Failed to reject registration';
      Alert.alert('Error', msg);
    } finally {
      setProcessingId(null);
      setRejectId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderItem = ({ item }: { item: PendingRegistration }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.first_name.charAt(0).toUpperCase()}
              {item.last_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {item.salutation ? `${item.salutation} ` : ''}{item.first_name} {item.last_name}
            </Text>
            <Text style={styles.email}>{item.email}</Text>
            {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
          </View>
          <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
        </View>

        <View style={styles.detailsRow}>
          {item.employment_type && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.employment_type}</Text>
            </View>
          )}
          {item.salary_type && (
            <View style={[styles.badge, { backgroundColor: '#F3F0FF' }]}>
              <Text style={[styles.badgeText, { color: '#6B5DB0' }]}>
                {item.salary_type}{item.salary_amount ? ` - ₹${item.salary_amount}` : ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.requestDate}>Requested on {formatDate(item.created_at)}</Text>

        <View style={styles.actionRow}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={PRIMARY_PURPLE} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => openRejectModal(item)}
              >
                <Ionicons name="close-circle-outline" size={18} color="#877ED2" />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(item)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={PRIMARY_PURPLE}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={PRIMARY_PURPLE}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{registrations.length}</Text>
        </View>
      </View>

      {registrations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#C4C4C4" />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptySubtitle}>All registration requests have been processed</Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_PURPLE} />}
        />
      )}

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Registration</Text>
            <Text style={styles.modalSubtitle}>Optionally provide a reason:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalReject}
                onPress={handleReject}
              >
                <Text style={styles.modalRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: PRIMARY_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: PRIMARY_PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY_PURPLE + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_PURPLE,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  email: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  phone: {
    fontSize: 13,
    color: '#888',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#EDE7F6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5E35B1',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4CFEF',
    backgroundColor: '#F8F6FF',
    gap: 6,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#877ED2',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#877ED2',
    gap: 6,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4CFEF',
    backgroundColor: '#F8F6FF',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#877ED2',
  },
  modalReject: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#877ED2',
  },
  modalRejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
