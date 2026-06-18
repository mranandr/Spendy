import React, { useState, forwardRef, useMemo, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetScrollView 
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/tokens';
import { View, Text, Pressable } from '../primitives';
import { Dropdown } from '../inputs';
import { EMPTY_FILTER_STATE, hasActiveFilters, type FilterState } from '../../utils/transactionFilters';

export type { FilterState };
export { EMPTY_FILTER_STATE };

export interface FilterSheetProps {
  categories: { label: string; value: string }[];
  accounts: { label: string; value: string }[];
  initialFilters?: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

export const FilterSheet = forwardRef<BottomSheetModal, FilterSheetProps>(({
  categories,
  accounts,
  initialFilters = EMPTY_FILTER_STATE,
  onApplyFilters,
}, ref) => {
  const theme = useTheme();

  // Local Filter State
  const [types, setTypes] = useState<string[]>(initialFilters.types);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialFilters.categoryIds);
  const [accountIds, setAccountIds] = useState<string[]>(initialFilters.accountIds);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>(initialFilters.dateRange);

  useEffect(() => {
    setTypes(initialFilters.types);
    setCategoryIds(initialFilters.categoryIds);
    setAccountIds(initialFilters.accountIds);
    setDateRange(initialFilters.dateRange);
  }, [initialFilters]);

  const snapPoints = useMemo(() => ['70%', '80%'], []);

  const localFilters: FilterState = { types, categoryIds, accountIds, dateRange };
  const canReset = hasActiveFilters(localFilters);

  const handleToggleType = (type: string) => {
    if (types.includes(type)) {
      setTypes(types.filter(t => t !== type));
    } else {
      setTypes([...types, type]);
    }
  };

  const handleReset = () => {
    if (!canReset) return;
    setTypes([]);
    setCategoryIds([]);
    setAccountIds([]);
    setDateRange('all');
    onApplyFilters(EMPTY_FILTER_STATE);
  };

  const handleApply = () => {
    onApplyFilters({
      types,
      categoryIds,
      accountIds,
      dateRange,
    });
    (ref as any)?.current?.dismiss();
  };

  const dateOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View row center={false} style={styles.header}>
          <Text variant="h2" style={{ fontWeight: '800' }}>
            Filter Transactions
          </Text>
          <TouchableOpacity onPress={handleReset} disabled={!canReset} activeOpacity={canReset ? 0.7 : 1}>
            <Text
              variant="bodySmall"
              color={canReset ? 'accent' : 'secondary'}
              style={{ fontWeight: '700', opacity: canReset ? 1 : 0.45 }}
            >
              Reset All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Type section */}
        <View style={styles.section}>
          <Text variant="bodySmall" color="secondary" style={styles.sectionLabel}>
            Transaction Type
          </Text>
          <View row style={styles.buttonGroup}>
            {['expense', 'income', 'transfer'].map((t) => {
              const isSelected = types.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleToggleType(t)}
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: isSelected ? theme.colors.accent + '20' : theme.colors.card,
                      borderColor: isSelected ? theme.colors.accent : theme.colors.border
                    }
                  ]}
                >
                  <Text 
                    variant="caption" 
                    color={isSelected ? 'accent' : 'secondary'}
                    style={{ fontWeight: '700', textTransform: 'uppercase' }}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date range dropdown */}
        <View style={styles.section}>
          <Dropdown
            label="Date Period"
            options={dateOptions}
            selectedValues={[dateRange]}
            onSelect={(vals) => setDateRange(vals[0] as any)}
          />
        </View>

        {/* Accounts dropdown (Multi-select) */}
        <View style={styles.section}>
          <Dropdown
            label="Filter by Accounts"
            options={accounts}
            selectedValues={accountIds}
            onSelect={setAccountIds}
            multiSelect
            placeholder="Select Accounts..."
          />
        </View>

        {/* Categories dropdown (Multi-select) */}
        <View style={styles.section}>
          <Dropdown
            label="Filter by Categories"
            options={categories}
            selectedValues={categoryIds}
            onSelect={setCategoryIds}
            multiSelect
            placeholder="Select Categories..."
          />
        </View>

        {/* Apply Button */}
        <Pressable
          onPress={handleApply}
          style={[styles.applyButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text variant="body" color="inverse" style={{ fontWeight: '700' }}>
            Apply Filters
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default FilterSheet;
