import { describe, expect, it } from '@jest/globals';

import { sessionRepository, validateSessionCatalog, wellnessNeeds } from '../sessionRepository';

describe('session repository', () => {
  it('accepts the bundled catalog', () => {
    expect(validateSessionCatalog(sessionRepository.getAll())).toEqual([]);
  });

  it('returns immutable-style lookups from a single catalog', () => {
    const firstSession = sessionRepository.getAll()[0];

    expect(sessionRepository.getById(firstSession.id)).toBe(firstSession);
  });

  it('exposes the requested practice filters', () => {
    expect(wellnessNeeds.map((need) => need.label)).toEqual([
      'Grounding',
      'Guided Imagery',
      'Mindfulness',
      'Supportive Postures',
      'Nature Sounds',
      'Shaking',
      'Gentle Stretching',
      'Breathwork',
      'Sound Bath',
      'Sensory Rituals',
      'Nature Walk',
      'Manifestation',
    ]);
  });

  it('rejects non-array and empty catalogs', () => {
    expect(validateSessionCatalog(null)).toEqual(['Session catalog must be an array.']);
    expect(validateSessionCatalog([])).toEqual([
      'Session catalog must include at least one session.',
      'Session catalog must include exactly one featured session.',
    ]);
  });

  it('reports malformed catalog fields without throwing', () => {
    const issues = validateSessionCatalog([
      null,
      {
        authorName: ' ',
        benefits: [],
        category: '',
        contentStatus: 'reviewed',
        description: '',
        durationMinutes: 0,
        id: 'Invalid id',
        isFeatured: false,
        mediaType: 'stream',
        mediaUrl: 'http://example.com/media.mp3',
        needIds: ['unknown', 'unknown'],
        reviewedAt: 'not-a-date',
        tags: [''],
        thumbnailUrl: 'not-a-url',
        title: '',
        transcript: ' ',
      },
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        'Session at index 0 must be an object.',
        'Invalid id must use a lowercase, hyphen-separated id.',
        'Invalid id is missing required display copy.',
        'Invalid id has an invalid duration.',
        'Invalid id has an unsupported media type.',
        'Invalid id must use HTTPS media and artwork URLs.',
        'Invalid id references an unknown wellness need.',
        'Invalid id contains duplicate wellness needs.',
        'Invalid id must include nonempty benefits and tags.',
        'Invalid id must include a valid review date and transcript before publication.',
        'Session catalog must include exactly one featured session.',
      ])
    );
  });

  it('rejects duplicate ids and multiple featured sessions', () => {
    const session = sessionRepository.getDefault();
    const issues = validateSessionCatalog([session, { ...session }]);

    expect(issues).toEqual(
      expect.arrayContaining([
        `Session id "${session.id}" is duplicated.`,
        'Session catalog must include exactly one featured session.',
      ])
    );
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
      'Starfish',
      'Falling Leaves in the River',
    ]);
    expect(titlesFor('mindfulness')).toEqual(['Body & Mind Connection']);
    expect(titlesFor('mood-elevating-positions')).toEqual([
      'Superhero Pose',
      'Heart Hugs',
      'Tree Hug',
    ]);
    expect(titlesFor('nature-sounds')).toEqual(['Water', 'Ocean', 'Rain']);
    expect(titlesFor('shaking')).toEqual(['Rhythmic Shake']);
    expect(titlesFor('gentle-stretching')).toEqual(["Let's Move"]);
    expect(titlesFor('breathworks')).toEqual([
      'Controlled',
      'Belly Breathing',
      'Fast-Slow Breathing',
    ]);
    expect(titlesFor('sound-bath')).toEqual([]);
    expect(titlesFor('natural-remedies')).toEqual([
      'Botanical Foot Soak',
      'Tea Time',
      'Barefoot Grass Walk',
    ]);
    expect(titlesFor('nature-walk')).toEqual(['Guided Meditation']);
    expect(titlesFor('manifestation')).toEqual(['Feminine Energy', 'Masculine Energy']);
    expect(sessionRepository.getAll()).toHaveLength(22);
  });
});
