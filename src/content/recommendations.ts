import { DurationPreference, sessionRepository } from './sessionRepository';
import { Session, WellnessNeedId } from '../types/session';

export type RecommendationPreferences = {
  durationMinutes: DurationPreference;
  needId: WellnessNeedId;
};

export function recommendSessions(
  preferences: RecommendationPreferences,
  catalog: readonly Session[] = sessionRepository.getAll()
) {
  const sessionsWithinAvailableTime =
    preferences.durationMinutes === null
      ? catalog
      : catalog.filter((session) => session.durationMinutes <= preferences.durationMinutes!);
  const eligibleSessions =
    sessionsWithinAvailableTime.length > 0 ? sessionsWithinAvailableTime : catalog;

  return [...eligibleSessions].sort(
    (left, right) => scoreSession(right, preferences) - scoreSession(left, preferences)
  );
}

export function scoreSession(session: Session, preferences: RecommendationPreferences) {
  const needScore = session.needIds.includes(preferences.needId) ? 100 : 0;
  const featuredScore = session.isFeatured ? 3 : 0;

  if (preferences.durationMinutes === null) {
    return needScore + featuredScore;
  }

  const difference = Math.abs(session.durationMinutes - preferences.durationMinutes);
  const fitsAvailableTime = session.durationMinutes <= preferences.durationMinutes;
  const durationScore = Math.max(0, 30 - difference * 3) + (fitsAvailableTime ? 12 : 0);

  return needScore + durationScore + featuredScore;
}
