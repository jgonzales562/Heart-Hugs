import { describe, expect, it } from '@jest/globals';

import { recommendSessions } from '../recommendations';
import { sessionRepository, validateSessionCatalog } from '../sessionRepository';

describe('session repository', () => {
  it('accepts the bundled catalog', () => {
    expect(validateSessionCatalog(sessionRepository.getAll())).toEqual([]);
  });

  it('returns immutable-style lookups from a single catalog', () => {
    const firstSession = sessionRepository.getAll()[0];

    expect(sessionRepository.getById(firstSession.id)).toBe(firstSession);
    expect(sessionRepository.getCategories()[0]).toBe('All');
  });

  it('prioritizes the selected need and available time', () => {
    const recommendations = recommendSessions({ durationMinutes: 10, needId: 'sleep' });

    expect(recommendations[0].needIds).toContain('sleep');
    expect(recommendations[0].durationMinutes).toBeLessThanOrEqual(10);
  });

  it('does not recommend a session longer than the available time when one fits', () => {
    const recommendations = recommendSessions({ durationMinutes: 5, needId: 'recovery' });

    expect(recommendations[0].durationMinutes).toBeLessThanOrEqual(5);
  });
});
