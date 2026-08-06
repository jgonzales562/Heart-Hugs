import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Play, ShieldCheck, Sparkles } from 'lucide-react-native';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { WELLNESS_DISCLAIMER } from '../constants/disclaimer';
import { sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { MainTabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const featuredSessions = sessions.filter((session) => session.isFeatured);
  const firstFeaturedSession = featuredSessions[0] ?? sessions[0];
  const nextSessions = sessions.filter((session) => session.id !== firstFeaturedSession.id).slice(0, 4);
  const eveningSession =
    sessions.find((session) => session.category === 'Sleep') ?? nextSessions[nextSessions.length - 1];

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} scroll>
      <ImageBackground
        imageStyle={styles.heroImage}
        source={{ uri: firstFeaturedSession.thumbnailUrl }}
        style={styles.hero}
      >
        <LinearGradient
          colors={['rgba(6, 29, 47, 0.18)', 'rgba(6, 29, 47, 0.38)', 'rgba(6, 29, 47, 0.9)']}
          locations={[0, 0.42, 1]}
          style={styles.heroOverlay}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Heart color={colors.white} fill={colors.white} size={17} />
            </View>
            <Text style={styles.brandText}>Heart Hugs</Text>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>A MOMENT FOR YOU</Text>
            <Text style={styles.title}>A soft place to pause</Text>
            <Text style={styles.subtitle}>
              Settle in with a gentle practice for wherever you are today.
            </Text>
          </View>

          <Pressable
            accessibilityLabel={`Play featured session ${firstFeaturedSession.title}`}
            accessibilityRole="button"
            onPress={() => openSession(firstFeaturedSession)}
            style={({ pressed }) => [styles.featuredAction, pressed && styles.pressed]}
          >
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredLabel}>Featured · {firstFeaturedSession.durationMinutes} min</Text>
              <Text numberOfLines={1} style={styles.featuredTitle}>
                {firstFeaturedSession.title}
              </Text>
            </View>
            <View style={styles.playButton}>
              <Play color={colors.navy} fill={colors.navy} size={18} />
            </View>
          </Pressable>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>FOR THIS MOMENT</Text>
            <Text style={styles.sectionTitle}>Find your gentle reset</Text>
          </View>
          <Sparkles color={colors.teal} size={20} />
        </View>

        <ScrollView
          contentContainerStyle={styles.horizontalList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {nextSessions.map((session) => (
            <SessionCard key={session.id} onPress={openSession} session={session} variant="tile" />
          ))}
        </ScrollView>

        {eveningSession ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>WIND DOWN</Text>
            <Text style={styles.sectionTitle}>Ease into the evening</Text>
            <SessionCard onPress={openSession} session={eveningSession} />
          </View>
        ) : null}

        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <ShieldCheck color={colors.white} size={18} />
          </View>
          <Text numberOfLines={4} style={styles.noticeText}>
            {WELLNESS_DISCLAIMER}
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 116,
    paddingHorizontal: 0,
    paddingTop: theme.spacing.sm,
  },
  hero: {
    height: 430,
    marginHorizontal: theme.spacing.md,
  },
  heroImage: {
    borderRadius: 34,
  },
  heroOverlay: {
    borderRadius: 34,
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.whiteFaint,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brandText: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  heroCopy: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.8,
    lineHeight: theme.typography.lineHeight.sm,
  },
  title: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 39,
    letterSpacing: -1.2,
    lineHeight: 45,
    maxWidth: 300,
  },
  subtitle: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.lg,
    maxWidth: 310,
  },
  featuredAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(111, 202, 193, 0.94)',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  featuredCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  featuredLabel: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: theme.radius.full,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  body: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionEyebrow: {
    color: colors.teal,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.5,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    letterSpacing: -0.5,
    lineHeight: theme.typography.lineHeight.xl,
  },
  horizontalList: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(7, 31, 49, 0.68)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  noticeIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(86, 193, 178, 0.28)',
    borderRadius: theme.radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  noticeText: {
    color: colors.whiteMuted,
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
});
