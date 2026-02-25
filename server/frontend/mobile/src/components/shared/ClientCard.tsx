import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ClientCardProps = {
  client: {
    id: string;
    name: string;
    clientCode?: string;
    client_type?: string;
    location?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    onboard_date?: string;
    project_count?: number;
    status?: string;
  };
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMore?: () => void;
  canDelete?: boolean;
  canEdit?: boolean;
  isLast?: boolean;
};

export default function ClientCard({
  client,
  onPress,
  onEdit,
  onDelete,
  onMore,
  canDelete = false,
  canEdit = false,
  isLast = false,
}: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isActive = (client.status || 'Active').toLowerCase() === 'active';

  return (
    <View
      style={[
        styles.cardWrapper,
        !isLast && !expanded && styles.borderBottom,
      ]}
    >
      {/* Purple left accent - only when expanded */}
      {expanded && <View style={styles.leftAccent} />}

      <View style={styles.cardContent}>
        {/* Header - always visible */}
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.header}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientSubtitle}>
              {client.client_type || 'Residential properties developer'}
              {client.location ? ` | ${client.location}` : ''}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#5856D6"
          />
        </TouchableOpacity>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expanded}>
            {/* Status */}
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                  {client.status || 'Active'}
                </Text>
              </View>
            </View>

            {/* Address */}
            {client.address && (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{client.address}</Text>
              </View>
            )}

            {/* Mobile & Email */}
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.label}>Mobile:</Text>
                <Text style={styles.value}>{client.phone || '-'}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Email:</Text>
                <Text style={[styles.value, styles.smallValue]}>{client.email || '-'}</Text>
              </View>
            </View>

            {/* Onboard Date & Projects */}
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.label}>Onboard Date:</Text>
                <Text style={styles.value}>{formatDate(client.onboard_date)}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Number of Projects:</Text>
                <Text style={styles.value}>{client.project_count ?? 0}</Text>
              </View>
            </View>

            {/* More button */}
            <TouchableOpacity style={styles.moreButton} onPress={onPress} activeOpacity={0.8}>
              <Ionicons name="apps" size={14} color="#fff" />
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  borderBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  leftAccent: {
    width: 4,
    backgroundColor: '#5856D6',
  },
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#000000',
    marginBottom: 4,
  },
  clientSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
  },
  expanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: '#E5E5EA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  statusTextInactive: {
    color: '#8E8E93',
  },
  fieldRow: {
    marginBottom: 12,
  },
  twoColumns: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '500',
    color: '#000000',
  },
  smallValue: {
    fontSize: 13,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#5856D6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 4,
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    marginLeft: 6,
  },
});
