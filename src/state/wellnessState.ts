import { WELLNESS_NEED_IDS } from '../types/session';
import type { WellnessNeedId } from '../types/session';
import { clampMoodValue } from '../utils/mood';

const LEGACY_WELLNESS_STATE_VERSION = 1;
const MAX_MOOD_CHECK_INS = 100;
const defaultNeedPreference: WellnessNeedId = 'grounding';
const wellnessNeedIds: ReadonlySet<unknown> = new Set(WELLNESS_NEED_IDS);

export const WELLNESS_STATE_VERSION = 2;

export type SessionActivity = {
  readonly completionCount: number;
  readonly durationSeconds: number;
  readonly lastCompletedAt?: string;
  readonly lastPlayedAt: string;
  readonly positionSeconds: number;
};

export type MoodCheckIn = {
  readonly id: string;
  readonly recordedAt: string;
  readonly value: number;
};

export type WellnessState = {
  readonly activityBySessionId: Readonly<Record<string, SessionActivity>>;
  readonly moodCheckIns: readonly MoodCheckIn[];
  readonly needPreference: WellnessNeedId;
  readonly savedSessionIds: readonly string[];
  readonly version: typeof WELLNESS_STATE_VERSION;
};

export const initialWellnessState: WellnessState = {
  activityBySessionId: {},
  moodCheckIns: [],
  needPreference: defaultNeedPreference,
  savedSessionIds: [],
  version: WELLNESS_STATE_VERSION,
};

export function parseWellnessState(
  rawValue: string | null,
  validSessionIds: readonly string[]
): WellnessState {
  if (!rawValue) {
    return initialWellnessState;
  }

  try {
    const value: unknown = JSON.parse(rawValue);

    if (
      !isObject(value) ||
      (value.version !== LEGACY_WELLNESS_STATE_VERSION &&
        value.version !== WELLNESS_STATE_VERSION)
    ) {
      return initialWellnessState;
    }

    const validIds: ReadonlySet<string> = new Set(validSessionIds);
    const savedSessionIds = Array.isArray(value.savedSessionIds)
      ? value.savedSessionIds.filter(
          (sessionId): sessionId is string =>
            typeof sessionId === 'string' && validIds.has(sessionId)
        )
      : [];

    return {
      activityBySessionId: parseActivity(value.activityBySessionId, validIds),
      moodCheckIns: parseMoodCheckIns(value.moodCheckIns),
      needPreference: isNeedId(value.needPreference)
        ? value.needPreference
        : defaultNeedPreference,
      savedSessionIds: Array.from(new Set(savedSessionIds)),
      version: WELLNESS_STATE_VERSION,
    };
  } catch {
    return initialWellnessState;
  }
}

export function recordMoodCheckIn(
  state: WellnessState,
  value: number,
  occurredAt = new Date()
): WellnessState {
  const recordedAt = occurredAt.toISOString();
  const safeValue = Math.round(clampMoodValue(value));
  const moodCheckIn: MoodCheckIn = {
    id: createMoodCheckInId(state.moodCheckIns, recordedAt, safeValue),
    recordedAt,
    value: safeValue,
  };

  return {
    ...state,
    moodCheckIns: [moodCheckIn, ...state.moodCheckIns].slice(0, MAX_MOOD_CHECK_INS),
  };
}

export function isSessionResumable(
  activity: Pick<SessionActivity, 'durationSeconds' | 'positionSeconds'> | undefined
) {
  if (!activity) {
    return false;
  }

  const position = toNonNegativeFinite(activity.positionSeconds);
  const duration = toNonNegativeFinite(activity.durationSeconds);

  return position > 0 && (duration === 0 || position < duration);
}

export function toggleSavedSession(state: WellnessState, sessionId: string): WellnessState {
  const isSaved = state.savedSessionIds.includes(sessionId);

  return {
    ...state,
    savedSessionIds: isSaved
      ? state.savedSessionIds.filter((savedId) => savedId !== sessionId)
      : [sessionId, ...state.savedSessionIds],
  };
}

export function recordSessionOpened(
  state: WellnessState,
  sessionId: string,
  occurredAt = new Date()
): WellnessState {
  const existingActivity = state.activityBySessionId[sessionId];

  return {
    ...state,
    activityBySessionId: {
      ...state.activityBySessionId,
      [sessionId]: {
        completionCount: existingActivity?.completionCount ?? 0,
        durationSeconds: existingActivity?.durationSeconds ?? 0,
        ...(existingActivity?.lastCompletedAt
          ? { lastCompletedAt: existingActivity.lastCompletedAt }
          : {}),
        lastPlayedAt: occurredAt.toISOString(),
        positionSeconds: existingActivity?.positionSeconds ?? 0,
      },
    },
  };
}

