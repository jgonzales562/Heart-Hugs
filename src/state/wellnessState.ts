import { DurationPreference } from '../content/sessionRepository';
import { WellnessNeedId } from '../types/session';

export const WELLNESS_STATE_VERSION = 1;

export type SessionActivity = {
  completionCount: number;
  durationSeconds: number;
  lastCompletedAt?: string;
  lastPlayedAt: string;
  positionSeconds: number;
};

export type WellnessState = {
  activityBySessionId: Record<string, SessionActivity>;
  durationPreference: DurationPreference;
  needPreference: WellnessNeedId;
  savedSessionIds: string[];
  version: typeof WELLNESS_STATE_VERSION;
};

export const initialWellnessState: WellnessState = {
  activityBySessionId: {},
  durationPreference: 10,
  needPreference: 'calm',
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

    if (!isObject(value) || value.version !== WELLNESS_STATE_VERSION) {
      return initialWellnessState;
    }

    const validIds = new Set(validSessionIds);
    const savedSessionIds = Array.isArray(value.savedSessionIds)
      ? value.savedSessionIds.filter(
          (sessionId): sessionId is string =>
            typeof sessionId === 'string' && validIds.has(sessionId)
        )
      : [];
    const activityBySessionId = parseActivity(value.activityBySessionId, validIds);
    const needPreference = isNeedId(value.needPreference) ? value.needPreference : 'calm';
    const durationPreference = isDurationPreference(value.durationPreference)
      ? value.durationPreference
      : 10;

    return {
      activityBySessionId,
      durationPreference,
      needPreference,
      savedSessionIds: Array.from(new Set(savedSessionIds)),
      version: WELLNESS_STATE_VERSION,
    };
  } catch {
    return initialWellnessState;
  }
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
        lastCompletedAt: existingActivity?.lastCompletedAt,
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
  const safeDuration = finitePositive(durationSeconds);
  const safePosition = Math.min(finitePositive(positionSeconds), safeDuration || Number.MAX_VALUE);
  const resumablePosition = safeDuration > 0 && safePosition >= safeDuration - 1 ? 0 : safePosition;

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
        lastCompletedAt: existingActivity?.lastCompletedAt,
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

  return {
    ...state,
    activityBySessionId: {
      ...state.activityBySessionId,
      [sessionId]: {
        completionCount: (existingActivity?.completionCount ?? 0) + 1,
        durationSeconds: existingActivity?.durationSeconds ?? 0,
        lastCompletedAt: occurredAt.toISOString(),
        lastPlayedAt: occurredAt.toISOString(),
        positionSeconds: 0,
      },
    },
  };
}

function parseActivity(value: unknown, validIds: Set<string>) {
  if (!isObject(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, SessionActivity>>((activity, [sessionId, entry]) => {
    if (!validIds.has(sessionId) || !isObject(entry) || typeof entry.lastPlayedAt !== 'string') {
      return activity;
    }

    const lastPlayedAt = Date.parse(entry.lastPlayedAt);

    if (Number.isNaN(lastPlayedAt)) {
      return activity;
    }

    activity[sessionId] = {
      completionCount: finitePositive(entry.completionCount),
      durationSeconds: finitePositive(entry.durationSeconds),
      lastCompletedAt:
        typeof entry.lastCompletedAt === 'string' && !Number.isNaN(Date.parse(entry.lastCompletedAt))
          ? entry.lastCompletedAt
          : undefined,
      lastPlayedAt: entry.lastPlayedAt,
      positionSeconds: finitePositive(entry.positionSeconds),
    };

    return activity;
  }, {});
}

function isDurationPreference(value: unknown): value is DurationPreference {
  return value === null || value === 5 || value === 10 || value === 15;
}

function isNeedId(value: unknown): value is WellnessNeedId {
  return (
    value === 'calm' ||
    value === 'grounding' ||
    value === 'recovery' ||
    value === 'self-compassion' ||
    value === 'sleep'
  );
}

function finitePositive(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
