import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';

export interface DatePickerProps {
  label: string;
  date: Date;
  onDateChange: (date: Date) => void;
  error?: string;
  style?: ViewStyle;
}

export const DatePicker: React.FC<DatePickerProps> = React.memo(({
  label,
  date,
  onDateChange,
  error,
  style,
}) => {
  const theme = useTheme();
  const [isPickerVisible, setPickerVisibility] = useState(false);

  const showDatePicker = () => {
    setPickerVisibility(true);
  };

  const hideDatePicker = () => {
    setPickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    onDateChange(selectedDate);
    hideDatePicker();
  };

  // Format date for display in India style (e.g., "20 May 2026")
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={showDatePicker}
        style={[
          styles.pickerWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.expense : theme.colors.border,
          },
          style,
        ]}
      >
        {/* Label */}
        <View style={[styles.labelContainer, { backgroundColor: theme.colors.surface }]}>
          <Text
            variant="caption"
            style={{
              color: error ? theme.colors.expense : theme.colors.text.secondary,
              fontWeight: '500',
            }}
          >
            {label}
          </Text>
        </View>

        {/* Date Display */}
        <View row center={false} style={styles.contentRow}>
          <Icon name="calendar" size="md" color="secondary" style={styles.leftIcon} />
          <Text variant="body" style={styles.dateText}>
            {formattedDate}
          </Text>
          <Icon name="chevron-down" size="sm" color="secondary" style={styles.rightIcon} />
        </View>
      </TouchableOpacity>

      {error && (
        <Text variant="caption" color="expense" style={styles.errorText}>
          {error}
        </Text>
      )}

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="date"
        date={date}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        themeVariant={theme.dark ? 'dark' : 'light'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  pickerWrapper: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    left: 10,
    top: -10,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  dateText: {
    fontWeight: '500',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 6,
  },
});

export default DatePicker;
