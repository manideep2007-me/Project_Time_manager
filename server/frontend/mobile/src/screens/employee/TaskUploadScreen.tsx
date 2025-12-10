import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { API_BASE_URL } from '../../utils/config';

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export default function TaskUploadScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);
  
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const taskId = route.params?.taskId;
  const taskName = route.params?.taskName || 'Task';

  // Allowed file types based on backend configuration
  const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: UploadedFile): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFileTypes.test(fileExtension)) {
      return `File "${file.name}" has an unsupported format. Allowed: images, PDFs, and office documents.`;
    }

    return null;
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image',
          size: asset.fileSize || 0,
        }));

        // Validate files before adding
        const validFiles: UploadedFile[] = [];
        const errors: string[] = [];

        newFiles.forEach(file => {
          const error = validateFile(file);
          if (error) {
            errors.push(error);
          } else {
            validFiles.push(file);
          }
        });

        if (errors.length > 0) {
          Alert.alert('Invalid Files', errors.join('\n\n'));
        }

        if (validFiles.length > 0) {
          setUploadedFiles(prev => [...prev, ...validFiles]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const newFile = {
          uri: result.assets[0].uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image',
          size: result.assets[0].fileSize || 0,
        };

        // Validate file before adding
        const error = validateFile(newFile);
        if (error) {
          Alert.alert('Invalid File', error);
        } else {
          setUploadedFiles(prev => [...prev, newFile]);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));

        // Validate files before adding
        const validFiles: UploadedFile[] = [];
        const errors: string[] = [];

        newFiles.forEach(file => {
          const error = validateFile(file);
          if (error) {
            errors.push(error);
          } else {
            validFiles.push(file);
          }
        });

        if (errors.length > 0) {
          Alert.alert('Invalid Files', errors.join('\n\n'));
        }

        if (validFiles.length > 0) {
          setUploadedFiles(prev => [...prev, ...validFiles]);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image-outline';
    if (type.includes('pdf')) return 'document-text-outline';
    if (type.includes('word') || type.includes('document')) return 'document-outline';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'grid-outline';
    return 'document-outline';
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a description of your completed work.');
      return;
    }

    if (uploadedFiles.length === 0) {
      Alert.alert('No Files', 'Please upload at least one file to submit your completed task.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('description', description.trim());
      
      // Append files to FormData
      uploadedFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });

      // Get token from AuthContext
      const token = user?.token;
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to upload files.');
        return;
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_BASE_URL}/api/task-uploads/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      Alert.alert(
        'Success',
        `Your completed task has been submitted successfully!\n\nUpload ID: ${result.uploadId}\nFiles uploaded: ${result.filesCount}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setDescription('');
              setUploadedFiles([]);
              setUploadProgress(0);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting task:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Handle specific error types
      if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (errorMessage.includes('File size too large')) {
        errorMessage = 'One or more files are too large. Maximum size is 10MB per file.';
      } else if (errorMessage.includes('Only images, PDFs, and office documents are allowed')) {
        errorMessage = 'One or more files have an unsupported format. Please check file types and try again.';
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Completed Task</Text>
        <Text style={styles.taskName}>{taskName}</Text>
      </View>

      <Card style={styles.descriptionCard}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you completed for this task..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{description.length}/500</Text>
      </Card>

      <Card style={styles.uploadCard}>
        <Text style={styles.label}>Attachments *</Text>
        <Text style={styles.subLabel}>Upload files, photos, or documents related to your work</Text>
        
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color="#007AFF" />
            <Text style={styles.uploadButtonText}>Photos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color="#007AFF" />
            <Text style={styles.uploadButtonText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Ionicons name="document-outline" size={24} color="#007AFF" />
            <Text style={styles.uploadButtonText}>Files</Text>
          </TouchableOpacity>
        </View>

        {uploadedFiles.length > 0 && (
          <View style={styles.filesList}>
            <Text style={styles.filesTitle}>Uploaded Files ({uploadedFiles.length})</Text>
            {uploadedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  {file.type.startsWith('image/') ? (
                    <Image 
                      source={{ uri: file.uri }} 
                      style={styles.filePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons 
                      name={getFileIcon(file.type) as any} 
                      size={20} 
                      color="#007AFF" 
                    />
                  )}
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFile(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Uploading files... {uploadProgress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        )}
      </Card>

      <View style={styles.submitSection}>
        <Button
          title={isUploading ? 'Submitting...' : 'Submit Completed Task'}
          onPress={handleSubmit}
          disabled={isUploading || !description.trim() || uploadedFiles.length === 0}
          loading={isUploading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  descriptionCard: {
    margin: 16,
  },
  uploadCard: {
    margin: 16,
    marginTop: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minWidth: 80,
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  filesList: {
    marginTop: 16,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  submitSection: {
    padding: 16,
    paddingBottom: 32,
  },
  filePreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  progressContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e1e5e9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
});
