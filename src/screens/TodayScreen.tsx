import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { MoodThermometer } from '../components/MoodThermometer';
import { PlaybackProgress } from '../components/PlaybackProgress';
import { SessionCard } from '../components/SessionCard';
import { sessionRepository, wellnessNeeds } from '../content/sessionRepository';
import { getSessionArtwork } from '../data/sessionArtwork';
import { useWellness } from '../state/WellnessProvider';
import type { SessionActivity } from '../state/wellnessState';
import { colors, theme } from '../theme';
import type { MainTabScreenProps } from '../types/navigation';
import type { Session, WellnessNeed } from '../types/session';
import {
  getHomeSessionCollections,
  type HomeSessionCollections,
} from '../utils/sessionDiscovery';
import { formatPlaybackTime } from '../utils/time';

const ALL_SESSIONS = sessionRepository.getAll();
const CONTINUE_OVERLAY_COLORS = [
  'rgba(27, 16, 55, 0.08)',
  'rgba(27, 16, 55, 0.9)',
] as const;
const WELLNESS_NEEDS_BY_ID = new Map(wellnessNeeds.map((need) => [need.id, need]));
const DEFAULT_WELLNESS_NEED = getDefaultWellnessNeed();

function getDefaultWellnessNeed(): WellnessNeed {
  const defaultNeed = wellnessNeeds.find((need) => need.id === 'grounding');

  if (!defaultNeed) {
    throw new Error('Heart Hugs requires a default wellness need.');
  }

  return defaultNeed;
}

type RowSpacing = 'md' | 'xl' | undefined;

type HomeListRow =
  | {
      readonly eyebrow: string;
      readonly key: string;
      readonly spacingAfter: RowSpacing;
      readonly title: string;
      readonly type: 'section-heading';
    }
  | {
      readonly key: string;
      readonly session: Session;
      readonly spacingAfter: RowSpacing;
      readonly type: 'session';
      readonly variant: 'compact' | 'large';
    }
  | {
      readonly key: string;
      readonly need: WellnessNeed;
      readonly spacingAfter: RowSpacing;
      readonly type: 'empty-recommendations';
    }
  | {
      readonly key: string;
      readonly sessions: readonly Session[];
      readonly spacingAfter: RowSpacing;
      readonly type: 'recent';
    }
  | {
      readonly count: number;
      readonly key: string;
      readonly spacingAfter: RowSpacing;
      readonly type: 'catalog-note';
    };

