import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoProofViewerProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata: {
    taskTitle: string;
    projectName: string;
    workType?: string;
  };
}

export default function PhotoProofViewer({
  visible,
  onClose,
  imageUri,
  timestamp,
  location,
  metadata,
}: PhotoProofViewerProps) {
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day} ${month}, ${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatCoordinates = () => {
    if (!location) return 'N/A';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        
        {/* Overlay with Metadata */}
        <View style={styles.overlay}>
          {/* Top Overlay */}
          <View style={styles.topOverlay}>
            <View style={styles.overlayRow}>
              <View style={styles.overlayBadge}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                <Text style={styles.overlayText}>
                  {formatTimestamp(timestamp)}
                </Text>
              </View>
            </View>
            <View style={styles.overlayRow}>
              <Text style={styles.taskTitleOverlay} numberOfLines={1}>
                {metadata.taskTitle}
              </Text>
            </View>
            <View style={styles.overlayRow}>
              <Text style={styles.projectNameOverlay} numberOfLines={1}>
                {metadata.projectName}
              </Text>
            </View>
          </View>

          {/* Bottom Overlay */}
          <View style={styles.bottomOverlay}>
            {location && (
              <View style={styles.overlayRow}>
                <View style={styles.overlayBadge}>
                  <Ionicons name="location" size={14} color="#FFFFFF" />
                  <Text style={styles.overlayText} numberOfLines={1}>
                    {location.address || formatCoordinates()}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.overlayRow}>
              <View style={styles.overlayBadge}>
                <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" />
                <Text style={styles.overlayText}>{metadata.workType || 'General'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  bottomOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  overlayRow: {
    marginBottom: 8,
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(135, 126, 210, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  taskTitleOverlay: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  projectNameOverlay: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

