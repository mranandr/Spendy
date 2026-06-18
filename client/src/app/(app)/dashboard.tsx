import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { View, Text, Icon, Pressable, Gradient } from '../../components/primitives';
import { StatCard, AccountCard, TransactionCard } from '../../components/cards';
import { BarChart, HeatmapCalendar } from '../../components/charts';
import { AddTransactionSheet, FilterSheet, TransactionDetailSheet, FilterState, EMPTY_FILTER_STATE } from '../../components/sheets';

import { useFinanceStore } from '../../store/financeStore';
import { buildTransactionPayload } from '../../utils/buildTransaction';
import { filterTransactions, FILTER_CATEGORY_OPTIONS, hasActiveFilters } from '../../utils/transactionFilters';

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const windowWidth = Dimensions.get('window').width;

  // Global Zustand Stores state
  const { accounts, transactions, addTransaction, deleteTransaction } = useFinanceStore();
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [addSheetType, setAddSheetType] = useState<'income' | 'expense' | 'transfer'>('expense');

  // Bottom Sheet Refs
  const addTxSheetRef = useRef<BottomSheetModal>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const txDetailSheetRef = useRef<BottomSheetModal>(null);

  // Computed Values
  const totalWealthPaise = accounts.reduce((sum, acc) => sum + acc.balancePaise, 0);
  const totalAssetsPaise = accounts
    .filter((acc) => acc.balancePaise > 0)
    .reduce((sum, acc) => sum + acc.balancePaise, 0);
  const totalLiabilitiesPaise = Math.abs(
    accounts.filter((acc) => acc.balancePaise < 0).reduce((sum, acc) => sum + acc.balancePaise, 0)
  );
  const now = new Date();
  const monthlyIncomePaise = transactions
    .filter((tx) => {
      const date = new Date(tx.date);
      return tx.type === 'income' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amountPaise, 0);
  const monthlyExpensePaise = transactions
    .filter((tx) => {
      const date = new Date(tx.date);
      return tx.type === 'expense' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amountPaise, 0);
  const monthlyComparison = useMemo(() => {
    const list = Array.from({ length: 5 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (4 - idx));
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const income = transactions
        .filter((tx) => {
          const txDate = new Date(tx.date);
          return tx.type === 'income' && txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, tx) => sum + tx.amountPaise, 0);
      const expense = transactions
        .filter((tx) => {
          const txDate = new Date(tx.date);
          return tx.type === 'expense' && txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, tx) => sum + tx.amountPaise, 0);
      return { label, income, expense };
    });
    return list;
  }, [transactions]);
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const date = new Date(tx.date);
        const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        map.set(key, (map.get(key) ?? 0) + tx.amountPaise);
      });
    return Array.from(map.entries()).map(([date, amountPaise]) => ({ date, amountPaise }));
  }, [transactions]);
  const userDisplayName = user?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'User');
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  })();

  const filteredRecentTransactions = useMemo(() => {
    return filterTransactions(transactions, activeFilters, accounts).slice(0, 3);
  }, [transactions, activeFilters, accounts]);

  const filtersActive = hasActiveFilters(activeFilters);

  const handleAddTransaction = (newTx: Parameters<typeof buildTransactionPayload>[0]) => {
    try {
      addTransaction(buildTransactionPayload(newTx, accounts));
    } catch (err: unknown) {
      console.warn(err instanceof Error ? err.message : 'Failed to add transaction');
    }
  };

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
  };

  const openAddSheet = (type: 'income' | 'expense' | 'transfer') => {
    setAddSheetType(type);
    addTxSheetRef.current?.present();
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    txDetailSheetRef.current?.dismiss();
  };

  const handlePressTransaction = (tx: any) => {
    setSelectedTx(tx);
    txDetailSheetRef.current?.present();
  };

  return (
    <BottomSheetModalProvider>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        {/* Header Block */}
        <View row center={false} style={styles.header}>
          <View row center={false} style={styles.userInfo}>
            <View center style={[styles.avatarBorder, { borderColor: theme.colors.border }]}>
              <Text variant="bodySmall" style={{ fontWeight: '800' }}>{userInitials || 'U'}</Text>
            </View>
            <View>
              <Text variant="caption" color="secondary" style={{ fontWeight: '600' }}>
                {greeting}
              </Text>
              <Text variant="body" style={{ fontWeight: '800', marginTop: 1 }}>
                {userDisplayName}
              </Text>
            </View>
          </View>

          {/* Notifications Trigger */}
          <TouchableOpacity activeOpacity={0.8} style={[styles.notiButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Icon name="bell" size="sm" color="primary" />
            <View style={[styles.notiDot, { backgroundColor: theme.colors.expense }]} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Net Worth Banner */}
        <View style={styles.bannerContainer}>
          <Gradient preset="primary" style={styles.netWorthCard}>
            <Text variant="label" color="inverse" style={styles.bannerLabel}>
              Consolidated Net Worth
            </Text>
            <Text variant="display" color="inverse" style={styles.bannerValue}>
              {totalWealthPaise >= 0 ? '' : '-'}{theme.colors.accent === 'green' ? '' : '₹'}
              {Math.abs(totalWealthPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View row center={false} style={styles.bannerFooter}>
              <View row style={styles.bulletItem}>
                <View style={styles.bulletGreen} />
                <Text variant="caption" color="inverse" style={{ fontWeight: '600', fontSize: 11 }}>
                  Assets: ₹{(totalAssetsPaise / 100).toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 })}
                </Text>
              </View>
              <View row style={styles.bulletItem}>
                <View style={styles.bulletRed} />
                <Text variant="caption" color="inverse" style={{ fontWeight: '600', fontSize: 11 }}>
                  Liabilities: ₹{(totalLiabilitiesPaise / 100).toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 })}
                </Text>
              </View>
            </View>
          </Gradient>
        </View>

        {/* Quick Actions Row */}
        <View row style={styles.quickActions}>
          <Pressable 
            onPress={() => openAddSheet('expense')}
            style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Icon name="plus" size="sm" color="accent" />
            <Text variant="caption" style={{ fontWeight: '700', marginTop: 4 }}>Add Tx</Text>
          </Pressable>

          <Pressable 
            onPress={() => filterSheetRef.current?.present()}
            style={[
              styles.actionBtn,
              {
                backgroundColor: filtersActive ? theme.colors.accent + '18' : theme.colors.card,
                borderColor: filtersActive ? theme.colors.accent : theme.colors.border,
              },
            ]}
          >
            <Icon name="sliders" size="sm" color="accent" />
            <Text variant="caption" style={{ fontWeight: '700', marginTop: 4 }}>Filters</Text>
          </Pressable>

          <Pressable 
            onPress={() => openAddSheet('transfer')}
            style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Icon name="arrow-right-left" size="sm" color="accent" />
            <Text variant="caption" style={{ fontWeight: '700', marginTop: 4 }}>Transfer</Text>
          </Pressable>
        </View>

        {/* Accounts Horizontal Carousel */}
        <View style={styles.sectionHeader}>
          <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
            My Portfolios & Accounts
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.accountsScroll}
          snapToInterval={windowWidth - 60}
          decelerationRate="fast"
        >
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              id={acc.id}
              name={acc.name}
              type={acc.type}
              bankName={acc.bankName}
              balancePaise={acc.balancePaise}
              style={{ width: windowWidth - 64, marginRight: 16 }}
            />
          ))}
        </ScrollView>

        {/* Statistics Block */}
        <View style={styles.statsSection}>
          <View row style={styles.statsRow}>
            <StatCard
              label="Monthly Income"
              value={`₹${(monthlyIncomePaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon="arrow-up"
              iconColor={theme.colors.income}
              delta={0}
            />
            <StatCard
              label="Monthly Spent"
              value={`₹${(monthlyExpensePaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon="arrow-down"
              iconColor={theme.colors.expense}
              delta={0}
            />
          </View>
        </View>

        {/* Comparative grow bar chart */}
        <View style={styles.chartBlock}>
          <Text variant="bodySmall" color="secondary" style={styles.chartTitle}>
            Cashflow Comparison (5 Months)
          </Text>
          <BarChart data={monthlyComparison} mode="grouped" />
        </View>

        {/* Contribution Spends Heatmap */}
        <View style={styles.heatmapBlock}>
          <HeatmapCalendar data={heatmapData} />
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeader}>
          <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
            Recent Transactions
          </Text>
          <TouchableOpacity>
            <Text variant="caption" color="accent" style={{ fontWeight: '700' }}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txListContainer}>
          {filteredRecentTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              id={tx.id}
              title={tx.title}
              date={tx.date}
              amountPaise={tx.amountPaise}
              type={tx.type}
              categoryIcon={tx.categoryIcon}
              categoryColor={tx.categoryColor}
              accountName={tx.accountName}
              toAccountName={tx.toAccountName}
              onDelete={() => handleDeleteTransaction(tx.id)}
              onPress={() => handlePressTransaction(tx)}
            />
          ))}
        </View>

        {/* Bottom space padding */}
        <View style={{ height: 100 }} />

        {/* Add Transaction Bottom Sheet */}
        <AddTransactionSheet
          ref={addTxSheetRef}
          initialType={addSheetType}
          accounts={accounts.map(a => ({ label: a.name, value: a.id }))}
          onSave={handleAddTransaction}
        />

        {/* Filter Bottom Sheet */}
        <FilterSheet
          ref={filterSheetRef}
          accounts={accounts.map(a => ({ label: a.name, value: a.id }))}
          categories={FILTER_CATEGORY_OPTIONS}
          initialFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Transaction Detail Sheet */}
        <TransactionDetailSheet
          ref={txDetailSheetRef}
          transaction={selectedTx}
          onEdit={(id) => console.log('Edit Transaction:', id)}
          onDelete={handleDeleteTransaction}
        />

      </ScrollView>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notiButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notiDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  netWorthCard: {
    height: 140,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  bannerValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bannerFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  bulletRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  accountsScroll: {
    paddingLeft: 20,
    paddingRight: 4,
    marginBottom: 20,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  chartBlock: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  heatmapBlock: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  txListContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
});
