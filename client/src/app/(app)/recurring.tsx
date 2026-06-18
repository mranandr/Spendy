import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../../components/primitives';
import { ScheduledPaymentCard } from '../../components/cards';
import { getDaysRemaining } from '../../utils/date';

import { useFinanceStore } from '../../store/financeStore';

export default function ScheduledPaymentsScreen() {
  const theme = useTheme();

  // Load from store
  const { scheduledPayments: payments, toggleScheduledPayment } = useFinanceStore();

  const handleToggleActive = (id: string, nextActiveState: boolean) => {
    toggleScheduledPayment(id, nextActiveState);
  };

  // Group by Urgency
  const urgentPayments = useMemo(() => {
    return payments.filter(p => {
      const days = getDaysRemaining(p.nextDueDate);
      return days <= 3 && p.isActive;
    });
  }, [payments]);

  const regularPayments = useMemo(() => {
    return payments.filter(p => {
      const days = getDaysRemaining(p.nextDueDate);
      return days > 3 || !p.isActive;
    });
  }, [payments]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Header Info */}
      <View row center={false} style={styles.header}>
        <View>
          <Text variant="h1" style={{ fontWeight: '800' }}>
            Recurring Bills
          </Text>
          <Text variant="caption" color="secondary" style={{ marginTop: 2, fontWeight: '600' }}>
            {payments.filter(p => p.isActive).length} Active Scheduled Autopays
          </Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.floatingAddTrigger, { backgroundColor: theme.colors.accent }]}
        >
          <Icon name="plus" size="md" color="inverse" />
        </TouchableOpacity>
      </View>

      {/* Urgent Section */}
      {urgentPayments.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text variant="bodySmall" color="expense" style={styles.sectionTitle}>
            Action Required: Due Within 3 Days!
          </Text>
          <View style={styles.listBlock}>
            {urgentPayments.map((p) => (
              <ScheduledPaymentCard
                key={p.id}
                id={p.id}
                name={p.name}
                amountPaise={p.amountPaise}
                frequency={p.frequency}
                nextDueDate={p.nextDueDate}
                isActive={p.isActive}
                onToggleActive={(state) => handleToggleActive(p.id, state)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Regular / Paused Section */}
      <View style={styles.sectionContainer}>
        <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
          Upcoming Autopays & Subscriptions
        </Text>
        
        {regularPayments.length === 0 && urgentPayments.length === 0 ? (
          <View center padding="xl" style={styles.emptyContainer}>
            <Icon name="calendar" size="xl" color="secondary" style={{ opacity: 0.4, marginBottom: 12 }} />
            <Text variant="bodySmall" color="secondary">
              No scheduled autopays found
            </Text>
          </View>
        ) : (
          <View style={styles.listBlock}>
            {regularPayments.map((p) => (
              <ScheduledPaymentCard
                key={p.id}
                id={p.id}
                name={p.name}
                amountPaise={p.amountPaise}
                frequency={p.frequency}
                nextDueDate={p.nextDueDate}
                isActive={p.isActive}
                onToggleActive={(state) => handleToggleActive(p.id, state)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  floatingAddTrigger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
    marginBottom: 12,
    paddingLeft: 4,
  },
  listBlock: {
    gap: 8,
  },
  emptyContainer: {
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
