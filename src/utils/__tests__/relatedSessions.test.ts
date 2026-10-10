import { describe, expect, it } from '@jest/globals';

import { sessionRepository } from '../../content/sessionRepository';
import type { Session, WellnessNeedId } from '../../types/session';
import { getRelatedSessions } from '../sessionDiscovery';

function createSession(id: string, needIds: readonly WellnessNeedId[]): Session {
  return { ...sessionRepository.getAll()[0], id, needIds };
}

const activeSession = createSession('active', ['grounding', 'mindfulness']);
const fallback = createSession('fallback', ['nature-sounds']);
const firstMatch = createSession('first-match', ['mindfulness']);
const secondMatch = createSession('second-match', ['grounding']);

describe('related sessions', () => {
  it('prioritizes shared needs while preserving catalog order within each group', () => {
    expect(getRelatedSessions([fallback, secondMatch, firstMatch], activeSession)).toEqual([
      secondMatch,
      firstMatch,
    ]);
  });

  it('fills available slots from the catalog after shared-need sessions', () => {
    expect(getRelatedSessions([fallback, firstMatch], activeSession)).toEqual([
      firstMatch,
      fallback,
    ]);
  });

  it('excludes the active id and deduplicates recommendations and fallback entries', () => {
    const secondFallback = createSession('second-fallback', ['breathworks']);

    expect(
      getRelatedSessions(
        [
          activeSession,
          { ...activeSession },
          fallback,
          firstMatch,
          { ...firstMatch },
          { ...fallback },
          secondFallback,
        ],
        activeSession,
        4
      )
    ).toEqual([firstMatch, fallback, secondFallback]);
  });

  it('returns only the available alternatives without modifying the input', () => {
    const sessions = Object.freeze([activeSession, firstMatch]);

    expect(getRelatedSessions(sessions, activeSession)).toEqual([firstMatch]);
    expect(getRelatedSessions([activeSession], activeSession)).toEqual([]);
    expect(getRelatedSessions([], activeSession)).toEqual([]);
  });

  it('returns no recommendations when the requested session is missing', () => {
    expect(getRelatedSessions([fallback, firstMatch], undefined)).toEqual([]);
  });

  it('honors a smaller explicit limit', () => {
    expect(getRelatedSessions([fallback, firstMatch, secondMatch], activeSession, 1)).toEqual([
      firstMatch,
    ]);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects an unusable limit of %s', (limit) => {
    expect(getRelatedSessions([firstMatch], activeSession, limit)).toEqual([]);
  });
});
