import React, { useState, useRef, useEffect } from 'react';
import { 
  TextInput as RNTextInput, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  NativeSyntheticEvent, 
  TextInputFocusEventData, 
  TextInputProps as RNTextInputProps,
  StyleProp
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon } from '../primitives';

export interface TextInputProps extends Omit<RNTextInputProps, 'onChange'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  disabled?: boolean;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  style?: StyleProp<TextStyle>;
  floatingLabel?: boolean;
}

export const TextInput: React.FC<TextInputProps> = React.memo(({
  label,
  value,
  onChangeText,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  keyboardType,
  disabled = false,
  onFocus,
  onBlur,
  style,
  floatingLabel = true,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  // Floating label reanimated value
  const floatAnim = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    if (!floatingLabel) return;
    floatAnim.value = withTiming(isFocused || value ? 1 : 0, { duration: 200 });
  }, [floatingLabel, isFocused, value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };


  // Reanimated style for the floating label
  const labelAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [16, -10], Extrapolation.CLAMP);
    const scale = interpolate(floatAnim.value, [0, 1], [1, 0.85], Extrapolation.CLAMP);
    const translateX = interpolate(floatAnim.value, [0, 1], [leftIcon ? 36 : 12, 10], Extrapolation.CLAMP);

    return {
      transform: [
        { translateY },
        { scale },
        { translateX }
      ],
    };
  });

  // Borders & Backgrounds
  let borderColor = theme.colors.border;
  let backgroundColor = theme.colors.surface;

  if (isFocused) {
    borderColor = theme.colors.accent;
  } else if (error) {
    borderColor = theme.colors.expense;
  }

  return (
    <View style={styles.container}>
      {!floatingLabel ? (
        <Text variant="caption" color="secondary" style={styles.staticLabel}>
          {label}
        </Text>
      ) : null}
      <View 
        style={[
          styles.inputWrapper, 
          { 
            borderColor, 
            backgroundColor,
            opacity: disabled ? 0.6 : 1 
          }
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.iconLeft}>
            <Icon name={leftIcon} size="md" color={isFocused ? 'accent' : 'secondary'} />
          </View>
        )}

        {/* Floating Label */}
        {floatingLabel ? (
          <Animated.View style={[styles.labelContainer, labelAnimatedStyle]}>
            <Text 
              style={[
                styles.labelText, 
                { 
                  color: error 
                    ? theme.colors.expense 
                    : isFocused 
                      ? theme.colors.accent 
                      : theme.colors.text.secondary,
                  backgroundColor: theme.colors.surface,
                  paddingHorizontal: 4
                }
              ]}
            >
              {label}
            </Text>
          </Animated.View>
        ) : null}

        {/* Text Input */}
        <RNTextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!disabled}
          placeholder={floatingLabel ? '' : props.placeholder}
          placeholderTextColor={theme.colors.text.secondary}
          style={[
            styles.input,
            { 
              color: theme.colors.text.primary,
              paddingLeft: leftIcon ? 40 : 12,
              paddingRight: rightIcon ? 40 : 12,
            },
            style
          ]}
          {...props}
        />

        {/* Right Icon / Eye Toggle */}
        {rightIcon && (
          <View style={styles.iconRight}>
            <Icon 
              name={rightIcon} 
              size="md" 
              color={error ? 'expense' : 'secondary'} 
              style={onRightIconPress ? undefined : styles.nonPressableIcon}
            />
          </View>
        )}
      </View>

      {/* Error / Helper text */}
      {error ? (
        <Text variant="caption" color="expense" style={styles.feedbackText}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="secondary" style={styles.feedbackText}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  staticLabel: {
    marginBottom: 6,
    marginLeft: 2,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
  },
  iconLeft: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  iconRight: {
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  nonPressableIcon: {
    opacity: 0.7,
  },
  feedbackText: {
    marginTop: 4,
    marginLeft: 6,
  },
});

export default TextInput;