export function recordPlaybackProgress(
  state: WellnessState,
  sessionId: string,
  positionSeconds: number,
  durationSeconds: number
): WellnessState {
  const existingActivity = state.activityBySessionId[sessionId];
  const safeDuration = toNonNegativeFinite(durationSeconds);
  const resumablePosition = normalizePlaybackPosition(positionSeconds, safeDuration);

  if (
    existingActivity &&
    Math.abs(existingActivity.positionSeconds - resumablePosition) < 2 &&
    Math.abs(existingActivity.durationSeconds - safeDuration) < 1
  ) {
    return state;
  }

  return {
    ...state,
    activityBySessionId: {
      ...state.activityBySessionId,
      [sessionId]: {
        completionCount: existingActivity?.completionCount ?? 0,
        durationSeconds: safeDuration,
        ...(existingActivity?.lastCompletedAt
          ? { lastCompletedAt: existingActivity.lastCompletedAt }
          : {}),
        lastPlayedAt: existingActivity?.lastPlayedAt ?? new Date().toISOString(),
        positionSeconds: resumablePosition,
      },
    },
  };
}

export function recordSessionCompleted(
  state: WellnessState,
  sessionId: string,
  occurredAt = new Date()
): WellnessState {
  const existingActivity = state.activityBySessionId[sessionId];
  const completedAt = occurredAt.toISOString();

  return {
    ...state,
    activityBySessionId: {
      ...state.activityBySessionId,
      [sessionId]: {
        completionCount: toNonNegativeInteger(existingActivity?.completionCount) + 1,
        durationSeconds: existingActivity?.durationSeconds ?? 0,
        lastCompletedAt: completedAt,
        lastPlayedAt: completedAt,
        positionSeconds: 0,
      },
    },
  };
}

function parseActivity(
  value: unknown,
  validIds: ReadonlySet<string>
): Record<string, SessionActivity> {
  if (!isObject(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, SessionActivity>>(
    (activity, [sessionId, entry]) => {
      if (!validIds.has(sessionId) || !isObject(entry) || !isValidDate(entry.lastPlayedAt)) {
        return activity;
      }

      const durationSeconds = toNonNegativeFinite(entry.durationSeconds);
      const lastCompletedAt = isValidDate(entry.lastCompletedAt)
        ? entry.lastCompletedAt
        : undefined;

      activity[sessionId] = {
        completionCount: toNonNegativeInteger(entry.completionCount),
        durationSeconds,
        ...(lastCompletedAt ? { lastCompletedAt } : {}),
        lastPlayedAt: entry.lastPlayedAt,
        positionSeconds: normalizePlaybackPosition(entry.positionSeconds, durationSeconds),
      };

      return activity;
    },
    {}
  );
}

function parseMoodCheckIns(value: unknown): readonly MoodCheckIn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const checkIns: MoodCheckIn[] = [];

  value.forEach((entry) => {
    if (
      !isObject(entry) ||
      !isNonBlankString(entry.id) ||
      !isValidDate(entry.recordedAt) ||
      typeof entry.value !== 'number' ||
      !Number.isFinite(entry.value) ||
      entry.value < 0 ||
      entry.value > 100
    ) {
      return;
    }

    checkIns.push({
      id: entry.id,
      recordedAt: entry.recordedAt,
      value: Math.round(entry.value),
    });
  });

  const seenIds = new Set<string>();

  return checkIns
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))
    .filter((checkIn) => {
      if (seenIds.has(checkIn.id)) {
        return false;
      }

      seenIds.add(checkIn.id);
      return true;
    })
    .slice(0, MAX_MOOD_CHECK_INS);
}

function createMoodCheckInId(
  checkIns: readonly MoodCheckIn[],
  recordedAt: string,
  value: number
) {
  const baseId = `${recordedAt}-${value}`;
  const existingIds = new Set(checkIns.map((checkIn) => checkIn.id));

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;

  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

function normalizePlaybackPosition(value: unknown, durationSeconds: number) {
  const positionSeconds = Math.min(
    toNonNegativeFinite(value),
    durationSeconds || Number.MAX_VALUE
  );

  return durationSeconds > 0 && positionSeconds >= durationSeconds - 1 ? 0 : positionSeconds;
}

function isNeedId(value: unknown): value is WellnessNeedId {
  return wellnessNeedIds.has(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function toNonNegativeFinite(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function toNonNegativeInteger(value: unknown) {
  return Math.floor(toNonNegativeFinite(value));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
