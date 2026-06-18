import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput as RNTextInput 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { View, Text, Icon, Pressable } from '../primitives';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export const PREDEFINED_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#F43F5E' },
  { id: 'groceries', name: 'Groceries', icon: 'shopping-cart', color: '#10B981' },
  { id: 'rent', name: 'Rent & Home', icon: 'home', color: '#3B82F6' },
  { id: 'travel', name: 'Travel & Fuel', icon: 'car', color: '#F59E0B' },
  { id: 'bills', name: 'Utility Bills', icon: 'file-text', color: '#EC4899' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#8B5CF6' },
  { id: 'investments', name: 'Investments', icon: 'trending-up', color: '#06B6D4' },
  { id: 'entertainment', name: 'Entertainment', icon: 'tv', color: '#14B8A6' },
];

export interface CategoryPickerProps {
  selectedCategoryId: string;
  onSelectCategory: (category: Category) => void;
  customCategories?: Category[];
  onAddCustomCategory?: (name: string) => void;
}

const CategoryItem: React.FC<{
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}> = React.memo(({ category, isSelected, onPress }) => {
  const theme = useTheme();
  
  // Reanimated ring scale
  const ringScale = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    ringScale.value = withSpring(isSelected ? 1 : 0, { damping: 12 });
  }, [isSelected]);

  const ringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
      opacity: ringScale.value,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.categoryItem}
    >
      <View center style={styles.iconContainer}>
        {/* Animated Selection Ring */}
        <Animated.View 
          style={[
            styles.selectionRing, 
            { borderColor: category.color },
            ringStyle
          ]} 
        />
        
        {/* Category Circle Background */}
        <View 
          center 
          style={[
            styles.categoryCircle, 
            { backgroundColor: category.color + '20' }
          ]}
        >
          <Icon name={category.icon} size="md" color={category.color} />
        </View>
      </View>
      
      <Text 
        variant="caption" 
        align="center" 
        style={[
          styles.categoryLabel, 
          { 
            color: isSelected ? theme.colors.text.primary : theme.colors.text.secondary,
            fontWeight: isSelected ? '700' : '500'
          }
        ]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
});

export const CategoryPicker: React.FC<CategoryPickerProps> = React.memo(({
  selectedCategoryId,
  onSelectCategory,
  customCategories = [],
  onAddCustomCategory,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const allCategories = [...PREDEFINED_CATEGORIES, ...customCategories];
  const activeCategory = allCategories.find(c => c.id === selectedCategoryId) || allCategories[0];

  const handleAddCustom = () => {
    if (!newCategoryName.trim()) return;
    if (onAddCustomCategory) {
      onAddCustomCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  return (
    <View style={styles.container}>
      <View row center={false} style={styles.headerRow}>
        <Text variant="bodySmall" color="secondary" style={styles.sectionLabel}>
          Category
        </Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text variant="caption" color="accent" style={styles.seeAllButton}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll of standard categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {PREDEFINED_CATEGORIES.slice(0, 5).map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            isSelected={selectedCategoryId === category.id}
            onPress={() => onSelectCategory(category)}
          />
        ))}
        
        {/* Quick See More Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          style={styles.categoryItem}
        >
          <View center style={styles.categoryCircleMore}>
            <Icon name="grid" size="md" color="secondary" />
          </View>
          <Text variant="caption" align="center" color="secondary" style={styles.categoryLabel}>
            More
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Full Sheet Modal for all categories */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
          >
            {/* Modal Header */}
            <View row center={false} style={styles.modalHeader}>
              <Text variant="h3" style={styles.modalTitle}>
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size="lg" color="primary" />
              </TouchableOpacity>
            </View>

            {/* FlatList of Categories */}
            <FlatList
              data={allCategories}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.gridContainer}
              renderItem={({ item }) => (
                <View style={styles.gridItemContainer}>
                  <CategoryItem
                    category={item}
                    isSelected={selectedCategoryId === item.id}
                    onPress={() => {
                      onSelectCategory(item);
                      setModalVisible(false);
                    }}
                  />
                </View>
              )}
            />

            {/* Custom Category Input */}
            {onAddCustomCategory && (
              <View 
                style={[
                  styles.customInputContainer, 
                  { borderTopColor: theme.colors.border, backgroundColor: theme.colors.card }
                ]}
              >
                <Text variant="caption" color="secondary" style={styles.customInputTitle}>
                  Create Custom Category
                </Text>
                <View row style={styles.customInputRow}>
                  <RNTextInput
                    placeholder="E.g. Gym, Subscriptions"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    style={[
                      styles.customTextInput, 
                      { 
                        backgroundColor: theme.colors.surface, 
                        borderColor: theme.colors.border,
                        color: theme.colors.text.primary
                      }
                    ]}
                  />
                  <Pressable 
                    onPress={handleAddCustom}
                    style={[
                      styles.customAddButton, 
                      { backgroundColor: theme.colors.accent }
                    ]}
                  >
                    <Icon name="plus" size="md" color="inverse" />
                  </Pressable>
                </View>
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
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontWeight: '600',
  },
  seeAllButton: {
    fontWeight: '600',
  },
  scrollContainer: {
    paddingHorizontal: 4,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  iconContainer: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  categoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  categoryCircleMore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#646475',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: 11,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '700',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridItemContainer: {
    flex: 1,
    alignItems: 'center',
    marginVertical: 12,
  },
  customInputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  customInputTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  customTextInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  customAddButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryPicker;
