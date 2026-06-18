import React, { useRef, useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon, Pressable } from '../../components/primitives';
import { TransactionCard } from '../../components/cards';
import { SearchInput } from '../../components/inputs';
import { AddTransactionSheet, FilterSheet, TransactionDetailSheet, FilterState, EMPTY_FILTER_STATE } from '../../components/sheets';
import { formatDate } from '../../utils/date';
import { buildTransactionPayload } from '../../utils/buildTransaction';
import { filterTransactions, FILTER_CATEGORY_OPTIONS, hasActiveFilters } from '../../utils/transactionFilters';

import { useFinanceStore } from '../../store/financeStore';

export default function TransactionsScreen() {
  const theme = useTheme();

  // Global Zustand finance state
  const { accounts, transactions, addTransaction, deleteTransaction } = useFinanceStore();

  const accountOptions = useMemo(() => {
    return accounts.map(a => ({ label: a.name, value: a.id }));
  }, [accounts]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Sheets Refs
  const addTxSheetRef = useRef<BottomSheetModal>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const txDetailSheetRef = useRef<BottomSheetModal>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    txDetailSheetRef.current?.dismiss();
  };

  const handlePressTransaction = (tx: any) => {
    setSelectedTx(tx);
    txDetailSheetRef.current?.present();
  };

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, activeFilters, accounts, searchQuery);
  }, [transactions, activeFilters, accounts, searchQuery]);

  const filtersActive = hasActiveFilters(activeFilters);

  // Group by Date for cleaner sections
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};
    
    filteredTransactions.forEach(tx => {
      const dateStr = formatDate(tx.date);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });

    return Object.keys(groups).map(date => ({
      date,
      data: groups[date],
    }));
  }, [filteredTransactions]);

  return (
    <BottomSheetModalProvider>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        {/* Header Title */}
        <View row center={false} style={styles.header}>
          <Text variant="h1" style={{ fontWeight: '800' }}>
            Transactions
          </Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => addTxSheetRef.current?.present()}
            style={[styles.floatingAddTrigger, { backgroundColor: theme.colors.accent }]}
          >
            <Icon name="plus" size="md" color="inverse" />
          </TouchableOpacity>
        </View>

        {/* Search and Filters Header */}
        <View row center style={styles.searchRow}>
          <SearchInput 
            placeholder="Search merchants, labels..." 
            onSearch={handleSearch} 
            style={{ flex: 1 }}
          />
          <TouchableOpacity 
            onPress={() => filterSheetRef.current?.present()}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filtersActive ? theme.colors.accent + '18' : theme.colors.card,
                borderColor: filtersActive ? theme.colors.accent : theme.colors.border,
              },
            ]}
          >
            <Icon name="sliders" size="md" color={filtersActive ? 'accent' : 'secondary'} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Grouped Transactions List */}
        {groupedTransactions.length === 0 ? (
          <View center padding="xl" style={styles.emptyContainer}>
            <Icon name="file-text" size="xl" color="secondary" style={{ opacity: 0.4, marginBottom: 12 }} />
            <Text variant="bodySmall" color="secondary">
              No matching transactions found
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupedTransactions}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.sectionContainer}>
                {/* Date Header Section */}
                <Text variant="label" color="secondary" style={styles.sectionHeader}>
                  {item.date.toUpperCase()}
                </Text>
                
                {/* Cards Inside Date Section */}
                <View style={styles.cardsBlock}>
                  {item.data.map((tx) => (
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
              </View>
            )}
          />
        )}

        {/* Add Transaction Sheet */}
        <AddTransactionSheet
          ref={addTxSheetRef}
          accounts={accountOptions}
          onSave={handleAddTransaction}
        />

        {/* Filters Sheet */}
        <FilterSheet
          ref={filterSheetRef}
          accounts={accountOptions}
          categories={FILTER_CATEGORY_OPTIONS}
          initialFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Transaction Detail Sheet */}
        <TransactionDetailSheet
          ref={txDetailSheetRef}
          transaction={selectedTx}
          onEdit={(id) => console.log('Edit transaction:', id)}
          onDelete={handleDeleteTransaction}
        />

      </View>
    </BottomSheetModalProvider>
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
    marginBottom: 16,
  },
  floatingAddTrigger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 9,
    marginBottom: 8,
    paddingLeft: 4,
  },
  cardsBlock: {
    gap: 8,
  },
});
