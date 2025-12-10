// Proof of Work Capture Screen
// Complete demonstration of Time & Geotagging with Anti-Tamper/Anti-Fake GPS

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import advancedGeolocation, { AdvancedLocationData } from '../../services/advancedGeolocationService';
import integrityHash from '../../services/integrityHashService';
import { api } from '../../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RecentProof {
  id: string;
  photo_url: string;
  verified_timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
  address?: string; // Cached address
}

export default function ProofOfWorkCaptureScreen() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<AdvancedLocationData | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'captured' | 'verified' | 'uploaded'>('idle');
  const [recentProofs, setRecentProofs] = useState<RecentProof[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedProof, setSelectedProof] = useState<RecentProof | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Fetch recent proofs on component mount
   */
  useEffect(() => {
    fetchRecentProofs();
  }, []);

  /**
   * Get address from coordinates using free Nominatim API (OpenStreetMap)
   */
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log(`📍 Getting address for: ${latitude}, ${longitude}`);
      
      // Using Nominatim (OpenStreetMap) - Free, no API key required
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ProjectManagerApp/1.0', // Required by Nominatim
        },
      });
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const parts = [];
        
        // Building/House
        if (addr.building || addr.house_number) {
          parts.push(addr.building || addr.house_number);
        }
        
        // Road/Street
        if (addr.road) {
          parts.push(addr.road);
        }
        
        // Neighborhood/Suburb
        if (addr.neighbourhood || addr.suburb) {
          parts.push(addr.neighbourhood || addr.suburb);
        }
        
        // City/Town/Village
        if (addr.city || addr.town || addr.village) {
          parts.push(addr.city || addr.town || addr.village);
        }
        
        // State
        if (addr.state) {
          parts.push(addr.state);
        }
        
        // Postal Code (Important!)
        if (addr.postcode) {
          parts.push(addr.postcode);
        }
        
        const fullAddress = parts.filter(Boolean).join(', ');
        console.log(`✅ Address found: ${fullAddress}`);
        
        return fullAddress || data.display_name || 'Address unavailable';
      }
      
      console.warn('⚠️ No address data in response');
      return 'Address unavailable';
    } catch (error) {
      console.error('❌ Error getting address:', error);
      return 'Address unavailable';
    }
  };

  /**
   * Fetch recent proofs from backend and get their addresses
   */
  const fetchRecentProofs = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/api/proof-of-work/history?limit=10');
      console.log('📋 Recent proofs response:', JSON.stringify(response.data, null, 2));
      const proofs = response.data.proofs || [];
      console.log('📋 Number of proofs:', proofs.length);
      if (proofs.length > 0) {
        console.log('📋 First proof sample:', JSON.stringify(proofs[0], null, 2));
      }
      
      // Fetch addresses for all proofs
      const proofsWithAddresses = await Promise.all(
        proofs.map(async (proof: RecentProof) => {
          const lat = typeof proof.latitude === 'number' ? proof.latitude : parseFloat(proof.latitude as any);
          const lon = typeof proof.longitude === 'number' ? proof.longitude : parseFloat(proof.longitude as any);
          
          if (!isNaN(lat) && !isNaN(lon)) {
            const address = await getAddressFromCoordinates(lat, lon);
            return { ...proof, address };
          }
          return proof;
        })
      );
      
      setRecentProofs(proofsWithAddresses);
    } catch (error) {
      console.error('Error fetching recent proofs:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  /**
   * Step 1: Capture photo from camera
   */
  const capturePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to capture proof');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setStep('captured');
        Alert.alert('Photo Captured', 'Now capturing location and generating proof...');
        
        // Automatically proceed to location capture
        await captureLocationAndVerify(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  /**
   * Step 2: Capture location with anti-fake GPS check
   * Step 3: Generate integrity hash
   */
  const captureLocationAndVerify = async (photoUri: string) => {
    setLoading(true);
    try {
      // Get verified location with advanced checks
      const locationResult = await advancedGeolocation.getCurrentLocation();

      if (!locationResult.success || !locationResult.data) {
        Alert.alert(
          'Location Error',
          locationResult.error?.message || 'Failed to get location'
        );
        setLoading(false);
        return;
      }

      const verifiedLocation = locationResult.data;
      setLocation(verifiedLocation);

      // Get address from coordinates
      const address = await getAddressFromCoordinates(
        verifiedLocation.latitude,
        verifiedLocation.longitude
      );
      setCurrentAddress(address);

      // Generate integrity hash (using basic lat/lon for compatibility)
      const basicLocationData = {
        latitude: verifiedLocation.latitude,
        longitude: verifiedLocation.longitude,
        timestamp: verifiedLocation.timestamp,
        accuracy: verifiedLocation.accuracy,
        isMocked: verifiedLocation.isMocked,
      };
      const payload = await integrityHash.createProofPayload(basicLocationData as any, photoUri);

      // Add advanced location data to payload
      const advancedPayload = {
        ...payload,
        networkLatitude: verifiedLocation.networkLocation?.latitude,
        networkLongitude: verifiedLocation.networkLocation?.longitude,
        networkAccuracy: verifiedLocation.networkLocation?.accuracy,
        altitude: verifiedLocation.sensors.altitude,
        heading: verifiedLocation.sensors.heading,
        speed: verifiedLocation.sensors.speed,
        trustScore: verifiedLocation.verification.overallTrustScore,
      };

      setStep('verified');
      setLoading(false);

      Alert.alert(
        'Proof Verified',
        `📍 ${address}\n\n` +
        `Trust Score: ${verifiedLocation.verification.overallTrustScore}/100\n` +
        `Accuracy: ${verifiedLocation.accuracy.toFixed(2)}m\n` +
        `Mock Location: ${verifiedLocation.isMocked ? 'YES ⚠️' : 'NO ✓'}\n\n` +
        'Ready to upload!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upload Proof', onPress: () => uploadProof(advancedPayload) },
        ]
      );

    } catch (error: any) {
      console.error('Error capturing location:', error);
      Alert.alert('Error', error.message || 'Failed to capture location');
      setLoading(false);
    }
  };

  /**
   * Step 4: Upload to backend for server-side verification
   */
  const uploadProof = async (payload: any) => {
    setLoading(true);
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add photo file
      const photoFile = {
        uri: payload.fileUri,
        type: 'image/jpeg',
        name: `proof-${Date.now()}.jpg`,
      } as any;
      formData.append('photo', photoFile);

      // Add metadata
      formData.append('latitude', payload.latitude.toString());
      formData.append('longitude', payload.longitude.toString());
      formData.append('timestamp', payload.timestamp.toString());
      formData.append('accuracy', payload.accuracy.toString());
      formData.append('isMocked', payload.isMocked ? 'true' : 'false');
      formData.append('clientHash', payload.clientHash);

      // Add advanced location data
      if (payload.networkLatitude) formData.append('networkLatitude', payload.networkLatitude.toString());
      if (payload.networkLongitude) formData.append('networkLongitude', payload.networkLongitude.toString());
      if (payload.networkAccuracy) formData.append('networkAccuracy', payload.networkAccuracy.toString());
      if (payload.altitude) formData.append('altitude', payload.altitude.toString());
      if (payload.heading) formData.append('heading', payload.heading.toString());
      if (payload.speed) formData.append('speed', payload.speed.toString());
      if (payload.trustScore) formData.append('trustScore', payload.trustScore.toString());

      // Upload to backend
      // Backend registers this route under /api/proof-of-work
      const response = await api.post('/api/proof-of-work/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setStep('uploaded');
      setLoading(false);

      Alert.alert(
        'Success! ✓',
        'Proof of work verified and stored securely.\n\n' +
        `Proof ID: ${response.data.proof.id}\n` +
        `Integrity Hash: ${response.data.proof.integrityHash.substring(0, 16)}...`,
        [
          { text: 'OK', onPress: () => {
            resetScreen();
            fetchRecentProofs(); // Refresh the list
          }}
        ]
      );

    } catch (error: any) {
      console.error('Error uploading proof:', error);
      const message = error.response?.data?.message || 'Failed to upload proof';
      Alert.alert('Upload Failed', message);
      setLoading(false);
    }
  };

  /**
   * Reset screen for new capture
   */
  const resetScreen = () => {
    setCapturedImage(null);
    setLocation(null);
    setCurrentAddress('');
    setStep('idle');
  };

  /**
   * Open proof in full screen
   */
  const openProofFullScreen = (proof: RecentProof) => {
    setSelectedProof(proof);
    setModalVisible(true);
  };

  /**
   * Close full screen modal
   */
  const closeModal = () => {
    setModalVisible(false);
    setSelectedProof(null);
  };

  /**
   * Render a recent proof item
   */
  const renderProofItem = ({ item }: { item: RecentProof }) => {
    const accuracy = typeof item.accuracy === 'number' ? item.accuracy : parseFloat(item.accuracy as any);
    
    return (
      <TouchableOpacity 
        style={styles.proofItem}
        onPress={() => openProofFullScreen(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: item.photo_url }} 
          style={styles.proofThumbnail}
          resizeMode="cover"
        />
        <View style={styles.proofInfo}>
          <Text style={styles.proofDate}>
            {new Date(item.verified_timestamp).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.proofLocation} numberOfLines={2}>
            📍 {item.address || 'Loading address...'}
          </Text>
          <Text style={styles.proofAccuracy}>
            Accuracy: {!isNaN(accuracy) ? accuracy.toFixed(2) : 'N/A'}m
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Proof of Work</Text>
        <Text style={styles.subtitle}>Time & Geotagging with Anti-Tamper Protection</Text>
      </View>

      {/* Status Indicators */}
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, step !== 'idle' && styles.statusDotActive]} />
          <Text style={styles.statusText}>Photo Captured</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, step === 'verified' || step === 'uploaded' ? styles.statusDotActive : null]} />
          <Text style={styles.statusText}>Location Verified</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, step === 'uploaded' && styles.statusDotActive]} />
          <Text style={styles.statusText}>Proof Uploaded</Text>
        </View>
      </View>

      {/* Captured Image Preview */}
      {capturedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.image} />
        </View>
      )}

      {/* Location Info */}
      {location && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Location Information</Text>
          <Text style={styles.infoText}>📍 {currentAddress || 'Getting address...'}</Text>
          <Text style={styles.infoText}>Accuracy: {location.accuracy.toFixed(2)} meters</Text>
          <Text style={styles.infoText}>
            Timestamp: {new Date(location.timestamp).toLocaleString()}
          </Text>
          <View style={styles.mockStatus}>
            <Text style={[styles.infoText, !location.isMocked && styles.successText]}>
              Mock Location: {location.isMocked ? '⚠️ YES (REJECTED)' : '✓ NO (VERIFIED)'}
            </Text>
          </View>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={step === 'idle' ? capturePhoto : resetScreen}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {step === 'idle' ? '📷 Capture Proof' : '🔄 Capture New Proof'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Information Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoPanelTitle}>🔒 Security Features</Text>
        <Text style={styles.infoPanelText}>• Anti-Fake GPS Detection</Text>
        <Text style={styles.infoPanelText}>• Cryptographic Integrity Hash</Text>
        <Text style={styles.infoPanelText}>• Server-Side Verification</Text>
        <Text style={styles.infoPanelText}>• Tamper-Proof Timestamps</Text>
      </View>

      {/* Recently Captured Proofs Section */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>📋 Recently Captured Proofs</Text>
        {loadingHistory ? (
          <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 20 }} />
        ) : recentProofs.length > 0 ? (
          <FlatList
            data={recentProofs}
            keyExtractor={(item) => item.id}
            renderItem={renderProofItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        ) : (
          <Text style={styles.emptyText}>No proofs captured yet</Text>
        )}
      </View>

      {/* Full Screen Proof Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={closeModal}
          >
            <View style={styles.modalContent}>
              {selectedProof && (
                <>
                  <Image
                    source={{ uri: selectedProof.photo_url }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                  <View style={styles.modalInfoOverlay}>
                    <Text style={styles.modalDate}>
                      {new Date(selectedProof.verified_timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.modalLocation}>
                      📍 {selectedProof.address || 'Address unavailable'}
                    </Text>
                    <Text style={styles.modalAccuracy}>
                      Accuracy: {typeof selectedProof.accuracy === 'number' 
                        ? selectedProof.accuracy.toFixed(2) 
                        : parseFloat(selectedProof.accuracy as any).toFixed(2)}m
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginBottom: 5,
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  imageContainer: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  infoContainer: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  mockStatus: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  successText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  button: {
    margin: 20,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoPanel: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  infoPanelText: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 5,
  },
  recentSection: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  proofItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  proofThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  proofInfo: {
    flex: 1,
    marginLeft: 12,
  },
  proofDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  proofLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  proofAccuracy: {
    fontSize: 11,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  modalInfoOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    paddingBottom: 30,
  },
  modalDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalLocation: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalAccuracy: {
    fontSize: 13,
    color: '#ddd',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
