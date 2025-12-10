import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Card from './Card';
import StatusBadge from './StatusBadge';

type ClientCardProps = {
  client: {
    id: string;
    name: string;
    clientCode?: string;
    status: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  onPress: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
};

export default function ClientCard({ client, onPress, onDelete, canDelete = false }: ClientCardProps) {
  console.log('ClientCard render - canDelete:', canDelete, 'onDelete exists:', !!onDelete, 'client:', client.name);
  
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.clientCard}>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientCode}>
              {client.clientCode || `ID: ${client.id.substring(0, 8)}...`}
            </Text>
            {client.contact_person && (
              <Text style={styles.contactPerson}>{client.contact_person}</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <StatusBadge status={client.status} />
            {/* Always show delete button for testing - remove canDelete check */}
            {onDelete && (
              <TouchableOpacity
                onPress={(e) => {
                  console.log('🗑️ Delete button pressed for:', client.name);
                  e.stopPropagation();
                  onDelete();
                }}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.clientDetails}>
          {client.email && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactText}>{client.email}</Text>
            </View>
          )}
          
          {client.phone && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactText}>{client.phone}</Text>
            </View>
          )}

          {client.address && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactText}>{client.address}</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  clientCard: {
    marginBottom: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  clientCode: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPerson: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  clientDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  contactText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  deleteIcon: {
    fontSize: 22,
  },
});
