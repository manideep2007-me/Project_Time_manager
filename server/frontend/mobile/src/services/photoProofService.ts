/**
 * Photo Proof Service
 * Handles compositing timestamp, GPS, and metadata overlays onto photos
 */

import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat, Action } from 'expo-image-manipulator';

interface PhotoMetadata {
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  taskTitle: string;
  projectName: string;
  taskId: string;
  workType?: string;
}

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day} ${month}, ${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Generate photo proof filename with metadata
 */
export const generateProofFilename = (metadata: PhotoMetadata): string => {
  const timestamp = new Date(metadata.timestamp);
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  const taskSlug = metadata.taskTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  
  return `proof_${dateStr}_${timeStr}_${taskSlug}.jpg`;
};

/**
 * Save photo with metadata
 * Note: Actual overlay compositing requires react-native-view-shot or server-side processing
 * This function prepares the photo and metadata for storage
 */
export const savePhotoProof = async (
  imageUri: string,
  metadata: PhotoMetadata
): Promise<{
  uri: string;
  filename: string;
  metadata: PhotoMetadata;
}> => {
  try {
    // Generate filename
    const filename = generateProofFilename(metadata);
    const newUri = `${FileSystem.cacheDirectory}${filename}`;
    
    // Copy image to cache with new filename
    await FileSystem.copyAsync({
      from: imageUri,
      to: newUri,
    });
    
    // Create metadata file
    const metadataUri = `${FileSystem.cacheDirectory}${filename}.json`;
    await FileSystem.writeAsStringAsync(
      metadataUri,
      JSON.stringify(metadata, null, 2)
    );
    
    return {
      uri: newUri,
      filename,
      metadata,
    };
  } catch (error) {
    console.error('Error saving photo proof:', error);
    throw error;
  }
};

/**
 * Get photo metadata if available
 */
export const getPhotoMetadata = async (imageUri: string): Promise<PhotoMetadata | null> => {
  try {
    const metadataUri = `${imageUri}.json`;
    const metadataStr = await FileSystem.readAsStringAsync(metadataUri);
    return JSON.parse(metadataStr);
  } catch (error) {
    return null;
  }
};

/**
 * Create photo proof object with all metadata
 */
export const createPhotoProof = (
  imageUri: string,
  metadata: PhotoMetadata
): {
  uri: string;
  timestamp: string;
  location?: PhotoMetadata['location'];
  metadata: PhotoMetadata;
  displayInfo: {
    timestamp: string;
    location: string;
    taskTitle: string;
    projectName: string;
    workType: string;
  };
} => {
  const displayInfo = {
    timestamp: formatTimestamp(new Date(metadata.timestamp)),
    location: metadata.location
      ? metadata.location.address || formatCoordinates(metadata.location.latitude, metadata.location.longitude)
      : 'Location not available',
    taskTitle: metadata.taskTitle,
    projectName: metadata.projectName,
    workType: metadata.workType || 'General',
  };
  
  return {
    uri: imageUri,
    timestamp: metadata.timestamp,
    location: metadata.location,
    metadata,
    displayInfo,
  };
};

