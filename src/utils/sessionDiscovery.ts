import { isSessionResumable, type SessionActivity } from '../state/wellnessState';
import type { Session, WellnessNeedId } from '../types/session';

type SessionLookup = (sessionId: string) => Session | undefined;

export function getRelatedSessions(
  sessions: readonly Session[],
  activeSession: Session | undefined,
  limit = 2
): readonly Session[] {
  const sessionLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;

  if (!activeSession || sessionLimit === 0) {
    return [];
  }

  const activeNeeds = new Set(activeSession.needIds);
  const seenSessionIds = new Set([activeSession.id]);
  const preferredSessions: Session[] = [];
  const fallbackSessions: Session[] = [];

  for (const session of sessions) {
    if (seenSessionIds.has(session.id)) {
      continue;
    }

    seenSessionIds.add(session.id);

    if (session.needIds.some((needId) => activeNeeds.has(needId))) {
      preferredSessions.push(session);
    } else {
      fallbackSessions.push(session);
    }
  }

  return [...preferredSessions, ...fallbackSessions].slice(0, sessionLimit);
}

export type ResumableSession = {
  readonly activity: SessionActivity;
  readonly session: Session;
};

export type SessionActivitySummary = {
  readonly completionCount: number;
  readonly recentSessions: readonly Session[];
};

export function getSavedSessions(
  savedSessionIds: readonly string[],
  getSessionById: SessionLookup
): readonly Session[] {
  return savedSessionIds.flatMap((sessionId) => {
    const session = getSessionById(sessionId);
    return session ? [session] : [];
  });
}

function getActivitySessions(
  activityBySessionId: Readonly<Record<string, SessionActivity>>,
  getSessionById: SessionLookup
): readonly ResumableSession[] {
  return Object.entries(activityBySessionId)
    .flatMap(([sessionId, activity]) => {
      const session = getSessionById(sessionId);
      return session ? [{ activity, session, playedAt: Date.parse(activity.lastPlayedAt) }] : [];
    })
    .sort((left, right) => right.playedAt - left.playedAt)
    .map(({ activity, session }) => ({ activity, session }));
}

export function getSessionActivitySummary(
  activityBySessionId: Readonly<Record<string, SessionActivity>>,
  getSessionById: SessionLookup,
  recentSessionLimit = 3
): SessionActivitySummary {
  return {
    completionCount: Object.values(activityBySessionId).reduce(
      (total, activity) => total + activity.completionCount,
      0
    ),
    recentSessions: getActivitySessions(activityBySessionId, getSessionById)
      .slice(0, Math.max(0, recentSessionLimit))
      .map(({ session }) => session),
  };
}

export type HomeSessionCollections = {
  readonly continueSession?: ResumableSession;
  readonly recentSessions: readonly Session[];
  readonly recommendations: readonly Session[];
  readonly remainingSessions: readonly Session[];
};

export function getHomeSessionCollections(
  sessions: readonly Session[],
  needId: WellnessNeedId,
  activityBySessionId: Readonly<Record<string, SessionActivity>>,
  getSessionById: SessionLookup,
  recentSessionLimit = 4
): HomeSessionCollections {
  const recommendations = sessions.filter((session) => session.needIds.includes(needId));
  const recommendedSessionIds = new Set(recommendations.map((session) => session.id));
  const activitySessions = getActivitySessions(activityBySessionId, getSessionById);

  return {
    continueSession: activitySessions.find(({ activity }) => isSessionResumable(activity)),
    recentSessions: activitySessions
      .slice(0, Math.max(0, recentSessionLimit))
      .map(({ session }) => session),
    recommendations,
    remainingSessions: sessions.filter((session) => !recommendedSessionIds.has(session.id)),
  };
}
