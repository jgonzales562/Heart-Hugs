import { describe, expect, it } from '@jest/globals';

import { recommendSessions } from '../recommendations';
import { sessionRepository, validateSessionCatalog, wellnessNeeds } from '../sessionRepository';

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
    const recommendations = recommendSessions({ durationMinutes: 10, needId: 'guided-imagery' });

    expect(recommendations[0].needIds).toContain('guided-imagery');
    expect(recommendations[0].durationMinutes).toBeLessThanOrEqual(10);
  });

  it('does not recommend a session longer than the available time when one fits', () => {
    const recommendations = recommendSessions({
      durationMinutes: 5,
      needId: 'breathworks',
    });

    expect(recommendations[0].durationMinutes).toBeLessThanOrEqual(5);
  });

  it('exposes the requested practice filters', () => {
    expect(wellnessNeeds.map((need) => need.label)).toEqual([
      'Grounding',
      'Guided Imagery',
      'Mindfulness',
      'Mood Elevating Positions',
      'Nature Sounds',
      'Shaking',
      'Gentle Stretching',
      'Breathworks',
      'Sound Bath',
      'Natural Remedies',
      'Nature Walk',
      'Manifestation',
    ]);
  });

  it('groups exactly the requested sessions under each filter', () => {
    const titlesFor = (needId: (typeof wellnessNeeds)[number]['id']) =>
      sessionRepository
        .getAll()
        .filter((session) => session.needIds.includes(needId))
        .map((session) => session.title);

    expect(titlesFor('grounding')).toEqual(['Five Senses']);
    expect(titlesFor('guided-imagery')).toEqual([
      'Happy Place',
      'Star Fish',
      'Falling Leaves In The River',
    ]);
    expect(titlesFor('mindfulness')).toEqual(['Body & Mind Connection']);
    expect(titlesFor('mood-elevating-positions')).toEqual([
      'Super Hero Pose',
      'Heart Hugs',
      'Tree Hug',
    ]);
    expect(titlesFor('nature-sounds')).toEqual(['Water', 'Ocean', 'Rain']);
    expect(titlesFor('shaking')).toEqual(['African Beats']);
    expect(titlesFor('gentle-stretching')).toEqual(["Let's Move"]);
    expect(titlesFor('breathworks')).toEqual([
      'Controlled',
      'Belly Breathing',
      'Fast-Slow Breathing',
    ]);
    expect(titlesFor('sound-bath')).toEqual([]);
    expect(titlesFor('natural-remedies')).toEqual([
      'Foot Detox',
      'Tea Time',
      'Barefoot Grass Walk',
    ]);
    expect(titlesFor('nature-walk')).toEqual(['Guided Meditation']);
    expect(titlesFor('manifestation')).toEqual(['Feminine Energy', 'Masculine Energy']);
    expect(sessionRepository.getAll()).toHaveLength(22);
  });
});
