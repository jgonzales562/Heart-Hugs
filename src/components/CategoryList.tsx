import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, theme } from '../theme';

type CategoryListProps = {
  categories: string[];
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
};

export function CategoryList({
  categories,
  onSelectCategory,
  selectedCategory,
}: CategoryListProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {categories.map((category) => {
        const isSelected = category === selectedCategory;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={category}
            onPress={() => onSelectCategory(category)}
            style={[styles.category, isSelected && styles.selectedCategory]}
          >
            <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    paddingRight: theme.spacing.lg,
  },
  category: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    elevation: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 11,
  },
  selectedCategory: {
    backgroundColor: colors.deepOcean,
    borderColor: colors.deepOcean,
    elevation: 4,
  },
  categoryText: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  selectedCategoryText: {
    color: colors.offWhite,
  },
});
