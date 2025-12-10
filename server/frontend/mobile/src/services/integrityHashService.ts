// Anti-Tamper Integrity Hash Service
// Phase 1: Step 3 - Client-Side Integrity Hashing

import * as Crypto from 'expo-crypto';
// Use legacy API to support readAsStringAsync base64 on SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { LocationData } from './secureGeolocationService';

// IMPORTANT: This secret salt MUST match the backend's SECRET_SALT
// In production, store this securely (e.g., in secure environment variables)
const SECRET_SALT = 'ProofSalt2025_SecureHash_TimeGeo_AntiTamper_ChangeInProduction!';

export interface ProofPayload {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  isMocked: boolean;
  fileUri: string;
  fileHash: string;
  clientHash: string;
}

class IntegrityHashService {
  private static instance: IntegrityHashService;

  static getInstance(): IntegrityHashService {
    if (!IntegrityHashService.instance) {
      IntegrityHashService.instance = new IntegrityHashService();
    }
    return IntegrityHashService.instance;
  }

  /**
   * Calculate SHA-256 hash of a file
   * Step 3.2: Get File Hash
   */
  async calculateFileHash(fileUri: string): Promise<string> {
    try {
      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      // Calculate SHA-256 hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileContent
      );

      return hash;
    } catch (error) {
      console.error('Error calculating file hash:', error);
      throw new Error('Failed to calculate file hash');
    }
  }

  /**
   * Generate client-side integrity hash
   * Step 3.3: Generate Client Hash
   * 
   * Formula: SHA-256(Latitude:Longitude:Timestamp:SecretSalt:FileHash)
   * 
   * This creates a cryptographic proof that links:
   * - The location (lat/lon)
   * - The time (timestamp)
   * - The file (fileHash)
   * - A secret known only to client and server (SecretSalt)
   */
  async generateIntegrityHash(
    location: LocationData,
    fileUri: string
  ): Promise<{ fileHash: string; clientHash: string }> {
    try {
      // Calculate file hash
      const fileHash = await this.calculateFileHash(fileUri);
      console.log('📁 Client file URI:', fileUri);
      console.log('🔐 Client file hash:', fileHash);

      // Build concatenation string in strict order
      const dataString = `${location.latitude}:${location.longitude}:${location.timestamp}:${SECRET_SALT}:${fileHash}`;
      console.log('🔗 Client data string (first 100):', dataString.substring(0, 100) + '...');

      // Calculate SHA-256 of the concatenated string
      const clientHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataString
      );

      console.log('✅ Client integrity hash generated:', clientHash);
      console.log('📍 Location used:', {
        lat: location.latitude,
        lon: location.longitude,
        timestamp: location.timestamp,
      });

      return {
        fileHash,
        clientHash,
      };
    } catch (error) {
      console.error('Error generating integrity hash:', error);
      throw new Error('Failed to generate integrity hash');
    }
  }

  /**
   * Create complete proof payload
   * Combines location data and integrity hashes
   */
  async createProofPayload(
    location: LocationData,
    fileUri: string
  ): Promise<ProofPayload> {
    try {
      // Generate integrity hashes
      const { fileHash, clientHash } = await this.generateIntegrityHash(location, fileUri);

      // Assemble complete payload
      const payload: ProofPayload = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        accuracy: location.accuracy,
        isMocked: location.isMocked,
        fileUri,
        fileHash,
        clientHash,
      };

      console.log('✓ Proof payload created:', {
        ...payload,
        fileUri: '***', // Don't log full URI
      });

      return payload;
    } catch (error) {
      console.error('Error creating proof payload:', error);
      throw new Error('Failed to create proof payload');
    }
  }

  /**
   * Verify if two hashes match (client-side verification before upload)
   */
  verifyHash(hash1: string, hash2: string): boolean {
    return hash1.toLowerCase() === hash2.toLowerCase();
  }
}

export default IntegrityHashService.getInstance();
