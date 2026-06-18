import React, { useRef } from 'react';
import { 
  StyleSheet, 
  TextInput as RNTextInput, 
  TouchableOpacity, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/tokens';
import { View, Text } from '../primitives';
import { formatINR } from '../../utils/currency';

export interface AmountInputProps {
  valuePaise: number; // Stored as integer in paise (₹1 = 100 paise)
  onChangePaise: (value: number) => void;
  color?: 'accent' | 'income' | 'expense' | string;
  style?: ViewStyle;
}

export const AmountInput: React.FC<AmountInputProps> = React.memo(({
  valuePaise,
  onChangePaise,
  color = 'accent',
  style,
}) => {
  const theme = useTheme();
  const inputRef = useRef<RNTextInput>(null);

  // Convert paise to rupee string for parsing/editing
  // e.g. 12345 paise -> "123.45"
  const getRawString = (paise: number) => {
    if (paise === 0) return '';
    return paise.toString();
  };

  const handleTextChange = (text: string) => {
    // Keep only digits
    const cleanText = text.replace(/[^0-9]/g, '');
    
    if (cleanText === '') {
      onChangePaise(0);
      return;
    }

    const newValuePaise = parseInt(cleanText, 10);
    
    // Check if crossing significant milestones for special haptic feedback
    // e.g. crossing 100000 paise (₹1,000), 1000000 paise (₹10,000), etc.
    const milestones = [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
    const crossedMilestone = milestones.some(
      m => valuePaise < m && newValuePaise >= m
    );

    if (crossedMilestone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onChangePaise(newValuePaise);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Format currency for display: e.g. 12345 paise -> ₹123.45
  const formattedDisplay = formatINR(valuePaise);

  let textColor = theme.colors.accent;
  if (color === 'income') textColor = theme.colors.income;
  else if (color === 'expense') textColor = theme.colors.expense;
  else if (color) textColor = color;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={focusInput} 
      style={[styles.container, style]}
    >
      <View center padding="sm">
        {/* Hidden TextInput to capture keyboard inputs */}
        <RNTextInput
          ref={inputRef}
          keyboardType="number-pad"
          value={getRawString(valuePaise)}
          onChangeText={handleTextChange}
          style={styles.hiddenInput}
          caretHidden
        />

        {/* Beautiful large text display */}
        <View row center gap="xs">
          <Text 
            variant="display" 
            style={[styles.amountText, { color: textColor }]}
          >
            {formattedDisplay}
          </Text>
        </View>

        <Text variant="caption" color="secondary" style={styles.helperText}>
          Tap to edit amount
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  amountText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  helperText: {
    marginTop: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 10,
    opacity: 0.6,
  },
});

export default AmountInput;
