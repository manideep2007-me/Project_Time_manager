// Proof of Work Capture Screen
// Complete demonstration of Time & Geotagging with Anti-Tamper/Anti-Fake GPS

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import advancedGeolocation, { AdvancedLocationData } from '../../services/advancedGeolocationService';
import integrityHash from '../../services/integrityHashService';
import { api } from '../../api/client';
import { API_BASE_URL } from '../../utils/config';

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
  const navigation = useNavigation<any>();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<AdvancedLocationData | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'captured' | 'verified' | 'uploaded'>('idle');
  const [recentProofs, setRecentProofs] = useState<RecentProof[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProof, setSelectedProof] = useState<RecentProof | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Build the full URL for a proof photo so the Image component can load it.
   * The backend stores a relative path like "/uploads/proof-of-work/proof-xxx.jpg".
   */
  const getPhotoFullUrl = (photoUrl: string): string => {
    if (!photoUrl) return '';
    // Already an absolute URL
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
    // Build full URL: e.g. http://10.0.2.2:5000/uploads/proof-of-work/proof-xxx.jpg
    return `${API_BASE_URL}${photoUrl}`;
  };

  /**
   * Fetch recent proofs on component mount
   */
  useEffect(() => {
    fetchRecentProofs();
  }, []);

  /**
   * Pull-to-refresh handler
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecentProofs();
    setRefreshing(false);
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
    const photoUri = getPhotoFullUrl(item.photo_url);
    
    return (
      <TouchableOpacity 
        style={styles.proofItem}
        onPress={() => openProofFullScreen(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: photoUri }} 
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
            <Ionicons name="location" size={12} color="#877ED2" /> {item.address || 'Loading address...'}
          </Text>
          <Text style={styles.proofAccuracy}>
            Accuracy: {!isNaN(accuracy) ? accuracy.toFixed(2) : 'N/A'}m
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Custom Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Proof of Work</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#877ED2']}
            tintColor="#877ED2"
          />
        }
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" style={{ marginBottom: 6 }} />
            <Text style={styles.bannerTitle}>Proof of Work</Text>
            <Text style={styles.bannerSubtitle}>Time & Geotagging with Anti-Tamper Protection</Text>
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusCard}>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, step !== 'idle' && styles.statusDotActive]} />
              <Text style={styles.statusText}>Photo Captured</Text>
            </View>
            <View style={styles.statusLine} />
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, (step === 'verified' || step === 'uploaded') && styles.statusDotActive]} />
              <Text style={styles.statusText}>Location Verified</Text>
            </View>
            <View style={styles.statusLine} />
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, step === 'uploaded' && styles.statusDotActive]} />
              <Text style={styles.statusText}>Proof Uploaded</Text>
            </View>
          </View>
        </View>

        {/* Captured Image Preview */}
        {capturedImage && (
          <View style={styles.imageCard}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
          </View>
        )}

        {/* Location Info */}
        {location && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Location Information</Text>
            <View style={styles.cardDivider} />
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#877ED2" />
              <Text style={styles.locationText}>{currentAddress || 'Getting address...'}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="navigate-circle-outline" size={16} color="#666" />
              <Text style={styles.locationDetailText}>Accuracy: {location.accuracy.toFixed(2)} meters</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.locationDetailText}>
                Timestamp: {new Date(location.timestamp).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.mockBadge, location.isMocked ? styles.mockBadgeDanger : styles.mockBadgeSafe]}>
              <Ionicons 
                name={location.isMocked ? 'warning' : 'checkmark-circle'} 
                size={16} 
                color={location.isMocked ? '#FF3B30' : '#34C759'} 
              />
              <Text style={[styles.mockText, location.isMocked ? styles.mockTextDanger : styles.mockTextSafe]}>
                Mock Location: {location.isMocked ? 'YES (REJECTED)' : 'NO (VERIFIED)'}
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={step === 'idle' ? capturePhoto : resetScreen}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.actionButtonContent}>
              <Ionicons name={step === 'idle' ? 'camera' : 'refresh'} size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {step === 'idle' ? 'Capture Proof' : 'Capture New Proof'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Security Features */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Ionicons name="lock-closed" size={16} color="#877ED2" />
            <Text style={styles.securityTitle}>Security Features</Text>
          </View>
          <View style={styles.securityList}>
            <Text style={styles.securityItem}>
              <Ionicons name="ellipse" size={6} color="#877ED2" /> Anti-Fake GPS Detection
            </Text>
            <Text style={styles.securityItem}>
              <Ionicons name="ellipse" size={6} color="#877ED2" /> Cryptographic Integrity Hash
            </Text>
            <Text style={styles.securityItem}>
              <Ionicons name="ellipse" size={6} color="#877ED2" /> Server-Side Verification
            </Text>
            <Text style={styles.securityItem}>
              <Ionicons name="ellipse" size={6} color="#877ED2" /> Tamper-Proof Timestamps
            </Text>
          </View>
        </View>

        {/* Recently Captured Proofs */}
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Ionicons name="document-text-outline" size={18} color="#1A1A1A" />
            <Text style={styles.recentTitle}>Recently Captured Proofs</Text>
          </View>
          {loadingHistory ? (
            <ActivityIndicator size="small" color="#877ED2" style={{ marginVertical: 24 }} />
          ) : recentProofs.length > 0 ? (
            <FlatList
              data={recentProofs}
              keyExtractor={(item) => item.id}
              renderItem={renderProofItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={40} color="#DADADA" />
              <Text style={styles.emptyText}>No proofs captured yet</Text>
              <Text style={styles.emptySubtext}>Tap "Capture Proof" above to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Proof Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            {/* Modal Header */}
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Proof Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.detailCloseButton}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedProof && (
              <ScrollView style={styles.detailModalBody} showsVerticalScrollIndicator={false}>
                {/* Photo */}
                <View style={styles.detailImageContainer}>
                  <Image
                    source={{ uri: getPhotoFullUrl(selectedProof.photo_url) }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Info Card */}
                <View style={styles.detailInfoCard}>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="calendar-outline" size={18} color="#877ED2" />
                    <View style={styles.detailInfoTextGroup}>
                      <Text style={styles.detailInfoLabel}>Date & Time</Text>
                      <Text style={styles.detailInfoValue}>
                        {new Date(selectedProof.verified_timestamp).toLocaleString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailDivider} />
                  
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="location" size={18} color="#877ED2" />
                    <View style={styles.detailInfoTextGroup}>
                      <Text style={styles.detailInfoLabel}>Location</Text>
                      <Text style={styles.detailInfoValue}>
                        {selectedProof.address || 'Address unavailable'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailDivider} />
                  
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="navigate-circle-outline" size={18} color="#877ED2" />
                    <View style={styles.detailInfoTextGroup}>
                      <Text style={styles.detailInfoLabel}>Coordinates & Accuracy</Text>
                      <Text style={styles.detailInfoValue}>
                        {typeof selectedProof.latitude === 'number' 
                          ? `${selectedProof.latitude.toFixed(6)}, ${selectedProof.longitude.toFixed(6)}`
                          : `${parseFloat(selectedProof.latitude as any).toFixed(6)}, ${parseFloat(selectedProof.longitude as any).toFixed(6)}`
                        }
                        {' '} ({typeof selectedProof.accuracy === 'number' 
                          ? selectedProof.accuracy.toFixed(2) 
                          : parseFloat(selectedProof.accuracy as any).toFixed(2)}m)
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailDivider} />
                  
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="shield-checkmark" size={18} color="#34C759" />
                    <View style={styles.detailInfoTextGroup}>
                      <Text style={styles.detailInfoLabel}>Verification Status</Text>
                      <Text style={[styles.detailInfoValue, { color: '#34C759' }]}>
                        Verified & Stored Securely
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  // Custom Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  // Banner
  banner: {
    backgroundColor: '#877ED2',
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#877ED2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_400Regular',
  },
  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  statusDotActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  statusLine: {
    height: 2,
    width: 24,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  // Captured Image
  imageCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  capturedImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  // Location Card
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  locationDetailText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mockBadgeSafe: {
    backgroundColor: '#F0FFF4',
  },
  mockBadgeDanger: {
    backgroundColor: '#FFF0F0',
  },
  mockText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
  },
  mockTextSafe: {
    color: '#34C759',
  },
  mockTextDanger: {
    color: '#FF3B30',
  },
  // Action Button
  actionButton: {
    backgroundColor: '#877ED2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#877ED2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonDisabled: {
    backgroundColor: '#C0C0C0',
    shadowOpacity: 0.1,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#fff',
  },
  // Security Card
  securityCard: {
    backgroundColor: '#F3F1FC',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#877ED2',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#877ED2',
  },
  securityList: {
    gap: 6,
  },
  securityItem: {
    fontSize: 13,
    color: '#6B63B5',
    fontFamily: 'Inter_400Regular',
    paddingLeft: 4,
  },
  // Recent Proofs
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#C0C0C0',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  proofItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  proofThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  proofInfo: {
    flex: 1,
    marginLeft: 12,
  },
  proofDate: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  proofLocation: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
    marginBottom: 3,
    lineHeight: 17,
  },
  proofAccuracy: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
  // Proof Detail Modal
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: 32,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  detailCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  detailModalBody: {
    padding: 20,
  },
  detailImageContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
  },
  detailImage: {
    width: '100%',
    height: 280,
  },
  detailInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  detailInfoTextGroup: {
    flex: 1,
  },
  detailInfoLabel: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailInfoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 12,
  },
});