export function TodayScreen({ navigation }: MainTabScreenProps<'Today'>): ReactElement {
  const [isMoodDragging, setIsMoodDragging] = useState(false);
  const { logMood, setNeedPreference, state, toggleSaved } = useWellness();
  const selectedNeed =
    WELLNESS_NEEDS_BY_ID.get(state.needPreference) ?? DEFAULT_WELLNESS_NEED;
  const collections = useMemo(
    () =>
      getHomeSessionCollections(
        ALL_SESSIONS,
        state.needPreference,
        state.activityBySessionId,
        sessionRepository.getById
      ),
    [state.activityBySessionId, state.needPreference]
  );
  const savedSessionIds = useMemo(
    () => new Set(state.savedSessionIds),
    [state.savedSessionIds]
  );
  const rows = useMemo(
    () => createHomeRows(collections, selectedNeed, ALL_SESSIONS.length),
    [collections, selectedNeed]
  );
  const continueSession = collections.continueSession;

  const openSession = useCallback((session: Session): void => {
    navigation.navigate('Player', { sessionId: session.id });
  }, [navigation]);

  const toggleSessionSaved = useCallback((session: Session): void => {
    toggleSaved(session.id);
  }, [toggleSaved]);

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<HomeListRow>): ReactElement => {
      const rowStyle = getRowSpacingStyle(item.spacingAfter);

      switch (item.type) {
        case 'section-heading':
          return (
            <View style={[styles.listSectionHeading, rowStyle]}>
              <Text style={styles.sectionEyebrow}>{item.eyebrow}</Text>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {item.title}
              </Text>
            </View>
          );
        case 'session':
          return (
            <View style={rowStyle}>
              <SessionCard
                isSaved={savedSessionIds.has(item.session.id)}
                onPress={openSession}
                onToggleSaved={toggleSessionSaved}
                session={item.session}
                variant={item.variant}
              />
            </View>
          );
        case 'empty-recommendations':
          return (
            <View style={[styles.emptyRecommendation, rowStyle]}>
              <Text accessibilityRole="header" style={styles.emptyRecommendationTitle}>
                More sessions are on the way.
              </Text>
              <Text style={styles.emptyRecommendationText}>
                We are preparing practices for {item.need.label}.
              </Text>
            </View>
          );
        case 'recent':
          return (
            <RecentSessions
              onOpenSession={openSession}
              onToggleSaved={toggleSessionSaved}
              savedSessionIds={savedSessionIds}
              sessions={item.sessions}
              style={rowStyle}
            />
          );
        case 'catalog-note':
          return (
            <Text style={[styles.catalogNote, rowStyle]}>
              {item.count} supportive practices available
            </Text>
          );
      }
    },
    [openSession, savedSessionIds, toggleSessionSaved]
  );

  return (
    <GradientScreen contentContainerStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={rows}
        initialNumToRender={7}
        keyExtractor={getHomeRowKey}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.topBar}>
              <View style={styles.brandCopy}>
                <Text style={styles.eyebrow}>HEART HUGS</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  Come back to yourself.
                </Text>
              </View>
              <BreathingPressable
                accessibilityLabel="Open settings and safety information"
                accessibilityRole="button"
                hitSlop={theme.spacing.xs}
                onPress={() => navigation.navigate('Settings')}
                style={styles.settingsButton}
              >
                <Settings accessible={false} color={colors.textPrimary} size={21} />
              </BreathingPressable>
            </View>

            <MoodThermometer
              latestCheckIn={state.moodCheckIns[0]}
              onDragStateChange={setIsMoodDragging}
              onLogMood={logMood}
            />

            {continueSession ? (
              <ContinueCard
                activity={continueSession.activity}
                onPress={() => openSession(continueSession.session)}
                session={continueSession.session}
              />
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <View accessible={false} style={styles.sectionIcon}>
                  <Sparkles accessible={false} color={colors.coralDeep} size={17} />
                </View>
                <View style={styles.sectionHeadingCopy}>
                  <Text style={styles.sectionEyebrow}>CHOOSE YOUR MOMENT</Text>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    Start with what you need
                  </Text>
                </View>
              </View>

              <View
                accessibilityLabel="Wellness need"
                accessibilityRole="radiogroup"
                style={styles.needGrid}
              >
                {wellnessNeeds.map((need) => {
                  const isSelected = need.id === state.needPreference;

                  return (
                    <BreathingPressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      containerStyle={styles.needButtonContainer}
                      key={need.id}
                      onPress={() => setNeedPreference(need.id)}
                      style={[styles.needButton, isSelected && styles.selectedNeedButton]}
                    >
                      <Text style={[styles.needLabel, isSelected && styles.selectedNeedLabel]}>
                        {need.label}
                      </Text>
                    </BreathingPressable>
                  );
                })}
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.needDescription}>
                {selectedNeed.description}
              </Text>
            </View>
          </View>
        }
        renderItem={renderRow}
        scrollEnabled={!isMoodDragging}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={7}
      />
    </GradientScreen>
  );
}

function createHomeRows(
  collections: HomeSessionCollections,
  selectedNeed: WellnessNeed,
  catalogSize: number
): readonly HomeListRow[] {
  const rows: HomeListRow[] = [
    {
      eyebrow: 'RECOMMENDED FOR YOU',
      key: 'recommended-heading',
      spacingAfter: 'md',
      title: `${selectedNeed.label} practices`,
      type: 'section-heading',
    },
  ];

  if (collections.recommendations.length === 0) {
    rows.push({
      key: 'empty-recommendations',
      need: selectedNeed,
      spacingAfter: 'xl',
      type: 'empty-recommendations',
    });
  } else {
    collections.recommendations.forEach((session, index) => {
      rows.push({
        key: `recommended-${session.id}`,
        session,
        spacingAfter: index === collections.recommendations.length - 1 ? 'xl' : 'md',
        type: 'session',
        variant: index === 0 ? 'large' : 'compact',
      });
    });
  }

  if (collections.recentSessions.length > 0) {
    rows.push({
      key: 'recent-sessions',
      sessions: collections.recentSessions,
      spacingAfter: 'xl',
      type: 'recent',
    });
  }

  rows.push({
    eyebrow: 'MORE PRACTICES',
    key: 'remaining-heading',
    spacingAfter: collections.remainingSessions.length > 0 ? 'md' : 'xl',
    title: 'Browse at your own pace',
    type: 'section-heading',
  });

  collections.remainingSessions.forEach((session, index) => {
    rows.push({
      key: `remaining-${session.id}`,
      session,
      spacingAfter: index === collections.remainingSessions.length - 1 ? 'xl' : 'md',
      type: 'session',
      variant: 'compact',
    });
  });

  rows.push({
    count: catalogSize,
    key: 'catalog-note',
    spacingAfter: undefined,
    type: 'catalog-note',
  });

  return rows;
}

