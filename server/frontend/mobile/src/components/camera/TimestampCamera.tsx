import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TimestampCameraProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (photo: {
    uri: string;
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    metadata: {
      taskTitle: string;
      projectName: string;
      taskId: string;
      workType?: string;
    };
  }) => void;
  taskTitle: string;
  projectName: string;
  taskId: string;
  workType?: string;
}

export default function TimestampCamera({
  visible,
  onClose,
  onPhotoTaken,
  taskTitle,
  projectName,
  taskId,
  workType = 'General',
}: TimestampCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Update time every second
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Get location when camera opens
  useEffect(() => {
    if (visible && permission?.granted) {
      getLocation();
    }
  }, [visible, permission]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for photo proof.');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(locationData);

      // Reverse geocode to get address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const addressParts = [
            addr.street,
            addr.city,
            addr.region,
            addr.postalCode,
            addr.country,
          ].filter(Boolean);
          setAddress(addressParts.join(', '));
        }
      } catch (error: any) {
        // Handle geocoding rate limit gracefully
        if (error?.message?.includes('rate limit') || error?.message?.includes('too many requests')) {
          console.log('Geocoding rate limit exceeded. Using coordinates only.');
          // Don't set address, will show coordinates instead
        } else {
          console.log('Reverse geocoding error:', error);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const formatCoordinates = () => {
    if (!location) return 'N/A';
    return `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
  };

  const capturePhoto = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to capture photo proof.');
        setIsCapturing(false);
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (result.canceled || !result.assets[0]) {
        setIsCapturing(false);
        return;
      }

      // Show preview with overlay
      setCapturedImage(result.assets[0].uri);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  };

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    try {
      // Create overlay image with metadata
      const overlayData = await createOverlayImage(capturedImage);

      // Callback with photo data
      onPhotoTaken({
        uri: overlayData.uri,
        timestamp: currentTime.toISOString(),
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              address: address || undefined,
            }
          : undefined,
        metadata: {
          taskTitle,
          projectName,
          taskId,
          workType,
        },
      });

      setIsCapturing(false);
      setCapturedImage(null);
      onClose();
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Error', 'Failed to process photo. Please try again.');
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  const createOverlayImage = async (imageUri: string): Promise<{ uri: string }> => {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const filename = `photo_proof_${timestamp}.jpg`;
    const newUri = `${FileSystem.cacheDirectory}${filename}`;
    
    // Copy the image to cache directory with new name
    await FileSystem.copyAsync({
      from: imageUri,
      to: newUri,
    });
    
    // Note: To actually composite overlays onto the image, you would need:
    // 1. react-native-view-shot to capture the overlay view
    // 2. Or use expo-gl with expo-gl-cpp for image processing
    // 3. Or use a server-side service to composite images
    // For now, we return the image URI and store metadata separately
    // The overlays are shown in the camera preview and metadata is stored
    
    return { uri: newUri };
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#877ED2" />
            <Text style={styles.loadingText}>Requesting camera permission...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#877ED2" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to capture photo proof with timestamps and location.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Show preview if image is captured
  if (capturedImage) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <View style={styles.container}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="contain" />
          
          {/* Overlay on Preview */}
          <View style={styles.previewOverlay}>
            {/* Top Overlay */}
            <View style={styles.topOverlay}>
              <View style={styles.overlayRow}>
                <View style={styles.overlayBadge}>
                  <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.overlayText}>
                    {formatDate(currentTime)} {formatTime(currentTime)}
                  </Text>
                </View>
              </View>
              <View style={styles.overlayRow}>
                <Text style={styles.taskTitleOverlay} numberOfLines={1}>
                  {taskTitle}
                </Text>
              </View>
              <View style={styles.overlayRow}>
                <Text style={styles.projectNameOverlay} numberOfLines={1}>
                  {projectName}
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
                      {address || formatCoordinates()}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.overlayRow}>
                <View style={styles.overlayBadge}>
                  <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.overlayText}>{workType}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Preview Controls */}
          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Overlay Container */}
          <View style={styles.overlayContainer}>
            {/* Top Overlay - Timestamp and Task Info */}
            <View style={styles.topOverlay}>
              <View style={styles.overlayRow}>
                <View style={styles.overlayBadge}>
                  <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.overlayText}>
                    {formatDate(currentTime)} {formatTime(currentTime)}
                  </Text>
                </View>
              </View>
              <View style={styles.overlayRow}>
                <Text style={styles.taskTitleOverlay} numberOfLines={1}>
                  {taskTitle}
                </Text>
              </View>
              <View style={styles.overlayRow}>
                <Text style={styles.projectNameOverlay} numberOfLines={1}>
                  {projectName}
                </Text>
              </View>
            </View>

            {/* Bottom Overlay - Location and Work Type */}
            <View style={styles.bottomOverlay}>
              {location && (
                <View style={styles.overlayRow}>
                  <View style={styles.overlayBadge}>
                    <Ionicons name="location" size={14} color="#FFFFFF" />
                    <Text style={styles.overlayText} numberOfLines={1}>
                      {address || formatCoordinates()}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.overlayRow}>
                <View style={styles.overlayBadge}>
                  <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.overlayText}>{workType}</Text>
                </View>
              </View>
            </View>

            {/* Center Guide Lines */}
            <View style={styles.guideLines}>
              <View style={styles.guideLine} />
              <View style={[styles.guideLine, styles.guideLineHorizontal]} />
            </View>
          </View>

          {/* Camera Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={capturePhoto}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  bottomOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
  guideLines: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideLine: {
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  guideLineHorizontal: {
    width: 2,
    height: '90%',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    width: 44,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000000',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#877ED2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

