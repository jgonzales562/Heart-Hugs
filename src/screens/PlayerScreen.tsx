import { StyleSheet, Text, View } from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { MediaPlayer } from '../components/MediaPlayer';
import { SessionCard } from '../components/SessionCard';
import { getDefaultSession, getSessionById, sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { RootStackScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function PlayerScreen({ navigation, route }: RootStackScreenProps<'Player'>) {
  const activeSession = getSessionById(route.params.sessionId) ?? getDefaultSession();
  const relatedSessions = sessions
    .filter((session) => session.id !== activeSession.id && session.category === activeSession.category)
    .concat(sessions.filter((session) => session.id !== activeSession.id))
    .filter(
      (session, index, allSessions) =>
        allSessions.findIndex((candidate) => candidate.id === session.id) === index
    )
    .slice(0, 2);

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Player</Text>
        <Text style={styles.subtitle}>{activeSession.category}</Text>
      </View>

      <MediaPlayer key={activeSession.id} session={activeSession} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More for this moment</Text>
        <View style={styles.sessionList}>
          {relatedSessions.map((session) => (
            <SessionCard key={session.id} onPress={openSession} session={session} />
          ))}
        </View>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  subtitle: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  section: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  sessionList: {
    gap: theme.spacing.md,
  },
});