function getHomeRowKey(row: HomeListRow): string {
  return row.key;
}

function getRowSpacingStyle(spacing: RowSpacing): ViewStyle | undefined {
  if (spacing === 'md') {
    return styles.spaceAfterMd;
  }

  if (spacing === 'xl') {
    return styles.spaceAfterXl;
  }

  return undefined;
}

type RecentSessionsProps = {
  readonly onOpenSession: (session: Session) => void;
  readonly onToggleSaved: (session: Session) => void;
  readonly savedSessionIds: ReadonlySet<string>;
  readonly sessions: readonly Session[];
  readonly style?: StyleProp<ViewStyle>;
};

function RecentSessions({
  onOpenSession,
  onToggleSaved,
  savedSessionIds,
  sessions,
  style,
}: RecentSessionsProps): ReactElement {
  return (
    <View style={[styles.recentSection, style]}>
      <View style={styles.recentHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Recently opened
        </Text>
        <Text
          accessibilityLabel={`${sessions.length} recently opened practices`}
          style={styles.recentCount}
        >
          {sessions.length}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.horizontalList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {sessions.map((session) => (
          <SessionCard
            isSaved={savedSessionIds.has(session.id)}
            key={session.id}
            onPress={onOpenSession}
            onToggleSaved={onToggleSaved}
            session={session}
            variant="tile"
          />
        ))}
      </ScrollView>
    </View>
  );
}

type ContinueCardProps = {
  readonly activity: Pick<SessionActivity, 'durationSeconds' | 'positionSeconds'>;
  readonly onPress: () => void;
  readonly session: Session;
};

function ContinueCard({ activity, onPress, session }: ContinueCardProps): ReactElement {
  const positionLabel = formatPlaybackTime(activity.positionSeconds);
  const progressLabel = activity.durationSeconds
    ? `${positionLabel} of ${formatPlaybackTime(activity.durationSeconds)}`
    : positionLabel;

  return (
    <BreathingPressable
      accessibilityLabel={`Continue ${session.title} at ${progressLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.continueCard}
    >
      <ImageBackground
        accessible={false}
        imageStyle={styles.continueArtworkImage}
        resizeMode="cover"
        source={getSessionArtwork(session)}
        style={styles.continueArtwork}
      >
        <LinearGradient
          colors={CONTINUE_OVERLAY_COLORS}
          style={styles.continueOverlay}
        >
          <Text style={[styles.sectionEyebrow, styles.continueEyebrow]}>
            CONTINUE LISTENING
          </Text>
          <Text style={styles.continueTitle}>{session.title}</Text>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <PlaybackProgress
              currentTime={activity.positionSeconds}
              duration={activity.durationSeconds}
              tone="overlay"
            />
          </View>
        </LinearGradient>
      </ImageBackground>
    </BreathingPressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 0,
    paddingTop: theme.spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 116,
  },
  listHeader: {
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  listSectionHeading: {
    gap: theme.spacing.xxs,
  },
  spaceAfterMd: {
    marginBottom: theme.spacing.md,
  },
  spaceAfterXl: {
    marginBottom: theme.spacing.xl,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  brandCopy: {
    flex: 1,
    gap: theme.spacing.xs,
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
    fontSize: 40,
    letterSpacing: -1,
    lineHeight: 45,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  continueCard: {
    backgroundColor: colors.midnight,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    elevation: 4,
    overflow: 'hidden',
  },
  continueArtwork: {
    minHeight: 176,
    width: '100%',
  },
  continueArtworkImage: {
    borderRadius: theme.radius.lg,
  },
  continueOverlay: {
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
    minHeight: 176,
    padding: theme.spacing.lg,
  },
  continueTitle: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  continueEyebrow: {
    color: colors.sunshineSoft,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionHeadingCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.vitalitySoft,
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sectionEyebrow: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.5,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  needGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  needButtonContainer: {
    flexBasis: '46%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  needButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedNeedButton: {
    backgroundColor: colors.lavender,
    borderColor: colors.magenta,
  },
  needLabel: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  selectedNeedLabel: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  needDescription: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  emptyRecommendation: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  emptyRecommendationTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  emptyRecommendationText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  recentSection: {
    gap: theme.spacing.md,
    marginHorizontal: -theme.spacing.lg,
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  recentCount: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
  },
  horizontalList: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  catalogNote: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    textAlign: 'center',
  },
});
