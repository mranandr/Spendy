import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  TextInput as RNTextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ViewStyle 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Icon } from '../primitives';

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = React.memo(({
  placeholder = 'Search transactions...',
  onSearch,
  isLoading = false,
  style,
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<RNTextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Animated width and opacity of the input container
  const widthAnim = useSharedValue(0); // 0 means collapsed, 1 means expanded

  useEffect(() => {
    widthAnim.value = withTiming(isExpanded ? 1 : 0, { duration: 250 });
  }, [isExpanded]);

  // Debounced search logic
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  const handleCollapse = () => {
    setQuery('');
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Reanimated style for the expanding search field
  const animatedSearchStyle = useAnimatedStyle(() => {
    return {
      flex: widthAnim.value,
      opacity: widthAnim.value,
      marginLeft: widthAnim.value > 0 ? 8 : 0,
    };
  });

  return (
    <View 
      row 
      center 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: isExpanded ? theme.colors.accent : theme.colors.border 
        },
        style
      ]}
    >
      {/* Search Icon / Press to Expand */}
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={isExpanded ? undefined : handleExpand}
        style={styles.searchIconTouch}
      >
        <Icon name="search" size="md" color={isExpanded ? 'accent' : 'secondary'} />
      </TouchableOpacity>

      {/* Expanding Text Input Area */}
      <Animated.View style={[styles.inputContainer, animatedSearchStyle]}>
        <RNTextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          style={[styles.input, { color: theme.colors.text.primary }]}
        />
      </Animated.View>

      {/* Loading Spinner or Clear/Close Buttons */}
      {isExpanded && (
        <View row center style={styles.actionsRow}>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.accent} style={styles.spinner} />
          ) : query ? (
            <TouchableOpacity onPress={handleClear} style={styles.actionTouch}>
              <Icon name="x-circle" size="sm" color="secondary" />
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity onPress={handleCollapse} style={styles.actionTouch}>
            <Icon name="x" size="md" color="secondary" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchIconTouch: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionTouch: {
    padding: 4,
  },
  spinner: {
    marginRight: 4,
  },
});

export default SearchInput;
