import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Clock, Headphones, Video } from 'lucide-react-native';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, theme } from '../theme';
import { Session } from '../types/session';

type SessionCardProps = {
  onPress: (session: Session) => void;
  session: Session;
  variant?: 'large' | 'compact';
};

export function SessionCard({ onPress, session, variant = 'compact' }: SessionCardProps) {
  const MediaIcon = session.mediaType === 'audio' ? Headphones : Video;
  const isLarge = variant === 'large';
  const highlights = [session.tags[0], session.benefits[0]]
    .filter((highlight): highlight is string => Boolean(highlight))
    .slice(0, 2);

  return (
    <Pressable
      accessibilityLabel={`${session.title}, ${session.mediaType}, ${session.durationMinutes} minutes, ${session.difficulty}`}
      accessibilityRole="button"
      onPress={() => onPress(session)}
      style={({ pressed }) => [
        styles.card,
        isLarge ? styles.largeCard : styles.compactCard,
        pressed && styles.pressed,
      ]}
    >
      <ImageBackground
        imageStyle={styles.image}
        source={{ uri: session.thumbnailUrl }}
        style={styles.imageBackground}
      >
        <LinearGradient
          colors={['rgba(23, 42, 68, 0.12)', 'rgba(23, 42, 68, 0.72)']}
          style={styles.overlay}
        >
          <View style={styles.topRow}>
            {session.isFeatured ? (
              <View style={styles.featuredPill}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.mediaPill}>
              <MediaIcon color={colors.offWhite} size={14} />
              <Text style={styles.mediaText}>{session.mediaType}</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text numberOfLines={2} style={[styles.title, isLarge && styles.largeTitle]}>
              {session.title}
            </Text>
            <Text numberOfLines={isLarge ? 3 : 2} style={styles.description}>
              {session.description}
            </Text>
            <View style={styles.highlightRow}>
              {highlights.map((highlight) => (
                <View key={highlight} style={styles.highlightPill}>
                  <Text numberOfLines={1} style={styles.highlightText}>
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock color={colors.offWhite} size={14} />
                <Text style={styles.metaText}>{session.durationMinutes} min</Text>
              </View>
              <Text style={styles.metaDivider}>/</Text>
              <Text style={styles.metaText}>{session.difficulty}</Text>
              <Text style={styles.metaDivider}>/</Text>
              <Text style={styles.metaText}>{session.category}</Text>
              <ChevronRight color={colors.offWhite} size={18} style={styles.chevron} />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  compactCard: {
    height: 240,
  },
  largeCard: {
    height: 280,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    borderRadius: theme.radius.lg,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredPill: {
    backgroundColor: colors.offWhiteTransparent,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  featuredText: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
  },
  mediaPill: {
    alignItems: 'center',
    backgroundColor: colors.transparentNavy,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  mediaText: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'capitalize',
  },
  content: {
    gap: theme.spacing.xs,
  },
  title: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  largeTitle: {
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  description: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
    opacity: 0.94,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  metaText: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  metaDivider: {
    color: colors.lavender,
    fontSize: theme.typography.size.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  highlightPill: {
    backgroundColor: 'rgba(255, 249, 240, 0.22)',
    borderColor: 'rgba(255, 249, 240, 0.32)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    maxWidth: '48%',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  highlightText: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'capitalize',
  },
  chevron: {
    marginLeft: 'auto',
  },
});
