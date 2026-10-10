import { describe, expect, it } from '@jest/globals';

import { sessionRepository } from '../../content/sessionRepository';
import { initialWellnessState, parseWellnessState, type SessionActivity } from '../../state/wellnessState';
import { getHomeSessionCollections, getSavedSessions, getSessionActivitySummary } from '../sessionDiscovery';

function createActivity(
  lastPlayedAt: string,
  positionSeconds: number,
  durationSeconds = 360
): SessionActivity {
  return {
    completionCount: 0,
    durationSeconds,
    lastPlayedAt,
    positionSeconds,
  };
}

describe('home session discovery', () => {
  it('partitions recommendations from the rest of the catalog', () => {
    const sessions = sessionRepository.getAll();
    const result = getHomeSessionCollections(
      sessions,
      'guided-imagery',
      {},
      sessionRepository.getById
    );

    expect(result.recommendations.map(({ id }) => id)).toEqual([
      'happy-place',
      'star-fish',
      'falling-leaves-river',
    ]);
    expect(result.remainingSessions).toHaveLength(sessions.length - 3);
    expect(
      result.remainingSessions.some(({ id }) =>
        result.recommendations.some((recommendation) => recommendation.id === id)
      )
    ).toBe(false);
  });

  it('orders recent sessions and ignores activity for missing catalog entries', () => {
    const activityBySessionId = {
      'five-senses': createActivity('2026-08-27T10:00:00.000Z', 0),
      'happy-place': createActivity('2026-08-28T10:00:00.000Z', 0),
      missing: createActivity('2026-08-29T10:00:00.000Z', 0),
    };
    const result = getHomeSessionCollections(
      sessionRepository.getAll(),
      'grounding',
      activityBySessionId,
      sessionRepository.getById,
      1
    );

    expect(result.recentSessions.map(({ id }) => id)).toEqual(['happy-place']);
  });

  it('selects the most recently played resumable session with its activity', () => {
    const activityBySessionId = {
      'five-senses': createActivity('2026-08-27T10:00:00.000Z', 45),
      'happy-place': createActivity('2026-08-28T10:00:00.000Z', 0),
      'star-fish': createActivity('2026-08-29T10:00:00.000Z', 120),
    };
    const result = getHomeSessionCollections(
      sessionRepository.getAll(),
      'grounding',
      activityBySessionId,
      sessionRepository.getById
    );

    expect(result.continueSession?.session.id).toBe('star-fish');
    expect(result.continueSession?.activity).toBe(activityBySessionId['star-fish']);
  });

  it('omits a continue session when all known activity is complete or unstarted', () => {
    const result = getHomeSessionCollections(
      sessionRepository.getAll(),
      'grounding',
      {
        'five-senses': createActivity('2026-08-27T10:00:00.000Z', 0),
        'happy-place': createActivity('2026-08-28T10:00:00.000Z', 360),
      },
      sessionRepository.getById
    );

    expect(result.continueSession).toBeUndefined();
  });

  it('orders recent and resumable sessions chronologically across accepted timezone offsets', () => {
    const sessions = sessionRepository.getAll();
    const state = parseWellnessState(
      JSON.stringify({
        ...initialWellnessState,
        activityBySessionId: {
          'five-senses': createActivity('2026-10-08T08:30:00-07:00', 45),
          'happy-place': createActivity('2026-10-08T14:00:00.000Z', 120),
        },
      }),
      sessions.map(({ id }) => id)
    );
    const result = getHomeSessionCollections(
      sessions,
      'grounding',
      state.activityBySessionId,
      sessionRepository.getById
    );

    expect(result.recentSessions.map(({ id }) => id)).toEqual(['five-senses', 'happy-place']);
    expect(result.continueSession?.session.id).toBe('five-senses');
    expect(result.continueSession?.activity).toBe(state.activityBySessionId['five-senses']);
  });
});

describe('saved session discovery', () => {
  it('preserves saved order and skips missing catalog entries', () => {
    const ids = Object.freeze(['happy-place', 'missing', 'five-senses']);

    expect(getSavedSessions(ids, sessionRepository.getById).map(({ id }) => id)).toEqual([
      'happy-place',
      'five-senses',
    ]);
    expect(getSavedSessions([], sessionRepository.getById)).toEqual([]);
  });

  it('selects at most three known recent sessions in chronological order', () => {
    const activities = Object.freeze({
      missing: createActivity('2026-10-08T16:00:00.000Z', 0),
      'five-senses': createActivity('2026-10-08T08:30:00-07:00', 45),
      'happy-place': createActivity('2026-10-08T14:00:00.000Z', 120),
      'star-fish': createActivity('2026-10-08T13:00:00.000Z', 0),
      'body-mind-connection': createActivity('2026-10-08T12:00:00.000Z', 0),
    });
    const result = getSessionActivitySummary(activities, sessionRepository.getById);

    expect(result.recentSessions.map(({ id }) => id)).toEqual([
      'five-senses',
      'happy-place',
      'star-fish',
    ]);
  });

  it('counts repeated completions across all activity without requiring sessions to be saved', () => {
    const result = getSessionActivitySummary({
      'five-senses': { ...createActivity('2026-10-08T15:00:00.000Z', 0), completionCount: 3 },
      'happy-place': { ...createActivity('2026-10-08T14:00:00.000Z', 0), completionCount: 2 },
    }, sessionRepository.getById);

    expect(result.completionCount).toBe(5);
  });

  it('handles no activity and an explicit recent-session limit', () => {
    expect(getSessionActivitySummary({}, sessionRepository.getById)).toEqual({
      completionCount: 0,
      recentSessions: [],
    });
    const activities = { 'five-senses': createActivity('2026-10-08T15:00:00.000Z', 0) };

    expect(getSessionActivitySummary(activities, sessionRepository.getById, 0).recentSessions).toEqual([]);
    expect(getSessionActivitySummary(activities, sessionRepository.getById, 1).recentSessions).toHaveLength(1);
  });
});
