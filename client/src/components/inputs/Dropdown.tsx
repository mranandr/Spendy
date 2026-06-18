import React, { useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput as RNTextInput 
} from 'react-native';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon, Pressable } from '../primitives';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValues: string[]; // Support single/multi-select by array representation
  onSelect: (values: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  error?: string;
}

export const Dropdown: React.FC<DropdownProps> = React.memo(({
  label,
  options,
  selectedValues,
  onSelect,
  placeholder = 'Select option...',
  multiSelect = false,
  error,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectOption = (value: string) => {
    if (multiSelect) {
      if (selectedValues.includes(value)) {
        onSelect(selectedValues.filter(val => val !== value));
      } else {
        onSelect([...selectedValues, value]);
      }
    } else {
      onSelect([value]);
      setModalVisible(false);
    }
  };

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active display text
  const getDisplayLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (!multiSelect) {
      const match = options.find(opt => opt.value === selectedValues[0]);
      return match ? match.label : placeholder;
    }
    return `${selectedValues.length} option(s) selected`;
  };

  return (
    <View style={styles.container}>
      {/* Trigger Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setModalVisible(true)}
        style={[
          styles.dropdownWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.expense : theme.colors.border,
          },
        ]}
      >
        {/* Floating Label Style */}
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

        {/* Display Label & Icon */}
        <View row center={false} style={styles.contentRow}>
          <Text 
            variant="body" 
            style={[
              styles.displayValText, 
              { color: selectedValues.length > 0 ? theme.colors.text.primary : theme.colors.text.tertiary }
            ]}
          >
            {getDisplayLabel()}
          </Text>
          <Icon name="chevron-down" size="sm" color="secondary" style={styles.rightIcon} />
        </View>
      </TouchableOpacity>

      {error && (
        <Text variant="caption" color="expense" style={styles.errorText}>
          {error}
        </Text>
      )}

      {/* Options List Modal Bottom Sheet style */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
          >
            {/* Header */}
            <View row center={false} style={styles.modalHeader}>
              <Text variant="h3" style={{ fontWeight: '700' }}>
                Select {label}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size="lg" color="primary" />
              </TouchableOpacity>
            </View>

            {/* Inline Option Search */}
            <View style={styles.searchContainer}>
              <RNTextInput
                placeholder="Search options..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[
                  styles.searchInput,
                  { 
                    backgroundColor: theme.colors.card, 
                    borderColor: theme.colors.border, 
                    color: theme.colors.text.primary 
                  }
                ]}
              />
            </View>

            {/* List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectOption(item.value)}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: theme.colors.border + '30' }
                    ]}
                  >
                    <Text 
                      variant="body" 
                      style={{ 
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? theme.colors.accent : theme.colors.text.primary
                      }}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size="md" color="accent" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Done Button for Multi-Select */}
            {multiSelect && (
              <View style={styles.footerContainer}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={[styles.doneButton, { backgroundColor: theme.colors.accent }]}
                >
                  <Text variant="body" color="inverse" style={{ fontWeight: '700' }}>
                    Done ({selectedValues.length} Selected)
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  dropdownWrapper: {
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
  rightIcon: {
    marginLeft: 'auto',
  },
  displayValText: {
    fontWeight: '500',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  optionItem: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  footerContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  doneButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default Dropdown;
