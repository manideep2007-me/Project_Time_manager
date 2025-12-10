import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';

interface TaskBulkActionsProps {
  selectedTasks: string[];
  onBulkAction: (action: string, taskIds: string[]) => void;
  onClearSelection: () => void;
  visible: boolean;
  onClose: () => void;
}

export default function TaskBulkActions({
  selectedTasks,
  onBulkAction,
  onClearSelection,
  visible,
  onClose
}: TaskBulkActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleBulkAction = async (action: string) => {
    if (selectedTasks.length === 0) return;
    
    setActionLoading(action);
    
    try {
      await onBulkAction(action, selectedTasks);
      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} tasks`);
    } finally {
      setActionLoading(null);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'complete': return '✅';
      case 'assign': return '👤';
      case 'priority': return '⚡';
      case 'delete': return '🗑️';
      case 'move': return '📁';
      default: return '⚙️';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'complete': return '#34C759';
      case 'assign': return '#007AFF';
      case 'priority': return '#FF9500';
      case 'delete': return '#FF3B30';
      case 'move': return '#8E8E93';
      default: return '#666';
    }
  };

  const bulkActions = [
    { id: 'complete', label: 'Mark Complete', description: 'Mark selected tasks as completed' },
    { id: 'assign', label: 'Assign Tasks', description: 'Assign tasks to team members' },
    { id: 'priority', label: 'Set Priority', description: 'Change task priority levels' },
    { id: 'move', label: 'Move to Project', description: 'Move tasks to different project' },
    { id: 'delete', label: 'Delete Tasks', description: 'Remove selected tasks permanently' },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Bulk Actions ({selectedTasks.length} selected)
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsList}>
            {bulkActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionItem,
                  { borderLeftColor: getActionColor(action.id) }
                ]}
                onPress={() => handleBulkAction(action.id)}
                disabled={actionLoading === action.id}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionIcon}>{getActionIcon(action.id)}</Text>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                      <Text style={styles.actionDescription}>{action.description}</Text>
                    </View>
                  </View>
                  {actionLoading === action.id && (
                    <Text style={styles.loadingText}>Processing...</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClearSelection}
            >
              <Text style={styles.clearButtonText}>Clear Selection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  actionsList: {
    padding: 20,
  },
  actionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
