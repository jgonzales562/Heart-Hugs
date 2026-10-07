import { describe, expect, it } from '@jest/globals';

import { sessionRepository } from '../../content/sessionRepository';
import type { SessionActivity } from '../../state/wellnessState';
import { getHomeSessionCollections } from '../sessionDiscovery';

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
});
