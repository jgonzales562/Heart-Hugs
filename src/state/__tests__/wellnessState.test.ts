import { describe, expect, it } from '@jest/globals';

import {
  initialWellnessState,
  parseWellnessState,
  recordPlaybackProgress,
  recordSessionCompleted,
  recordSessionOpened,
  toggleSavedSession,
} from '../wellnessState';

describe('wellness state', () => {
  it('filters unknown sessions while hydrating saved state', () => {
    const parsed = parseWellnessState(
      JSON.stringify({
        ...initialWellnessState,
        savedSessionIds: ['known', 'missing'],
      }),
      ['known']
    );

    expect(parsed.savedSessionIds).toEqual(['known']);
  });

  it('toggles saved sessions without duplicates', () => {
    const saved = toggleSavedSession(initialWellnessState, 'session-one');
    const unsaved = toggleSavedSession(saved, 'session-one');

    expect(saved.savedSessionIds).toEqual(['session-one']);
    expect(unsaved.savedSessionIds).toEqual([]);
  });

  it('records resumable progress and completion history', () => {
    const opened = recordSessionOpened(
      initialWellnessState,
      'session-one',
      new Date('2026-08-05T12:00:00.000Z')
    );
    const progressed = recordPlaybackProgress(opened, 'session-one', 42, 120);
    const completed = recordSessionCompleted(
      progressed,
      'session-one',
      new Date('2026-08-05T12:02:00.000Z')
    );

    expect(progressed.activityBySessionId['session-one'].positionSeconds).toBe(42);
    expect(completed.activityBySessionId['session-one']).toMatchObject({
      completionCount: 1,
      positionSeconds: 0,
    });
  });
});
