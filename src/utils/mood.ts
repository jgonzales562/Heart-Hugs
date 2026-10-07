const MOOD_DESCRIPTORS = [
  { label: 'Running on empty', max: 20, note: 'You can meet this moment gently.' },
  { label: 'Feeling low', max: 40, note: 'A small act of care can be enough.' },
  { label: 'In between', max: 60, note: 'Notice what is here without judgment.' },
  { label: 'Feeling good', max: 80, note: 'Let yourself take in what feels supportive.' },
  { label: 'Feeling bright', max: 100, note: 'Make room for this energy and warmth.' },
] as const;

export type MoodDescriptor = (typeof MOOD_DESCRIPTORS)[number];
export type MoodBand = 'bright' | 'good' | 'low' | 'middle' | 'very-low';

export type MoodLogGuard = {
  readonly release: () => void;
  readonly tryAcquire: () => boolean;
};

export function clampMoodValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 50;
}

export function normalizeMoodScore(value: number): number {
  return Math.round(clampMoodValue(value));
}

export function getMoodBand(value: number): MoodBand {
  const safeValue = normalizeMoodScore(value);

  if (safeValue <= 20) {
    return 'very-low';
  }

  if (safeValue <= 40) {
    return 'low';
  }

  if (safeValue <= 60) {
    return 'middle';
  }

  if (safeValue <= 80) {
    return 'good';
  }

  return 'bright';
}

export function getMoodDescriptor(value: number): MoodDescriptor {
  const safeValue = clampMoodValue(value);

  return (
    MOOD_DESCRIPTORS.find((descriptor) => safeValue <= descriptor.max) ??
    MOOD_DESCRIPTORS[MOOD_DESCRIPTORS.length - 1]
  );
}

export function getMoodValueFromPosition(
  pageX: number,
  trackLeft: number,
  trackWidth: number
): number {
  if (
    !Number.isFinite(pageX) ||
    !Number.isFinite(trackLeft) ||
    !Number.isFinite(trackWidth) ||
    trackWidth <= 0
  ) {
    return 50;
  }

  return clampMoodValue(((pageX - trackLeft) / trackWidth) * 100);
}

export function createMoodLogGuard(): MoodLogGuard {
  let isActive = false;

  return {
    release: () => {
      isActive = false;
    },
    tryAcquire: () => {
      if (isActive) {
        return false;
      }

      isActive = true;
      return true;
    },
  };
}

export function formatCheckInDateTime(
  recordedAt: string,
  referenceDate = new Date()
): string {
  const date = new Date(recordedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);

  const dayLabel = isSameCalendarDay(date, referenceDate)
    ? 'Today'
    : isSameCalendarDay(date, yesterday)
      ? 'Yesterday'
      : date.toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() === referenceDate.getFullYear() ? undefined : 'numeric',
        });
  const timeLabel = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${dayLabel} · ${timeLabel}`;
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
