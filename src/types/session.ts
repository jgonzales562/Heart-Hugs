type MediaType = 'audio' | 'video';

export const WELLNESS_NEED_IDS = [
  'grounding',
  'guided-imagery',
  'mindfulness',
  'mood-elevating-positions',
  'nature-sounds',
  'shaking',
  'gentle-stretching',
  'breathworks',
  'sound-bath',
  'natural-remedies',
  'nature-walk',
  'manifestation',
] as const;

export type WellnessNeedId = (typeof WELLNESS_NEED_IDS)[number];

type SessionReview =
  | {
      readonly contentStatus: 'prototype';
      readonly reviewedAt?: never;
      readonly transcript?: string;
    }
  | {
      readonly contentStatus: 'reviewed';
      readonly reviewedAt: string;
      readonly transcript: string;
    };

export type Session = {
  readonly authorName: string;
  readonly benefits: readonly string[];
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly category: string;
  readonly mediaType: MediaType;
  readonly mediaUrl: string;
  readonly needIds: readonly WellnessNeedId[];
  readonly thumbnailUrl: string;
  readonly isFeatured: boolean;
  readonly tags: readonly string[];
} & SessionReview;

export type WellnessNeed = {
  readonly description: string;
  readonly id: WellnessNeedId;
  readonly label: string;
};
