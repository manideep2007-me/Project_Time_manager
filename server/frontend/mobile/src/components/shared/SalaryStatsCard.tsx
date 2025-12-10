import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from './Card';
import { SalaryStats } from '../../api/salaries';

interface SalaryStatsCardProps {
  stats: SalaryStats;
}

export const SalaryStatsCard: React.FC<SalaryStatsCardProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const { overall_stats, department_stats } = stats;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Overall Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overall_stats.total_salaries}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overall_stats.employees_with_salaries}</Text>
              <Text style={styles.statLabel}>Employees</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overall_stats.current_salaries}</Text>
              <Text style={styles.statLabel}>Current</Text>
            </View>
          </View>
          <View style={styles.salaryRange}>
            <Text style={styles.rangeLabel}>Salary Range</Text>
            <Text style={styles.rangeValue}>
              {formatCurrency(overall_stats.min_salary)} - {formatCurrency(overall_stats.max_salary)}
            </Text>
            <Text style={styles.averageLabel}>
              Average: {formatCurrency(overall_stats.average_salary)}
            </Text>
          </View>
        </Card>

        {/* Department Stats */}
        {department_stats.map((dept, index) => (
          <Card key={index} style={styles.statsCard}>
            <Text style={styles.cardTitle}>{dept.department}</Text>
            <View style={styles.deptStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dept.salary_count}</Text>
                <Text style={styles.statLabel}>Records</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(dept.avg_salary)}</Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
            </View>
            <View style={styles.salaryRange}>
              <Text style={styles.rangeLabel}>Range</Text>
              <Text style={styles.rangeValue}>
                {formatCurrency(dept.min_salary)} - {formatCurrency(dept.max_salary)}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statsCard: {
    minWidth: 200,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  deptStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  salaryRange: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rangeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  averageLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '500',
  },
});
