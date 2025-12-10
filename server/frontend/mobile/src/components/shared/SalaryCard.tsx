import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import StatusBadge from './StatusBadge';
import { Salary } from '../../api/salaries';

interface SalaryCardProps {
  salary: Salary;
  showEmployeeInfo?: boolean;
  onPress?: () => void;
}

export const SalaryCard: React.FC<SalaryCardProps> = ({
  salary,
  showEmployeeInfo = false,
  onPress,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSalaryTypeColor = (type: string) => {
    switch (type) {
      case 'monthly':
        return '#4CAF50';
      case 'daily':
        return '#FF9800';
      case 'hourly':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {showEmployeeInfo && (
            <Text style={styles.employeeName}>
              {salary.first_name} {salary.last_name}
            </Text>
          )}
          <Text style={styles.amount}>{formatCurrency(salary.salary_amount)}</Text>
        </View>
        <View style={styles.badgesContainer}>
          <StatusBadge
            status={salary.salary_type}
            color={getSalaryTypeColor(salary.salary_type)}
          />
          {salary.is_current && (
            <StatusBadge status="Current" color="#4CAF50" />
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Effective Date:</Text>
          <Text style={styles.value}>{formatDate(salary.effective_date)}</Text>
        </View>

        {salary.end_date && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{formatDate(salary.end_date)}</Text>
          </View>
        )}

        {salary.hourly_rate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hourly Rate:</Text>
            <Text style={styles.value}>{formatCurrency(salary.hourly_rate)}</Text>
          </View>
        )}

        {showEmployeeInfo && salary.department && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.value}>{salary.department}</Text>
          </View>
        )}

        {salary.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notes}>{salary.notes}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
