import { describe, expect, it } from '@jest/globals';

import {
  WELLNESS_STATE_VERSION,
  initialWellnessState,
  isSessionResumable,
  parseWellnessState,
  recordMoodCheckIn,
  recordPlaybackProgress,
  recordSessionCompleted,
  recordSessionOpened,
  toggleSavedSession,
  type SessionActivity,
  type WellnessState,
} from '../wellnessState';

function getActivity(state: WellnessState, sessionId: string): SessionActivity {
  const activity = state.activityBySessionId[sessionId];

  if (!activity) {
    throw new Error(`Expected activity for ${sessionId}.`);
  }

  return activity;
}

describe('wellness state', () => {
  it('filters unknown and duplicate sessions while hydrating saved state', () => {
    const parsed = parseWellnessState(
      JSON.stringify({
        ...initialWellnessState,
        savedSessionIds: ['known', 'missing', 'known'],
      }),
      ['known']
    );

    expect(parsed.savedSessionIds).toEqual(['known']);
  });

  it('migrates version-one state while discarding free-form reflections', () => {
    const parsed = parseWellnessState(
      JSON.stringify({
        activityBySessionId: {},
        moodCheckIns: [
          {
            id: 'legacy-check-in',
            note: 'Sensitive legacy reflection',
            recordedAt: '2026-08-25T18:30:00.000Z',
            value: 74,
          },
        ],
        needPreference: 'sound-bath',
        savedSessionIds: ['known'],
        version: 1,
      }),
      ['known']
    );

    expect(parsed).toMatchObject({
      needPreference: 'sound-bath',
      savedSessionIds: ['known'],
      version: WELLNESS_STATE_VERSION,
    });
    expect(parsed.moodCheckIns).toEqual([
      {
        id: 'legacy-check-in',
        recordedAt: '2026-08-25T18:30:00.000Z',
        value: 74,
      },
    ]);
  });

  it('rejects unknown state versions', () => {
    expect(parseWellnessState(JSON.stringify({ version: 999 }), [])).toBe(
      initialWellnessState
    );
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
    const progressedActivity = getActivity(progressed, 'session-one');
    const completedActivity = getActivity(completed, 'session-one');

    expect(progressedActivity.positionSeconds).toBe(42);
    expect(completedActivity).toMatchObject({ completionCount: 1, positionSeconds: 0 });
    expect(isSessionResumable(progressedActivity)).toBe(true);
    expect(isSessionResumable(completedActivity)).toBe(false);
  });

  it('normalizes malformed persisted activity', () => {
    const parsed = parseWellnessState(
      JSON.stringify({
        ...initialWellnessState,
        activityBySessionId: {
          known: {
            completionCount: 2.9,
            durationSeconds: 120,
            lastCompletedAt: 'not-a-date',
            lastPlayedAt: '2026-08-25T18:30:00.000Z',
            positionSeconds: 500,
          },
        },
      }),
      ['known']
    );
    const activity = getActivity(parsed, 'known');

    expect(activity).toEqual({
      completionCount: 2,
      durationSeconds: 120,
      lastPlayedAt: '2026-08-25T18:30:00.000Z',
      positionSeconds: 0,
    });
  });

  it('keeps any started unfinished session eligible to continue', () => {
    expect(isSessionResumable({ durationSeconds: 120, positionSeconds: 0.25 })).toBe(true);
    expect(isSessionResumable({ durationSeconds: 0, positionSeconds: 12 })).toBe(true);
    expect(isSessionResumable({ durationSeconds: 120, positionSeconds: 120 })).toBe(false);
  });

  it('clamps mood values and creates collision-safe check-in ids', () => {
    const recordedAt = new Date('2026-08-25T18:00:00.000Z');
    const first = recordMoodCheckIn(initialWellnessState, -20, recordedAt);
    const second = recordMoodCheckIn(first, -20, recordedAt);
    const third = recordMoodCheckIn(
      second,
      140,
      new Date('2026-08-25T19:00:00.000Z')
    );

    expect(third.moodCheckIns.map((checkIn) => checkIn.value)).toEqual([100, 0, 0]);
    expect(new Set(third.moodCheckIns.map((checkIn) => checkIn.id)).size).toBe(3);
  });

  it('sorts hydrated check-ins newest-first and removes duplicate ids', () => {
    const parsed = parseWellnessState(
      JSON.stringify({
        ...initialWellnessState,
        moodCheckIns: [
          { id: 'duplicate', recordedAt: '2026-08-25T17:00:00.000Z', value: 10 },
          { id: 'other', recordedAt: '2026-08-25T18:00:00.000Z', value: 50 },
          { id: 'duplicate', recordedAt: '2026-08-25T19:00:00.000Z', value: 90 },
        ],
      }),
      []
    );

    expect(parsed.moodCheckIns.map(({ id, value }) => ({ id, value }))).toEqual([
      { id: 'duplicate', value: 90 },
      { id: 'other', value: 50 },
    ]);
  });

  it('retains only the 100 newest hydrated check-ins', () => {
    const moodCheckIns = Array.from({ length: 105 }, (_, index) => ({
      id: `check-in-${index}`,
      recordedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
      value: 50,
    }));
    const parsed = parseWellnessState(
      JSON.stringify({ ...initialWellnessState, moodCheckIns }),
      []
    );

    expect(parsed.moodCheckIns).toHaveLength(100);
    expect(parsed.moodCheckIns[0]?.id).toBe('check-in-104');
    expect(parsed.moodCheckIns.at(-1)?.id).toBe('check-in-5');
  });
});
