import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/tokens';
import { View, Text } from '../primitives';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export interface HeatmapDay {
  date: Date | string | number;
  amountPaise: number; // paise
}

export interface HeatmapCalendarProps {
  data: HeatmapDay[];
  style?: StyleProp<ViewStyle>;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = React.memo(({
  data,
  style,
}) => {
  const theme = useTheme();
  const [selectedCell, setSelectedCell] = useState<{ date: Date; amountPaise: number } | null>(null);

  // We show 15 weeks (about 3.5 months) of daily records
  const weeksToDisplay = 14;
  const daysInGrid = weeksToDisplay * 7;

  // Generate grid dates ending today
  const gridCells = Array.from({ length: daysInGrid }).map((_, index) => {
    const d = new Date();
    // Shift backward by index (index 0 is daysInGrid-1 days ago, last index is today)
    d.setDate(d.getDate() - (daysInGrid - 1 - index));
    d.setHours(0, 0, 0, 0);
    
    // Find matching spend amount
    const match = data.find((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === d.getTime();
    });

    return {
      date: d,
      amountPaise: match ? match.amountPaise : 0,
    };
  });

  const handleCellPress = (cell: { date: Date; amountPaise: number }) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    
    if (selectedCell && selectedCell.date.getTime() === cell.date.getTime()) {
      setSelectedCell(null);
    } else {
      setSelectedCell(cell);
    }
  };

  // Determine cell color based on spend amount
  const getCellColor = (amountPaise: number) => {
    if (amountPaise === 0) return theme.colors.card; // Background gray surface
    
    const rupees = amountPaise / 100;
    
    // Intensity buckets based on typical Indian middle-class daily spends
    if (rupees < 300) return theme.colors.accent + '25'; // light glow
    if (rupees < 1000) return theme.colors.accent + '55'; // medium glow
    if (rupees < 3000) return theme.colors.accent + '85'; // bright glow
    return theme.colors.accent; // solid accent (heavy spend day)
  };

  // Chunk gridCells into 7-day rows (Sunday to Saturday)
  const rows: typeof gridCells[] = Array.from({ length: 7 }).map((_, rowIndex) => {
    return Array.from({ length: weeksToDisplay }).map((_, colIndex) => {
      return gridCells[colIndex * 7 + rowIndex];
    });
  });

  const dayLabels = ['Mon', 'Wed', 'Fri', 'Sun'];

  return (
    <View style={[styles.container, style]}>
      <Text variant="caption" color="secondary" style={styles.title}>
        Daily Spend Heatmap
      </Text>

      {/* Selected cell tooltip */}
      <View style={styles.tooltipArea}>
        {selectedCell ? (
          <View row center style={[styles.tooltip, { backgroundColor: theme.colors.card }]}>
            <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
              {formatDate(selectedCell.date)}: 
            </Text>
            <Text variant="caption" color="accent" style={{ fontWeight: '800', marginLeft: 4 }}>
              {formatINR(selectedCell.amountPaise)}
            </Text>
          </View>
        ) : (
          <Text variant="label" color="secondary" style={styles.placeholderText}>
            Tap a square to see daily spent
          </Text>
        )}
      </View>

      {/* Heatmap Grid Row & Column layout */}
      <View row center={false} style={styles.gridContainer}>
        {/* Day of Week Labels */}
        <View style={styles.dayLabelsColumn}>
          {dayLabels.map((label, idx) => (
            <Text key={idx} variant="label" color="secondary" style={styles.dayLabelText}>
              {label}
            </Text>
          ))}
        </View>

        {/* Heatmap Blocks */}
        <View style={styles.blocksContainer}>
          {rows.map((rowCells, rowIndex) => (
            <View key={rowIndex} row center={false} style={styles.row}>
              {rowCells.map((cell, colIndex) => {
                const isSelected = selectedCell && selectedCell.date.getTime() === cell.date.getTime();
                
                return (
                  <TouchableOpacity
                    key={colIndex}
                    activeOpacity={0.8}
                    onPress={() => handleCellPress(cell)}
                    style={[
                      styles.cell,
                      { 
                        backgroundColor: getCellColor(cell.amountPaise),
                        borderColor: isSelected ? theme.colors.text.primary : 'transparent',
                        borderWidth: isSelected ? 1 : 0,
                      }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Spend Intensity Key */}
      <View row center style={styles.keyContainer}>
        <Text variant="label" color="secondary" style={{ marginRight: 6 }}>
          Less
        </Text>
        <View style={[styles.keyCell, { backgroundColor: theme.colors.card }]} />
        <View style={[styles.keyCell, { backgroundColor: theme.colors.accent + '25' }]} />
        <View style={[styles.keyCell, { backgroundColor: theme.colors.accent + '55' }]} />
        <View style={[styles.keyCell, { backgroundColor: theme.colors.accent + '85' }]} />
        <View style={[styles.keyCell, { backgroundColor: theme.colors.accent }]} />
        <Text variant="label" color="secondary" style={{ marginLeft: 6 }}>
          More
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
  },
  tooltipArea: {
    height: 32,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  tooltip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#49496030',
    alignSelf: 'flex-start',
  },
  placeholderText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dayLabelsColumn: {
    width: 28,
    height: 108,
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginRight: 6,
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'right',
  },
  blocksContainer: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2.5,
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-end',
    paddingRight: 8,
  },
  keyCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});

export default HeatmapCalendar;
