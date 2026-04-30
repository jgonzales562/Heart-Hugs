import { Heart, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { WELLNESS_DISCLAIMER } from '../constants/disclaimer';
import { sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { TabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const featuredSessions = sessions.filter((session) => session.isFeatured);
  const firstFeaturedSession = featuredSessions[0] ?? sessions[0];
  const nextSessions = sessions.filter((session) => session.id !== firstFeaturedSession.id).slice(0, 3);

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen scroll>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Heart color={colors.rose} fill={colors.roseSoft} size={20} />
          </View>
          <Text style={styles.brandText}>Heart Hugs</Text>
        </View>
        <Text style={styles.title}>A soft place to pause</Text>
        <Text style={styles.subtitle}>
          Guided audio and video sessions for grounding, breath, and self-compassion.
        </Text>
      </View>

      <View style={styles.notice}>
        <Sparkles color={colors.tealDeep} size={18} />
        <Text numberOfLines={4} style={styles.noticeText}>
          {WELLNESS_DISCLAIMER}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <SessionCard onPress={openSession} session={firstFeaturedSession} variant="large" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library Picks</Text>
        <View style={styles.sessionList}>
          {nextSessions.map((session) => (
            <SessionCard key={session.id} onPress={openSession} session={session} />
          ))}
        </View>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brandText: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
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
  notice: {
    alignItems: 'flex-start',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  noticeText: {
    color: colors.inkMuted,
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  section: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
