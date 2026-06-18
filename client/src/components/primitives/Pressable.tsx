import React from 'react';
import { Pressable as RNPressable, StyleSheet, GestureResponderEvent, ViewStyle, PressableProps as RNPressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableProps extends RNPressableProps {
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';
  activeScale?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const Pressable: React.FC<PressableProps> = React.memo(({
  haptic = 'light',
  activeScale = 0.96,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  style,
  children,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (event: GestureResponderEvent) => {
    if (disabled) return;
    
    // Trigger scale down animation
    scale.value = withSpring(activeScale, {
      damping: 15,
      stiffness: 300,
    });

    // Trigger haptic feedback
    if (haptic) {
      triggerHapticFeedback(haptic);
    }

    if (onPressIn) {
      onPressIn(event);
    }
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (disabled) return;
    
    // Trigger scale up animation
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });

    if (onPressOut) {
      onPressOut(event);
    }
  };

  const triggerHapticFeedback = async (type: string) => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
    } catch (e) {
      // Haptics not supported or failed
    }
  };

  // Build hit slop configuration (at least 8px as per CODING STANDARDS)
  const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[
        style,
        animatedStyle,
        disabled && styles.disabled,
      ]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});

export default Pressable;
