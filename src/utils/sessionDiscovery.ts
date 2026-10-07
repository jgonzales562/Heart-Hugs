import { isSessionResumable, type SessionActivity } from '../state/wellnessState';
import type { Session, WellnessNeedId } from '../types/session';

type SessionLookup = (sessionId: string) => Session | undefined;

export type ResumableSession = {
  readonly activity: SessionActivity;
  readonly session: Session;
};

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
  const activitySessions = Object.entries(activityBySessionId)
    .sort(([, left], [, right]) => right.lastPlayedAt.localeCompare(left.lastPlayedAt))
    .flatMap(([sessionId, activity]) => {
      const session = getSessionById(sessionId);
      return session ? [{ activity, session }] : [];
    });

  return {
    continueSession: activitySessions.find(({ activity }) => isSessionResumable(activity)),
    recentSessions: activitySessions
      .slice(0, Math.max(0, recentSessionLimit))
      .map(({ session }) => session),
    recommendations,
    remainingSessions: sessions.filter((session) => !recommendedSessionIds.has(session.id)),
  };
}
