import { describe, expect, it } from '@jest/globals';

import {
  initialWellnessState,
  parseWellnessState,
  recordMoodCheckIn,
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

  it('logs and hydrates mood check-ins locally', () => {
    const checkedIn = recordMoodCheckIn(
      initialWellnessState,
      73.6,
      '  I felt supported after talking with a friend.  ',
      new Date('2026-08-25T18:30:00.000Z')
    );
    const hydrated = parseWellnessState(JSON.stringify(checkedIn), []);

    expect(checkedIn.moodCheckIns[0]).toMatchObject({
      recordedAt: '2026-08-25T18:30:00.000Z',
      note: 'I felt supported after talking with a friend.',
      value: 74,
    });
    expect(hydrated.moodCheckIns).toEqual(checkedIn.moodCheckIns);
  });

  it('clamps mood values and keeps the newest check-in first', () => {
    const first = recordMoodCheckIn(
      initialWellnessState,
      -20,
      '',
      new Date('2026-08-25T18:00:00.000Z')
    );
    const second = recordMoodCheckIn(
      first,
      140,
      '',
      new Date('2026-08-25T19:00:00.000Z')
    );

    expect(second.moodCheckIns.map((checkIn) => checkIn.value)).toEqual([100, 0]);
  });
});
