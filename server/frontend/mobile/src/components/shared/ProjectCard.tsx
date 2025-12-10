import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translateProjectName, translateClientName } from '../../utils/translations';
import Card from './Card';

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    projectCode?: string;
    status: string;
    clientName?: string;
    description?: string;
    startDate?: string;
    start_date?: string;
    endDate?: string;
    end_date?: string;
    budget?: number;
    location?: string;
    priority?: string;
    complexity?: string;
    team_size?: number;
    progress?: number;
    risk_level?: string;
    estimated_hours?: number;
    technologies?: string[];
  };
  onPress: () => void;
  showBudget?: boolean;
  showDates?: boolean;
  showMetadata?: boolean;
  newBadge?: boolean;
};

export default function ProjectCard({ project, onPress, newBadge }: ProjectCardProps) {
  const { t } = useTranslation();
  const formatCurrency = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  
  // Translate project and client names
  const translatedProjectName = translateProjectName(project.name, t);
  const translatedClientName = project.clientName ? translateClientName(project.clientName, t) : undefined;
  
  // Handle both startDate and start_date fields
  const startDate = project.startDate || project.start_date;
  const endDate = project.endDate || project.end_date;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFAA00';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{translatedProjectName}</Text>
            {project.location ? (
              <View style={styles.locationContainer}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{project.location}</Text>
              </View>
            ) : translatedClientName ? (
              <Text style={styles.clientName}>{translatedClientName}</Text>
            ) : null}
          </View>
          {newBadge && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  projectCard: {
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  projectCode: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  dateInfo: {
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  noEndDate: {
    color: '#666',
    fontStyle: 'italic',
  },
  metadataInfo: {
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 11,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  technologiesContainer: {
    marginTop: 4,
  },
  technologiesLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  technologiesText: {
    fontSize: 10,
    color: '#1a1a1a',
    fontStyle: 'italic',
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  budgetText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
});
