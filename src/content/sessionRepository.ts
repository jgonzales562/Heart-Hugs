import { sessionCatalog } from '../data/sessions';
import { Session, WellnessNeed, WellnessNeedId } from '../types/session';

export const wellnessNeeds: readonly WellnessNeed[] = [
  {
    id: 'calm',
    label: 'Calm my thoughts',
    description: 'Slow down and make a little more room to breathe.',
  },
  {
    id: 'grounding',
    label: 'Feel grounded',
    description: 'Reconnect with your body and the present moment.',
  },
  {
    id: 'recovery',
    label: 'Recover gently',
    description: 'Find steadiness after an intense or tender moment.',
  },
  {
    id: 'self-compassion',
    label: 'Be kinder to myself',
    description: 'Meet a difficult experience with less self-criticism.',
  },
  {
    id: 'sleep',
    label: 'Prepare for rest',
    description: 'Settle the day and ease toward sleep.',
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
