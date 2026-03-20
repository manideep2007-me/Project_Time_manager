import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { api, getStoredToken } from '../../api/client';
import { API_BASE_URL } from '../../utils/config';
import SafeAreaWrapper from '../../components/shared/SafeAreaWrapper';
import { typography } from '../../design/tokens';

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface StatusMessage {
  id: string;
  text: string;
  timestamp: string;
  dateLabel: string;
  sender?: string;
  senderType: 'self' | 'other';
  type: 'text' | 'voice';
  audioDuration?: string;
}

const WAVEFORM_HEIGHTS = [5,10,14,8,16,12,6,18,10,14,7,16,12,9,15,11,17,8,13,6,14,10,16,7];

const formatTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  catch { return ''; }
};

const formatDateHeader = (iso: string) => {
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString('en-IN', { weekday: 'long' });
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${day} ${date}`;
  } catch { return iso; }
};

export default function TaskUploadScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { user }   = useContext(AuthContext);
  const scrollRef  = useRef<ScrollView>(null);

  const taskId   = route.params?.taskId;
  const taskName = route.params?.taskName || 'Task';
  const taskDate = route.params?.taskDate || '';

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [uploadedFiles, setUploadedFiles]   = useState<UploadedFile[]>([]);
  const [messages, setMessages]             = useState<StatusMessage[]>([]);
  const [inputText, setInputText]           = useState('');

  // ── Load history ─────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!taskId) { setLoadingHistory(false); return; }
    try {
      const res     = await api.get(`/api/task-uploads/task/${taskId}`);
      const uploads = res.data?.uploads || [];
      const msgs: StatusMessage[] = uploads.map((u: any) => ({
        id:         u.upload_id || u.id,
        text:       u.description || '',
        timestamp:  u.created_at ? formatTime(u.created_at) : '',
        dateLabel:  u.created_at ? formatDateHeader(u.created_at) : 'Today',
        senderType: (u.uploaded_by === user?.id || u.employee_id === user?.id) ? 'self' : 'other',
        sender:     (u.uploaded_by !== user?.id) ? (u.uploader_name || u.employee_name || 'Manager') : undefined,
        type:       'text' as const,
      }));
      setMessages(msgs);
    } catch { setMessages([]); }
    finally  { setLoadingHistory(false); }
  }, [taskId, user?.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // ── Camera / Gallery ─────────────────────────────────────
  const requestPerm = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Please grant camera permissions.'); return false; }
    return true;
  };

  const takePhoto = async () => {
    if (!await requestPerm()) return;
    try {
      const r = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
      if (!r.canceled)
        setUploadedFiles(p => [...p, { uri: r.assets[0].uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg', size: r.assets[0].fileSize || 0 }]);
    } catch { Alert.alert('Error', 'Failed to take photo.'); }
  };

  const pickImages = async () => {
    if (!await requestPerm()) return;
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
      if (!r.canceled)
        setUploadedFiles(p => [...p, ...r.assets.map(a => ({ uri: a.uri, name: a.fileName || `img_${Date.now()}.jpg`, type: 'image/jpeg', size: a.fileSize || 0 }))]);
    } catch { Alert.alert('Error', 'Failed to pick image.'); }
  };

  // ── Send message locally ─────────────────────────────────
  const sendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date().toISOString();
    setMessages(p => [...p, {
      id:         `local_${Date.now()}`,
      text:       inputText.trim(),
      timestamp:  formatTime(now),
      dateLabel:  formatDateHeader(now),
      senderType: 'self',
      type:       'text',
    }]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const deleteMessage = (id: string) => setMessages(p => p.filter(m => m.id !== id));

  // ── Submit to API ─────────────────────────────────────────
  const handleSubmit = async () => {
    const newTexts = messages.filter(m => m.id.startsWith('local_')).map(m => m.text).join('\n');
    if (!newTexts && uploadedFiles.length === 0) {
      Alert.alert('Required', 'Please write a status or attach a photo first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('taskId',      taskId);
      fd.append('description', newTexts || 'Status update');
      uploadedFiles.forEach(f => fd.append('files', { uri: f.uri, name: f.name, type: f.type } as any));
      const token = await getStoredToken();
      if (!token) { Alert.alert('Auth Error', 'Please log in again.'); return; }
      const res = await fetch(`${API_BASE_URL}/api/task-uploads/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Upload failed');
      setUploadedFiles([]);
      setInputText('');
      await loadHistory();
      Alert.alert('Success', 'Status submitted!');
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally { setIsSubmitting(false); }
  };

  // ── Group by date ─────────────────────────────────────────
  const grouped = messages.reduce<{ label: string; items: StatusMessage[] }[]>((acc, m) => {
    const g = acc.find(x => x.label === m.dateLabel);
    if (g) g.items.push(m); else acc.push({ label: m.dateLabel, items: [m] });
    return acc;
  }, []);

  const hasNew = messages.some(m => m.id.startsWith('local_')) || uploadedFiles.length > 0;

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Status</Text>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: '#EFEFEF' }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#877ED2" />}
          >
            {/* ── White top section ── */}
            <View style={styles.topSection}>
              <Text style={styles.taskName}>{taskName}</Text>
              {!!taskDate && <Text style={styles.taskDate}>{taskDate}</Text>}

              {/* Camera circle */}
              <View style={styles.cameraSection}>
                <TouchableOpacity style={styles.cameraCircle} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={44} color="#877ED2" />
                </TouchableOpacity>
              </View>

              {/* Thumbnails */}
              {uploadedFiles.length > 0 && (
                <View style={styles.photoRow}>
                  {uploadedFiles.map((f, i) => (
                    <View key={i} style={styles.thumbWrap}>
                      <Image source={{ uri: f.uri }} style={styles.thumb} />
                      <TouchableOpacity style={styles.thumbX} onPress={() => setUploadedFiles(p => p.filter((_, idx) => idx !== i))}>
                        <Ionicons name="close-circle" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.thumbAdd} onPress={pickImages}>
                    <Ionicons name="add" size={24} color="#877ED2" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Record status input */}
              <Text style={styles.recordLabel}>Record your status</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  textAlignVertical="top"
                  placeholder=""
                />
                <View style={styles.inputBtns}>
                  <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Ionicons name="chevron-forward" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.micBtn}>
                    <Ionicons name="mic" size={20} color="#877ED2" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Gray chat section ── */}
            <View style={styles.chatSection}>
              {loadingHistory ? (
                <ActivityIndicator color="#877ED2" style={{ marginVertical: 24 }} />
              ) : grouped.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={32} color="#C0C0C0" />
                  <Text style={styles.emptyText}>No status records yet</Text>
                </View>
              ) : (
                grouped.map(group => (
                  <View key={group.label}>
                    <Text style={styles.dateHeader}>{group.label}</Text>
                    {group.items.map(msg => {
                      const isSelf = msg.senderType === 'self';

                      if (msg.type === 'voice') {
                        return (
                          <View key={msg.id} style={styles.sentBubbleWrap}>
                            <View style={styles.sentBubble}>
                              <View style={styles.voiceRow}>
                                <TouchableOpacity style={styles.playBtn}>
                                  <Ionicons name="play" size={13} color="#1A1A1A" />
                                </TouchableOpacity>
                                <View style={styles.waveform}>
                                  {WAVEFORM_HEIGHTS.map((h, wi) => (
                                    <View key={wi} style={[styles.waveBar, { height: h }]} />
                                  ))}
                                </View>
                                <Text style={styles.voiceDur}>{msg.audioDuration}</Text>
                              </View>
                              <View style={styles.bubbleFooter}>
                                <Text style={styles.timeText}>{msg.timestamp}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      }

                      if (!isSelf) {
                        return (
                          <View key={msg.id} style={styles.receivedBubbleWrap}>
                            <View style={styles.receivedBubble}>
                              <Text style={styles.bubbleText}>{msg.text}</Text>
                              <View style={styles.bubbleFooter}>
                                <Text style={styles.timeText}>{msg.timestamp}</Text>
                                {msg.sender && <Text style={styles.senderName}> {msg.sender}</Text>}
                              </View>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View key={msg.id} style={styles.sentBubbleWrap}>
                          <View style={styles.sentBubble}>
                            <Text style={styles.bubbleText}>{msg.text}</Text>
                            <View style={styles.bubbleFooter}>
                              <Text style={styles.timeText}>{msg.timestamp}</Text>
                              <TouchableOpacity>
                                <Ionicons name="checkmark-circle-outline" size={15} color="#4CAF50" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => deleteMessage(msg.id)}>
                                <Ionicons name="trash-outline" size={15} color="#9E9E9E" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* ── Submit button ── */}
          <View style={styles.submitRow}>
            <TouchableOpacity
              style={[styles.submitBtn, (!hasNew || isSubmitting) && styles.submitBtnOff]}
              onPress={handleSubmit}
              disabled={!hasNew || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.submitText}>Submit Status</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: typography.families.bold,
    textAlign: 'center',
  },

  // Top section
  topSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  taskName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', fontFamily: typography.families.bold, marginBottom: 2 },
  taskDate: { fontSize: 13, color: '#8E8E93', fontFamily: typography.families.regular, marginBottom: 0 },

  // Camera
  cameraSection: { alignItems: 'center', paddingVertical: 18 },
  cameraCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#EBEBEB',
    alignItems: 'center', justifyContent: 'center',
  },

  // Thumbnails
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  thumbWrap: { position: 'relative', width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: 8, resizeMode: 'cover', backgroundColor: '#E0E0E0' },
  thumbX: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10, zIndex: 10 },
  thumbAdd: {
    width: 64, height: 64, borderRadius: 8,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#877ED2',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFF',
  },

  // Input
  recordLabel: { fontSize: 13, color: '#8E8E93', fontFamily: typography.families.regular, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1, minHeight: 72, maxHeight: 120,
    borderWidth: 1, borderColor: '#DEDEDE', borderRadius: 10,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10,
    fontSize: 14, color: '#1A1A1A', fontFamily: typography.families.regular,
    backgroundColor: '#FFFFFF', textAlignVertical: 'top',
  },
  inputBtns: { gap: 8, alignItems: 'center', paddingBottom: 2 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#877ED2', alignItems: 'center', justifyContent: 'center' },
  micBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDE9FB', alignItems: 'center', justifyContent: 'center' },

  // Chat
  chatSection: { backgroundColor: '#EFEFEF', paddingHorizontal: 12, paddingTop: 14, paddingBottom: 14, flexGrow: 1 },
  dateHeader: { fontSize: 12, color: '#D4834A', textAlign: 'center', marginBottom: 12, fontFamily: typography.families.regular },
  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText:  { fontSize: 13, color: '#BDBDBD', fontFamily: typography.families.regular },

  // Sent bubble (full width, green)
  sentBubbleWrap: { marginBottom: 8 },
  sentBubble: {
    backgroundColor: '#C8EFC8',
    borderRadius: 10, borderTopLeftRadius: 2,
    paddingHorizontal: 14, paddingVertical: 10,
  },

  // Received bubble (narrow, right-aligned, lavender)
  receivedBubbleWrap: { alignItems: 'flex-end', marginBottom: 8 },
  receivedBubble: {
    backgroundColor: '#DDD9F5',
    borderRadius: 10, borderTopRightRadius: 2,
    paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: '80%',
  },

  bubbleText: { fontSize: 13, color: '#1A1A1A', fontFamily: typography.families.regular, lineHeight: 18, marginBottom: 4 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  timeText:   { fontSize: 10, color: '#8E8E93', fontFamily: typography.families.regular },
  senderName: { fontSize: 10, color: '#877ED2', fontWeight: '600', fontFamily: typography.families.semibold },

  // Voice
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  playBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 22 },
  waveBar:  { width: 2.5, backgroundColor: '#444', borderRadius: 2, opacity: 0.7 },
  voiceDur: { fontSize: 11, color: '#444', fontFamily: typography.families.regular },

  // Submit
  submitRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  submitBtn:    { backgroundColor: '#877ED2', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 28, minWidth: 140, alignItems: 'center' },
  submitBtnOff: { backgroundColor: '#C5BFEA' },
  submitText:   { fontSize: 14, fontWeight: '600', color: '#FFFFFF', fontFamily: typography.families.semibold },
});
