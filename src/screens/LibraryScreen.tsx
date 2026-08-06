import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CategoryList } from '../components/CategoryList';
import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { categories, sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { MainTabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function LibraryScreen({ navigation }: MainTabScreenProps<'Library'>) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredSessions = useMemo(() => {
    if (selectedCategory === 'All') {
      return sessions;
    }

    return sessions.filter((session) => session.category === selectedCategory);
  }, [selectedCategory]);

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} scroll>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DISCOVER</Text>
        <Text style={styles.title}>What do you need today?</Text>
        <Text style={styles.subtitle}>
          Explore supportive practices by mood, moment, or format.
        </Text>
      </View>

      <CategoryList
        categories={categories}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {selectedCategory === 'All' ? 'All sessions' : selectedCategory}
        </Text>
        <Text style={styles.resultsCount}>{filteredSessions.length} practices</Text>
      </View>

      <View style={styles.sessionList}>
        {filteredSessions.map((session) => (
          <SessionCard key={session.id} onPress={openSession} session={session} />
        ))}
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 116,
  },
  header: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  eyebrow: {
    color: colors.teal,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.8,
    lineHeight: theme.typography.lineHeight.sm,
  },
  title: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 36,
    letterSpacing: -1,
    lineHeight: 43,
    maxWidth: 320,
  },
  subtitle: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
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
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  resultsCount: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
