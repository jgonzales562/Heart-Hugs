import { sessionCatalog } from '../data/sessions';
import { Session, WellnessNeed, WellnessNeedId } from '../types/session';

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
    label: 'Mood Elevating Positions',
    description: 'Explore supportive postures that encourage energy and emotional lift.',
  },
  {
    id: 'nature-sounds',
    label: 'Nature Sounds',
    description: 'Settle into elemental soundscapes inspired by the natural world.',
  },
  {
    id: 'shaking',
    label: 'Shaking',
    description: 'Move with rhythm and let stored energy travel through the body.',
  },
  {
    id: 'gentle-stretching',
    label: 'Gentle Stretching',
    description: 'Create a little more space through soft, accessible movement.',
  },
  {
    id: 'breathworks',
    label: 'Breathworks',
    description: 'Explore breathing rhythms that support focus and regulation.',
  },
  {
    id: 'sound-bath',
    label: 'Sound Bath',
    description: 'Rest into resonant tones and spacious vibration.',
  },
  {
    id: 'natural-remedies',
    label: 'Natural Remedies',
    description: 'Reconnect with simple sensory rituals inspired by the earth.',
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

export const durationOptions = [5, 10, 15] as const;

export type DurationPreference = (typeof durationOptions)[number] | null;

export type SessionRepository = {
  getAll(): readonly Session[];
  getById(sessionId?: string): Session | undefined;
  getCategories(): readonly string[];
  getDefault(): Session;
};

export function validateSessionCatalog(catalog: readonly Session[]) {
  const issues: string[] = [];
  const ids = new Set<string>();
  const knownNeeds = new Set<WellnessNeedId>(wellnessNeeds.map((need) => need.id));

  catalog.forEach((session, index) => {
    const label = session.id || `session at index ${index}`;

    if (!session.id.trim()) {
      issues.push(`Session at index ${index} is missing an id.`);
    } else if (ids.has(session.id)) {
      issues.push(`Session id "${session.id}" is duplicated.`);
    }

    ids.add(session.id);

    if (!session.title.trim() || !session.description.trim()) {
      issues.push(`${label} is missing required display copy.`);
    }

    if (!Number.isFinite(session.durationMinutes) || session.durationMinutes <= 0) {
      issues.push(`${label} has an invalid duration.`);
    }

    if (!isHttpsUrl(session.mediaUrl) || !isHttpsUrl(session.thumbnailUrl)) {
      issues.push(`${label} must use HTTPS media and artwork URLs.`);
    }

    if (session.needIds.length === 0 || session.needIds.some((needId) => !knownNeeds.has(needId))) {
      issues.push(`${label} must reference at least one known wellness need.`);
    }

    if (session.contentStatus === 'reviewed' && (!session.reviewedAt || !session.transcript)) {
      issues.push(`${label} must include a review date and transcript before publication.`);
    }
  });

  return issues;
}

function isHttpsUrl(value: string) {
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
const categories = ['All', ...Array.from(new Set(sessionCatalog.map((session) => session.category)))];

export const sessionRepository: SessionRepository = {
  getAll: () => sessionCatalog,
  getById: (sessionId) => (sessionId ? sessionsById.get(sessionId) : undefined),
  getCategories: () => categories,
  getDefault: () => {
    const defaultSession = sessionCatalog.find((session) => session.isFeatured) ?? sessionCatalog[0];

    if (!defaultSession) {
      throw new Error('Heart Hugs requires at least one published session.');
    }

    return defaultSession;
  },
};
