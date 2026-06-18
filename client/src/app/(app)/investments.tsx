import React, { useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../../components/primitives';
import { StatCard, InvestmentCard } from '../../components/cards';
import { LineChart } from '../../components/charts';

import { useFinanceStore } from '../../store/financeStore';
import { BrokerConnectPanel } from '../../components/investments/BrokerConnectPanel';
import { PortfolioInsights } from '../../components/investments/PortfolioInsights';

export default function InvestmentsDashboardScreen() {
  const theme = useTheme();

  // Load from store
  const { investments } = useFinanceStore();

  // Computations
  const totalValuePaise = investments.reduce((sum, item) => sum + item.currentValuePaise, 0);
  const totalInvestedPaise = investments.reduce((sum, item) => sum + item.investedValuePaise, 0);
  const totalGainsPaise = totalValuePaise - totalInvestedPaise;
  const gainsPercent = totalInvestedPaise > 0 ? (totalGainsPaise / totalInvestedPaise) * 100 : 0;

  const isPositive = totalGainsPaise >= 0;
  const gainsColor = isPositive ? 'income' : 'expense';
  const trendData = useMemo(() => {
    if (investments.length === 0) return [];
    return [totalInvestedPaise, totalValuePaise];
  }, [investments, totalInvestedPaise, totalValuePaise]);
  const trendLabels = ['Invested', 'Current'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Header Info */}
      <View style={styles.header}>
        <Text variant="h1" style={{ fontWeight: '800' }}>
          Investments
        </Text>
      </View>

      <BrokerConnectPanel />
      <PortfolioInsights />

      {/* Portfolio Quick Summary Banner */}
      <View style={styles.summaryBanner}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View>
            <Text variant="caption" color="secondary" style={styles.bannerLabel}>
              Portfolio Valuation
            </Text>
            <Text variant="h1" style={{ fontWeight: '900', marginTop: 4 }}>
              ₹{Math.abs(totalValuePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={[styles.gainsBadge, { backgroundColor: (isPositive ? theme.colors.income : theme.colors.expense) + '15' }]}>
            <Icon name={isPositive ? 'arrow-up-right' : 'arrow-down-right'} size="sm" color={gainsColor} style={styles.gainsIcon} />
            <Text variant="caption" color={gainsColor} style={{ fontWeight: '700' }}>
              {isPositive ? '+' : ''}{gainsPercent.toFixed(1)}% (₹{Math.abs(totalGainsPaise / 100).toLocaleString('en-IN')})
            </Text>
          </View>
        </View>
      </View>

      {/* Portfolio Scrub Chart */}
      <View style={styles.chartBlock}>
        <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
          Wealth Value Trend (6 Months)
        </Text>
        <LineChart data={trendData} labels={trendLabels} />
      </View>

      {/* Stat Cards Grid — by provider */}
      <View style={styles.statsSection}>
        <View row style={styles.statsRow}>
          <StatCard
            label="Zerodha"
            value={`₹${(investments.filter((i) => i.provider === 'zerodha').reduce((s, i) => s + i.currentValuePaise, 0) / 100).toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 })}`}
            icon="activity"
            iconColor="#0052cc"
          />
          <StatCard
            label="Groww"
            value={`₹${(investments.filter((i) => i.provider === 'groww').reduce((s, i) => s + i.currentValuePaise, 0) / 100).toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 })}`}
            icon="trending-up"
            iconColor="#00d09c"
          />
        </View>
      </View>

      {/* Holdings Section */}
      <View style={styles.sectionHeader}>
        <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
          Asset Holdings Portfolio
        </Text>
      </View>

      <View style={styles.holdingsList}>
        {investments.map((inv) => (
          <InvestmentCard
            key={inv.id}
            id={inv.id}
            provider={inv.provider}
            holdingName={inv.holdingName}
            currentValuePaise={inv.currentValuePaise}
            investedValuePaise={inv.investedValuePaise}
          />
        ))}
      </View>

      {/* Savings goals will be shown once connected to backend goals module */}

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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryBanner: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gainsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gainsIcon: {
    marginRight: 4,
  },
  chartBlock: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  holdingsList: {
    paddingHorizontal: 20,
    gap: 8,
  },
});
