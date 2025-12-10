// Secure Geolocation Service with Anti-Fake GPS Detection
// Phase 1: Client-Side Data Capture & Verification

import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  isMocked: boolean;
}

export interface LocationError {
  code: number;
  message: string;
}

class SecureGeolocationService {
  private static instance: SecureGeolocationService;

  static getInstance(): SecureGeolocationService {
    if (!SecureGeolocationService.instance) {
      SecureGeolocationService.instance = new SecureGeolocationService();
    }
    return SecureGeolocationService.instance;
  }

  /**
   * Request location permissions based on platform
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get current location with anti-fake GPS detection
   * Step 2: Anti-Fake GPS Implementation
   */
  async getCurrentLocation(): Promise<{ success: boolean; data?: LocationData; error?: LocationError }> {
    try {
      // Check permissions first
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: -1,
            message: 'Location permission denied',
          },
        };
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      // Check if location is mocked (Android)
      const isMocked = location.mocked || false;

      if (isMocked) {
        Alert.alert(
          'Mock Location Detected',
          'Cannot capture proof while Mock Locations are enabled. Please disable Developer Options > Mock Location.',
          [{ text: 'OK' }]
        );

        return {
          success: false,
          error: {
            code: -2,
            message: 'Mock location detected - proof rejected',
          },
        };
      }

      // Extract verified location data
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp, // GPS timestamp, not device clock
        isMocked: false, // Verified as non-mocked
      };

      console.log('✓ Verified location captured:', locationData);

      return {
        success: true,
        data: locationData,
      };
    } catch (error: any) {
      console.error('Location service error:', error);
      return {
        success: false,
        error: {
          code: -3,
          message: error.message || 'Failed to get location',
        },
      };
    }
  }

  /**
   * Watch location changes (useful for continuous tracking)
   */
  async watchLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError: (error: LocationError) => void
  ): Promise<{ remove: () => void } | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        onError({
          code: -1,
          message: 'Location permission denied',
        });
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Update every 5 seconds
        },
        (location) => {
          const isMocked = location.mocked || false;

          if (isMocked) {
            onError({
              code: -2,
              message: 'Mock location detected',
            });
            return;
          }

          onLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
            isMocked: false,
          });
        }
      );

      return subscription;
    } catch (error: any) {
      onError({
        code: -3,
        message: error.message || 'Failed to watch location',
      });
      return null;
    }
  }
}

// Export singleton instance
const secureGeolocationService = SecureGeolocationService.getInstance();
export default secureGeolocationService;
