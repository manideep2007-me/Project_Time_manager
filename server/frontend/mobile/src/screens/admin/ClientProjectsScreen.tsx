import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../api/client';

// ── Design constants ────────────────────────────────────────────────
const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const COLORS = {
  bg: '#F0F0F0',
  surface: '#FFFFFF',
  accent: '#877ED2',
  accentLight: '#7E99D2',
  textPrimary: '#1A1A1A',
  textSecondary: '#6A6D73',
  textMuted: '#999999',
  border: '#E5E6EB',
  green: '#4CAF50',
  greenLight: '#66BB6A',
  red: '#EF5350',
  blueGray: '#7986CB',
};

// ── Component ───────────────────────────────────────────────────────
export default function ClientProjectsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { client, projects } = route.params || { client: {}, projects: [] };
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSource, setProjectSource] = useState<any[]>(Array.isArray(projects) ? projects : []);
  const [filteredProjects, setFilteredProjects] = useState<any[]>(Array.isArray(projects) ? projects : []);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clientExpanded, setClientExpanded] = useState(true);

  // Hide the default navigation header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadClientProjects = async () => {
    if (!client?.id) return;
    try {
      const res = await api.get(`/api/clients/${client.id}/projects`, { params: { page: 1, limit: 100 } });
      const list = Array.isArray(res.data?.projects) ? res.data.projects : [];
      setProjectSource(list);
    } catch {
      try {
        const fallback = await api.get('/api/projects', { params: { page: 1, limit: 100, clientId: client.id } });
        const list = Array.isArray(fallback.data?.projects) ? fallback.data.projects : [];
        setProjectSource(list);
      } catch {
        setProjectSource([]);
      }
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/api/employees', { params: { page: 1, limit: 200, active: 'all' } });
      const list = Array.isArray(res.data?.employees) ? res.data.employees : [];
      setEmployees(list);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      loadClientProjects();
    }
    loadEmployees();
  }, [client?.id]);

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projectSource);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = projectSource.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.status?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projectSource]);

  // Stats – use full project list, not filtered
  const totalProjects = projectSource.length;
  const activeProjects = projectSource.filter((p: any) => {
    const s = (p.status || '').toLowerCase();
    return s === 'active' || s === 'in progress';
  }).length;
  const inactiveProjects = projectSource.filter((p: any) => {
    const s = (p.status || '').toLowerCase();
    return s === 'completed' || s === 'cancelled' || s === 'on hold';
  }).length;

  // ── Helpers ─────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getProgressInfo = (project: any) => {
    const status = (project.status || 'in progress').toLowerCase();
    const now = new Date();
    const endDate = project.end_date ? new Date(project.end_date) : null;
    const startDate = project.start_date ? new Date(project.start_date) : null;
    const isOverdue = endDate && endDate < now && !status.includes('completed');

    if (status.includes('completed')) {
      return { label: 'Completed', color: COLORS.blueGray, progress: 100, days: null };
    }
    if (isOverdue || status.includes('overdue')) {
      const diff = endDate ? Math.ceil((now.getTime() - endDate.getTime()) / 86400000) : 0;
      return { label: 'Over due', color: COLORS.red, progress: 100, days: `${diff}d` };
    }
    // In‑progress
    let progress = 50;
    if (startDate && endDate) {
      const total = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      progress = Math.min(Math.max(Math.round((elapsed / total) * 100), 5), 95);
    }
    const remaining = endDate ? Math.max(Math.ceil((endDate.getTime() - now.getTime()) / 86400000), 0) : 0;
    return { label: 'In Progress', color: COLORS.greenLight, progress, days: `${remaining}d` };
  };

  const getBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed')) return { bg: COLORS.blueGray, label: 'Completed' };
    if (s.includes('overdue')) return { bg: COLORS.red, label: 'Over due' };
    if (s === 'to do' || s === 'new') return { bg: COLORS.accentLight, label: 'In Progress' };
    if (s === 'active' || s === 'in progress' || s === 'in_progress') return { bg: COLORS.accentLight, label: 'In Progress' };
    return { bg: COLORS.accentLight, label: 'In Progress' };
  };

  const getProjectAvatarUris = (project: any) => {
    const members = Array.isArray(project.team_members)
      ? project.team_members
      : Array.isArray(project.assigned_to)
        ? project.assigned_to
        : [];

    const byId = (id: any) =>
      employees.find(
        (e: any) =>
          String(e.id) === String(id) ||
          String(e.employee_id) === String(id) ||
          String(e.user_id) === String(id)
      );

    const fromMembers = members
      .map((m: any) => {
        if (typeof m === 'string' || typeof m === 'number') {
          const emp = byId(m);
          return emp?.photo_url || emp?.photoUrl || emp?.photograph || '';
        }
        return m?.photo_url || m?.photoUrl || m?.photograph || byId(m?.id || m?.employee_id)?.photo_url || '';
      })
      .filter(Boolean)
      .slice(0, 3);

    if (fromMembers.length > 0) return fromMembers;

    // Fallback: use real employee photos from org (not generated avatars)
    const orgPhotos = employees
      .map((e: any) => e?.photo_url || e?.photoUrl || e?.photograph || '')
      .filter(Boolean)
      .slice(0, 3);

    return orgPhotos;
  };

  // ── Project card ────────────────────────────────────────────────
  const renderProjectCard = ({ item }: any) => {
    const progress = getProgressInfo(item);
    const badge = getBadge(item.status);
    const avatarUris = getProjectAvatarUris(item);

    return (
      <View style={styles.projectCard}>
        <View style={styles.cardContent}>
          {/* Status badge */}
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>

          {/* Location */}
          <Text style={styles.projectLocation}>
            {item.location || 'Yelahanka, Bangalore'}
          </Text>

          {/* Name + avatar row */}
          <View style={styles.nameRow}>
            <Text style={styles.projectName} numberOfLines={2}>
              {item.name}
            </Text>

            {/* Overlapping avatars + green plus */}
            <View style={styles.avatarGroup}>
              {avatarUris.map((uri: string, i: number) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[
                    styles.avatar,
                    { zIndex: 10 - i, marginLeft: i === 0 ? 0 : -10 },
                  ]}
                />
              ))}
              <TouchableOpacity
                style={styles.plusBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer – dates + progress */}
          <View style={styles.footer}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Start</Text>
              <Text style={styles.dateValue}>{formatDate(item.start_date)}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>End</Text>
              <Text style={styles.dateValue}>{formatDate(item.end_date)}</Text>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{progress.label}</Text>
                {progress.days !== null && (
                  <Text style={[styles.progressDays, { color: progress.color }]}>
                    {progress.days}
                  </Text>
                )}
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress.progress}%`, backgroundColor: progress.color },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clients</Text>
      </View>

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <TextInput
                placeholder="Search"
                style={styles.searchInput}
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Ionicons name="search-outline" size={22} color={COLORS.accent} />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                Total: <Text style={styles.statBold}>{totalProjects}</Text>
              </Text>
              <View style={styles.statDivider} />
              <Text style={styles.statPurple}>Active: {activeProjects}</Text>
              <View style={styles.statDivider} />
              <Text style={styles.statPurple}>Inactive: {inactiveProjects}</Text>
            </View>

            {/* ── Client detail card ─────────────────────────── */}
            <View style={styles.clientCard}>
              <View style={styles.clientInner}>
                {/* Header row – tap to expand / collapse */}
                <TouchableOpacity
                  style={styles.clientHeaderRow}
                  onPress={() => setClientExpanded((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clientName}>
                    {client.name || 'Shriram Properties Ltd'}
                  </Text>
                  <Ionicons
                    name={clientExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={COLORS.accent}
                  />
                </TouchableOpacity>

                <Text style={styles.clientSub}>
                  {(client.client_type && client.client_type.toLowerCase() !== 'client'
                    ? client.client_type
                    : 'Residential properties developer')} |{' '}
                  {client.location || 'Bangalore'}
                </Text>

                {clientExpanded && (
                  <View>
                    {/* Status */}
                    <View style={styles.statusRow}>
                      <Text style={styles.fieldLabel}>Status:</Text>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    </View>

                    {/* Address */}
                    <Text style={styles.fieldLabel}>Address:</Text>
                    <Text style={styles.fieldValue}>
                      {client.address || '17/1, Campbell Road, Bangalore – 560 047'}
                    </Text>

                    {/* Mobile & Email */}
                    <View style={styles.twoCol}>
                      <View style={styles.col}>
                        <Text style={styles.fieldLabel}>Mobile:</Text>
                        <Text style={styles.fieldValue}>
                          {client.phone || '+91 98868 51817'}
                        </Text>
                      </View>
                      <View style={styles.col}>
                        <Text style={styles.fieldLabel}>Email:</Text>
                        <Text style={styles.fieldValue}>
                          {client.email || 'sales@shriramprop.in'}
                        </Text>
                      </View>
                    </View>

                    {/* Onboard date & projects count */}
                    <View style={styles.twoCol}>
                      <View style={styles.col}>
                        <Text style={styles.fieldLabel}>Onboard Date:</Text>
                        <Text style={styles.fieldValue}>
                          {client.onboard_date
                            ? formatDate(client.onboard_date)
                            : '12 May 2020'}
                        </Text>
                      </View>
                      <View style={styles.col}>
                        <Text style={styles.fieldLabel}>Number of Projects:</Text>
                        <Text style={styles.fieldValue}>{projectSource.length}</Text>
                      </View>
                    </View>

                  </View>
                )}
              </View>
            </View>

            {/* Section title */}
            <Text style={styles.sectionTitle}>Projects</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="folder-open-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No projects found</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ─ Layout ─
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ─ Header ─
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // ─ Search ─
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    padding: 0,
  },

  // ─ Stats row ─
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  statBold: {
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  statPurple: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.accent,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 10,
  },

  // ─ Client card ─
  clientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  clientInner: {
    padding: 16,
  },
  clientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  clientSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.semibold,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#AAAAAA',
    marginTop: 8,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#444444',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  col: {
    flex: 1,
  },
  clientActionRow: {
    marginTop: 12,
  },
  clientMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#877ED2',
    width: 86,
    height: 30,
    borderRadius: 25,
    paddingTop: 5,
    paddingRight: 15,
    paddingBottom: 5,
    paddingLeft: 15,
    gap: 5,
    justifyContent: 'center',
  },
  clientMoreButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FONTS.semibold,
    fontWeight: '600',
  },

  // ─ Section title ─
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 14,
  },

  // ─ Project card ─
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 14,
    paddingTop: 22,
    position: 'relative',
  },

  // Badge
  badge: {
    position: 'absolute',
    top: -6,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 0,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: FONTS.semibold,
    fontWeight: '600',
  },

  // Location
  projectLocation: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#8F8F8F',
    marginBottom: 2,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },

  // Avatars
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surface,
    backgroundColor: '#E0E0E0',
  },
  plusBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6B6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  dateCol: {
    marginRight: 20,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: '#333333',
  },

  // Progress
  progressWrap: {
    width: 106,
    alignItems: 'flex-end',
    marginTop: 1,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    fontWeight: '600',
    color: '#8F8F8F',
  },
  progressDays: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    fontWeight: '600',
  },
  progressTrack: {
    width: 88,
    height: 4,
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ─ Empty state ─
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 12,
  },
});