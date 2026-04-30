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
    paddingRight: theme.spacing.lg,
  },
  category: {
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedCategory: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  categoryText: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  selectedCategoryText: {
    color: colors.offWhite,
  },
});
