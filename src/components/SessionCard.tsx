import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, ChevronRight, Clock, Headphones, Video } from 'lucide-react-native';
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BreathingPressable, useBreathingPressAnimation } from './BreathingPressable';
import { colors, theme } from '../theme';
import { getSessionArtwork } from '../data/sessionArtwork';
import { Session } from '../types/session';

type SessionCardProps = {
  isSaved?: boolean;
  onPress: (session: Session) => void;
  onToggleSaved?: (session: Session) => void;
  session: Session;
  variant?: 'large' | 'compact' | 'tile';
};

export function SessionCard({
  isSaved = false,
  onPress,
  onToggleSaved,
  session,
  variant = 'compact',
}: SessionCardProps) {
  const { animatedStyle, breatheIn, breatheOut } = useBreathingPressAnimation();
  const MediaIcon = session.mediaType === 'audio' ? Headphones : Video;
  const isLarge = variant === 'large';
  const isTile = variant === 'tile';
  const highlights = [session.tags[0], session.benefits[0]]
    .filter((highlight): highlight is string => Boolean(highlight))
    .slice(0, 2);

  function toggleSaved() {
    onToggleSaved?.(session);
  }

  return (
    <Animated.View
      style={[
        styles.card,
        isLarge ? styles.largeCard : isTile ? styles.tileCard : styles.compactCard,
        animatedStyle,
      ]}
    >
      <Pressable
        accessibilityLabel={`${session.title}, ${session.mediaType}, ${session.durationMinutes} minutes`}
        accessibilityRole="button"
        onPress={() => onPress(session)}
        onPressIn={breatheIn}
        onPressOut={breatheOut}
        style={styles.cardPressable}
      >
        <ImageBackground
          imageStyle={styles.image}
          source={getSessionArtwork(session)}
          style={styles.imageBackground}
        >
          <LinearGradient
            colors={['rgba(27, 16, 55, 0.01)', 'rgba(27, 16, 55, 0.16)', 'rgba(27, 16, 55, 0.92)']}
            locations={[0, 0.42, 1]}
            style={styles.overlay}
          >
            <View style={styles.topRow}>
              {onToggleSaved ? (
                <View style={styles.saveButtonSpace} />
              ) : session.isFeatured ? (
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
              <Text numberOfLines={isLarge ? 3 : isTile ? 2 : 1} style={styles.description}>
                {session.description}
              </Text>
              {isLarge ? (
                <View style={styles.highlightRow}>
                  {highlights.map((highlight) => (
                    <View key={highlight} style={styles.highlightPill}>
                      <Text numberOfLines={1} style={styles.highlightText}>
                        {highlight}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock color={colors.offWhite} size={14} />
                  <Text style={styles.metaText}>{session.durationMinutes} min</Text>
                </View>
                {isLarge ? (
                  <Text style={styles.metaDivider}>/</Text>
                ) : null}
                <Text style={styles.metaText}>{session.category}</Text>
                <ChevronRight color={colors.offWhite} size={18} style={styles.chevron} />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
      {onToggleSaved ? (
        <BreathingPressable
          accessibilityLabel={isSaved ? `Remove ${session.title} from Saved` : `Save ${session.title}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSaved }}
          hitSlop={theme.spacing.xs}
          onPress={toggleSaved}
          containerStyle={styles.saveButtonOverlay}
          style={[
            styles.saveButton,
            isSaved && styles.savedButton,
          ]}
        >
          <Bookmark
            color={isSaved ? colors.navy : colors.white}
            fill={isSaved ? colors.white : 'transparent'}
            size={17}
          />
        </BreathingPressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: theme.radius.lg,
    elevation: 5,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  compactCard: {
    minHeight: 196,
  },
  largeCard: {
    minHeight: 310,
  },
  tileCard: {
    minHeight: 268,
    width: 218,
  },
  cardPressable: {
    flex: 1,
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
    padding: theme.spacing.lg,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredPill: {
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.transparentNavy,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  saveButtonOverlay: {
    left: theme.spacing.lg,
    position: 'absolute',
    top: theme.spacing.lg,
    zIndex: 2,
  },
  saveButtonSpace: {
    height: 38,
    width: 38,
  },
  savedButton: {
    backgroundColor: colors.hotPink,
    borderColor: colors.hotPink,
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
    paddingVertical: 6,
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
    fontSize: 22,
    lineHeight: 28,
  },
  largeTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  description: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
    opacity: 0.9,
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
