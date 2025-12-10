import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { AuthContext } from '../../context/AuthContext';
import { dashboardApi, dashboardHelpers, DashboardOverview, ActivityLog, Project } from '../../api/dashboard';
import { getMyOrganization } from '../../api/endpoints';
import Card from '../../components/shared/Card';
import AppHeader from '../../components/shared/AppHeader';
import { formatCurrencyINR } from '../../utils/currency';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  // Admin Dashboard State
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{ name: string; join_code: string; unique_id: string } | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const loadData = async () => {
    try {
      setError(null);
      console.log('Loading admin dashboard data...');
      
      // Load dashboard overview
      console.log('Fetching overview data...');
      const overviewData = await dashboardApi.getOverview();
      console.log('Overview data received:', overviewData);
      setOverview(overviewData.overview);
      setRecentActivity(overviewData.recentActivity || []);
      
      // Load projects for Gantt chart
      console.log('Fetching projects data...');
      const projectsData = await dashboardApi.getProjects({ limit: 50 });
      console.log('Projects data received:', projectsData);
      setProjects(projectsData.projects || []);
      
      // Load organization data for QR code
      try {
        const orgData = await getMyOrganization();
        setOrganization(orgData.organization);
      } catch (orgError) {
        console.error('Error loading organization:', orgError);
        // Don't fail the whole dashboard if org loading fails
      }
      
      console.log('Admin dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', (error as any)?.response?.data || (error as Error)?.message);
      setOverview(null);
      setRecentActivity([]);
      setProjects([]);
      setError('Failed to load dashboard data. Pull to refresh.');
    }
  };

  useEffect(() => {
    loadData().finally(() => {
      setLoading(false);
      setOrgLoading(false);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const StatCard = ({ title, value, subtitle, color = '#007AFF', onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AppHeader
        showLanguageSwitcher={true}
        rightAction={{
          title: '👤',
          onPress: () => navigation.navigate('Profile')
        }}
      />
      
      <View style={styles.screenContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('common.welcome')}, {user?.name || 'Admin'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        {/* Key Metrics - Side by Side */}
        <View style={styles.metricsRow}>
          <StatCard
            title={t('dashboard.active_projects')}
            value={overview?.totalActiveProjects || 0}
            subtitle={t('dashboard.currently_running')}
            color="#34C759"
            onPress={() => navigation.navigate('Projects')}
          />
          <StatCard
            title={t('dashboard.total_clients')}
            value={overview?.totalClients || 0}
            subtitle={`${overview?.activeClients || 0} ${t('dashboard.active')}`}
            color="#007AFF"
            onPress={() => navigation.navigate('Clients')}
          />
        </View>

        {/* Organization QR Code Section */}
        {organization && (
          <Card style={styles.qrCard}>
            <Text style={styles.qrTitle}>{t('organization.employee_registration_qr')}</Text>
            <Text style={styles.qrSubtitle}>{t('organization.share_qr_code')}</Text>
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode 
                  value={organization.join_code} 
                  size={200} 
                  backgroundColor="#fff" 
                  color="#111" 
                />
              </View>
              <Text style={styles.qrCodeText}>{t('organization.join_code')}: {organization.join_code}</Text>
              <Text style={styles.qrNote}>{t('organization.employees_can_scan')}</Text>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  screenContent: {
    flex: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Admin Dashboard Styles
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  projectStatusSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  qrCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    width: '100%',
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  qrNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
