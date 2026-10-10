import { Bookmark, Compass, Settings } from 'lucide-react-native';
import { memo, useCallback, useMemo, type ReactElement } from 'react';
import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { sessionRepository } from '../content/sessionRepository';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import type { MainTabScreenProps } from '../types/navigation';
import type { Session } from '../types/session';
import { getSavedSessions, getSessionActivitySummary } from '../utils/sessionDiscovery';

type SavedListRow =
  | {
      readonly key: string;
      readonly spacingBefore?: 'xl';
      readonly title: string;
      readonly type: 'section-heading';
    }
  | {
      readonly isSaved: boolean;
      readonly key: string;
      readonly session: Session;
      readonly type: 'session';
    };

export function SavedScreen({ navigation }: MainTabScreenProps<'Saved'>): ReactElement {
  const { state, toggleSaved } = useWellness();
  const savedSessions = useMemo(
    () => getSavedSessions(state.savedSessionIds, sessionRepository.getById),
    [state.savedSessionIds]
  );
  const savedSessionIds = useMemo(() => new Set(state.savedSessionIds), [state.savedSessionIds]);
  const activitySummary = useMemo(
    () => getSessionActivitySummary(state.activityBySessionId, sessionRepository.getById),
    [state.activityBySessionId]
  );
  const rows = useMemo(
    () => createSavedRows(savedSessions, activitySummary.recentSessions, savedSessionIds),
    [activitySummary.recentSessions, savedSessionIds, savedSessions]
  );

  const openSession = useCallback((session: Session): void => {
    navigation.navigate('Player', { sessionId: session.id });
  }, [navigation]);

  const toggleSessionSaved = useCallback((session: Session): void => {
    toggleSaved(session.id);
  }, [toggleSaved]);

  const openSettings = useCallback((): void => {
    navigation.navigate('Settings');
  }, [navigation]);

  const browsePractices = useCallback((): void => {
    navigation.navigate('Today');
  }, [navigation]);

  const renderRow = useCallback(({ item }: ListRenderItemInfo<SavedListRow>): ReactElement => {
    if (item.type === 'section-heading') {
      return (
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, item.spacingBefore === 'xl' && styles.spaceBeforeSection]}
        >
          {item.title}
        </Text>
      );
    }

    return (
      <SavedSessionRow
        isSaved={item.isSaved}
        onOpenSession={openSession}
        onToggleSaved={toggleSessionSaved}
        session={item.session}
      />
    );
  }, [openSession, toggleSessionSaved]);

  return (
    <GradientScreen contentContainerStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={rows}
        initialNumToRender={7}
        keyExtractor={getSavedRowKey}
        ListHeaderComponent={
          <View style={[styles.listHeader, rows.length > 0 && styles.spaceAfterHeader]}>
            <View style={styles.topBar}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>YOUR SPACE</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  Saved for when you need it
                </Text>
              </View>
              <BreathingPressable
                accessibilityLabel="Open settings and safety information"
                accessibilityRole="button"
                onPress={openSettings}
                style={styles.iconButton}
              >
                <Settings
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  color={colors.textPrimary}
                  size={21}
                />
              </BreathingPressable>
            </View>

            <View style={styles.summaryRow}>
              <SummaryCard label="Saved" value={savedSessions.length} />
              <SummaryCard label="Completions" value={activitySummary.completionCount} />
            </View>

            {savedSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <View
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.emptyIcon}
                >
                  <Bookmark accessible={false} color={colors.leafDeep} size={27} />
                </View>
                <Text accessibilityRole="header" style={styles.emptyTitle}>
                  Your saved practices will appear here
                </Text>
                <Text style={styles.emptyText}>
                  Save a session from Today or the player so it is easy to return to.
                </Text>
                <BreathingPressable
                  accessibilityLabel="Browse practices"
                  accessibilityRole="button"
                  onPress={browsePractices}
                  style={styles.browseButton}
                >
                  <Compass
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    color={colors.navy}
                    size={18}
                  />
                  <Text style={styles.browseButtonText}>Browse practices</Text>
                </BreathingPressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={7}
      />
    </GradientScreen>
  );
}

function createSavedRows(
  savedSessions: readonly Session[],
  recentSessions: readonly Session[],
  savedSessionIds: ReadonlySet<string>
): readonly SavedListRow[] {
  const rows: SavedListRow[] = [];

  if (savedSessions.length > 0) {
    rows.push({ key: 'saved-heading', title: 'Saved practices', type: 'section-heading' });
    savedSessions.forEach((session) => {
      rows.push({ isSaved: true, key: `saved-${session.id}`, session, type: 'session' });
    });
  }

  if (recentSessions.length > 0) {
    rows.push({
      key: 'recent-heading',
      spacingBefore: savedSessions.length > 0 ? 'xl' : undefined,
      title: 'Recent activity',
      type: 'section-heading',
    });
    recentSessions.forEach((session) => {
      rows.push({
        isSaved: savedSessionIds.has(session.id),
        key: `recent-${session.id}`,
        session,
        type: 'session',
      });
    });
  }

  return rows;
}

function getSavedRowKey(row: SavedListRow): string {
  return row.key;
}

type SavedSessionRowProps = {
  readonly isSaved: boolean;
  readonly onOpenSession: (session: Session) => void;
  readonly onToggleSaved: (session: Session) => void;
  readonly session: Session;
};

const SavedSessionRow = memo(function SavedSessionRow({
  isSaved,
  onOpenSession,
  onToggleSaved,
  session,
}: SavedSessionRowProps): ReactElement {
  return (
    <View style={styles.sessionRow}>
      <SessionCard isSaved={isSaved} onPress={onOpenSession} onToggleSaved={onToggleSaved} session={session} />
    </View>
  );
});

type SummaryCardProps = {
  readonly label: string;
  readonly value: number;
};

function SummaryCard({ label, value }: SummaryCardProps): ReactElement {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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
  },
  spaceAfterHeader: {
    marginBottom: theme.spacing.xl,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
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
    fontSize: 36,
    letterSpacing: -1,
    lineHeight: 43,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xxs,
    padding: theme.spacing.lg,
  },
  summaryValue: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderRadius: theme.radius.full,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: 'center',
  },
  browseButton: {
    alignItems: 'center',
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  browseButtonText: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  sessionRow: {
    marginTop: theme.spacing.md,
  },
  spaceBeforeSection: {
    marginTop: theme.spacing.xl,
  },
});
