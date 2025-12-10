import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/shared/AppHeader';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';

interface Photo {
  id: string;
  uri: string;
  caption?: string;
}

export default function AllAttachmentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { attachments, taskTitle } = route.params as { 
    attachments: Photo[]; 
    taskTitle: string; 
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <View style={styles.photoItem}>
      <View style={styles.photoContainer}>
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={60} color="#8E8E93" />
        </View>
        {item.caption && (
          <Text style={styles.photoCaption}>{item.caption}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor="#F2F2F7">
      <View style={styles.container}>
        {/* Header */}
        <AppHeader
          leftAction={{
            icon: '←',
            onPress: () => navigation.goBack(),
            iconStyle: { fontSize: 34 }
          }}
        />
        
        <View style={styles.content}>
          {/* Page Title */}
          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle}>All Attachments</Text>
          </View>

          {/* Task Title */}
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{taskTitle}</Text>
            <Text style={styles.attachmentCount}>
              {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Attachments Grid */}
          <FlatList
            data={attachments}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.attachmentsGrid}
            columnWrapperStyle={styles.row}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  pageTitleContainer: {
    paddingVertical: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  taskInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  attachmentCount: {
    fontSize: 14,
    color: '#666',
  },
  attachmentsGrid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  photoCaption: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
