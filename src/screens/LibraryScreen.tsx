import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CategoryList } from '../components/CategoryList';
import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { categories, sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { TabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function LibraryScreen({ navigation }: TabScreenProps<'Library'>) {
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
    <GradientScreen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>
          Choose a supportive practice by mood, moment, or format.
        </Text>
      </View>

      <CategoryList
        categories={categories}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      <View style={styles.sessionList}>
        {filteredSessions.map((session) => (
          <SessionCard key={session.id} onPress={openSession} session={session} />
        ))}
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  subtitle: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  sessionList: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
});
