import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryList } from '../components/CategoryList';
import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { sessionRepository } from '../content/sessionRepository';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import { MainTabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function ExploreScreen({ navigation }: MainTabScreenProps<'Explore'>) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { state, toggleSaved } = useWellness();
  const sessions = sessionRepository.getAll();
  const categories = sessionRepository.getCategories();

  const filteredSessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return sessions.filter((session) => {
      const matchesCategory =
        selectedCategory === 'All' || session.category === selectedCategory;
      const searchableCopy = [
        session.title,
        session.description,
        session.category,
        session.difficulty,
        session.mediaType,
        ...session.tags,
        ...session.benefits,
      ]
        .join(' ')
        .toLocaleLowerCase();

      return matchesCategory && (!normalizedQuery || searchableCopy.includes(normalizedQuery));
    });
  }, [searchQuery, selectedCategory, sessions]);

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} scroll>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>EXPLORE</Text>
        <Text style={styles.title}>Find a supportive practice</Text>
        <Text style={styles.subtitle}>Search by feeling, moment, benefit, or format.</Text>
      </View>

      <View style={styles.searchShell}>
        <Search color={colors.textSecondary} size={19} />
        <TextInput
          accessibilityLabel="Search practices"
          autoCapitalize="none"
          onChangeText={setSearchQuery}
          placeholder="Try sleep, breathing, or aftercare"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />
      </View>

      <CategoryList
        categories={[...categories]}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      <View style={styles.resultsHeader}>
        <Text accessibilityLiveRegion="polite" style={styles.resultsTitle}>
          {filteredSessions.length === 0
            ? 'No matching practices'
            : selectedCategory === 'All'
              ? 'All practices'
              : selectedCategory}
        </Text>
        <Text style={styles.resultsCount}>{filteredSessions.length} found</Text>
      </View>

      {filteredSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Try a broader search</Text>
          <Text style={styles.emptyText}>Clear the search or choose All to see every session.</Text>
        </View>
      ) : (
        <View style={styles.sessionList}>
          {filteredSessions.map((session) => (
            <SessionCard
              isSaved={state.savedSessionIds.includes(session.id)}
              key={session.id}
              onPress={openSession}
              onToggleSaved={(selectedSession) => toggleSaved(selectedSession.id)}
              session={session}
            />
          ))}
        </View>
      )}
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 116,
  },
  header: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  eyebrow: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.8,
    lineHeight: theme.typography.lineHeight.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 36,
    letterSpacing: -1,
    lineHeight: 43,
    maxWidth: 330,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: theme.spacing.sm,
  },
  sessionList: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  resultsHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xl,
  },
  resultsTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  resultsCount: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: 'center',
  },
});
