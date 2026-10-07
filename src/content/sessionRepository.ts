import { sessionCatalog } from '../data/sessions';
import type { Session, WellnessNeed, WellnessNeedId } from '../types/session';

const sessionIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const wellnessNeeds: readonly WellnessNeed[] = [
  {
    id: 'grounding',
    label: 'Grounding',
    description: 'Reconnect with your body and the present moment.',
  },
  {
    id: 'guided-imagery',
    label: 'Guided Imagery',
    description: 'Follow calming imagery into a more spacious inner landscape.',
  },
  {
    id: 'mindfulness',
    label: 'Mindfulness',
    description: 'Notice thoughts, feelings, and sensations without judgment.',
  },
  {
    id: 'mood-elevating-positions',
    label: 'Supportive Postures',
    description: 'Explore comfortable postures with attention to steadiness and ease.',
  },
  {
    id: 'nature-sounds',
    label: 'Nature Sounds',
    description: 'Settle into elemental soundscapes inspired by the natural world.',
  },
  {
    id: 'shaking',
    label: 'Shaking',
    description: 'Move with rhythm and notice how shaking feels in your body.',
  },
  {
    id: 'gentle-stretching',
    label: 'Gentle Stretching',
    description: 'Create a little more space through soft, accessible movement.',
  },
  {
    id: 'breathworks',
    label: 'Breathwork',
    description: 'Explore breathing rhythms while staying within your comfort.',
  },
  {
    id: 'sound-bath',
    label: 'Sound Bath',
    description: 'Rest into resonant tones and spacious vibration.',
  },
  {
    id: 'natural-remedies',
    label: 'Sensory Rituals',
    description: 'Slow down with simple sensory rituals inspired by the natural world.',
  },
  {
    id: 'nature-walk',
    label: 'Nature Walk',
    description: 'Move through an imagined landscape with calm attention.',
  },
  {
    id: 'manifestation',
    label: 'Manifestation',
    description: 'Connect with inner energy, intention, and possibility.',
  },
];

export type SessionRepository = {
  getAll(): readonly Session[];
  getById(sessionId: string): Session | undefined;
  getDefault(): Session;
};

export function validateSessionCatalog(catalog: unknown): readonly string[] {
  const issues: string[] = [];

  if (!Array.isArray(catalog)) {
    return ['Session catalog must be an array.'];
  }

  if (catalog.length === 0) {
    issues.push('Session catalog must include at least one session.');
  }

  const ids = new Set<string>();
  const knownNeeds: ReadonlySet<string> = new Set<WellnessNeedId>(
    wellnessNeeds.map((need) => need.id)
  );
  let featuredSessionCount = 0;

  catalog.forEach((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Session at index ${index} must be an object.`);
      return;
    }

    const id = isNonBlankString(value.id) ? value.id : '';
    const label = id || `Session at index ${index}`;

    if (!id) {
      issues.push(`Session at index ${index} is missing an id.`);
    } else {
      if (!sessionIdPattern.test(id)) {
        issues.push(`${label} must use a lowercase, hyphen-separated id.`);
      }

      if (ids.has(id)) {
        issues.push(`Session id "${id}" is duplicated.`);
      }

      ids.add(id);
    }

    if (
      !isNonBlankString(value.title) ||
      !isNonBlankString(value.description) ||
      !isNonBlankString(value.authorName) ||
      !isNonBlankString(value.category)
    ) {
      issues.push(`${label} is missing required display copy.`);
    }

    if (
      typeof value.durationMinutes !== 'number' ||
      !Number.isFinite(value.durationMinutes) ||
      value.durationMinutes <= 0
    ) {
      issues.push(`${label} has an invalid duration.`);
    }

    if (value.mediaType !== 'audio' && value.mediaType !== 'video') {
      issues.push(`${label} has an unsupported media type.`);
    }

    if (!isHttpsUrl(value.mediaUrl) || !isHttpsUrl(value.thumbnailUrl)) {
      issues.push(`${label} must use HTTPS media and artwork URLs.`);
    }

    if (!isNonEmptyStringArray(value.needIds)) {
      issues.push(`${label} must reference at least one known wellness need.`);
    } else {
      if (value.needIds.some((needId) => !knownNeeds.has(needId))) {
        issues.push(`${label} references an unknown wellness need.`);
      }

      if (new Set(value.needIds).size !== value.needIds.length) {
        issues.push(`${label} contains duplicate wellness needs.`);
      }
    }

    if (!isNonEmptyStringArray(value.benefits) || !isNonEmptyStringArray(value.tags)) {
      issues.push(`${label} must include nonempty benefits and tags.`);
    }

    if (typeof value.isFeatured !== 'boolean') {
      issues.push(`${label} must declare whether it is featured.`);
    } else if (value.isFeatured) {
      featuredSessionCount += 1;
    }

    if (value.contentStatus !== 'prototype' && value.contentStatus !== 'reviewed') {
      issues.push(`${label} has an unsupported content status.`);
    } else if (value.contentStatus === 'reviewed') {
      if (!isValidDate(value.reviewedAt) || !isNonBlankString(value.transcript)) {
        issues.push(`${label} must include a valid review date and transcript before publication.`);
      }
    } else {
      if (value.reviewedAt !== undefined) {
        issues.push(`${label} cannot include a review date while marked as prototype content.`);
      }

      if (value.transcript !== undefined && !isNonBlankString(value.transcript)) {
        issues.push(`${label} has an invalid prototype transcript.`);
      }
    }
  });

  if (featuredSessionCount !== 1) {
    issues.push('Session catalog must include exactly one featured session.');
  }

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonBlankString);
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isHttpsUrl(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

const validationIssues = validateSessionCatalog(sessionCatalog);

if (validationIssues.length > 0) {
  throw new Error(`Invalid Heart Hugs content catalog:\n${validationIssues.join('\n')}`);
}

const sessionsById = new Map(sessionCatalog.map((session) => [session.id, session]));
const defaultSession = sessionCatalog.find((session) => session.isFeatured);

if (!defaultSession) {
  throw new Error('Heart Hugs requires one featured catalog session.');
}

export const sessionRepository: SessionRepository = {
  getAll: () => sessionCatalog,
  getById: (sessionId) => sessionsById.get(sessionId),
  getDefault: () => defaultSession,
};
