export type MediaType = 'audio' | 'video';
export type ContentStatus = 'prototype' | 'reviewed';
export type WellnessNeedId =
  | 'grounding'
  | 'guided-imagery'
  | 'mindfulness'
  | 'mood-elevating-positions'
  | 'nature-sounds'
  | 'shaking'
  | 'gentle-stretching'
  | 'breathworks'
  | 'sound-bath'
  | 'natural-remedies'
  | 'nature-walk'
  | 'manifestation';

export type Session = {
  authorName: string;
  benefits: string[];
  contentStatus: ContentStatus;
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: string;
  mediaType: MediaType;
  mediaUrl: string;
  needIds: WellnessNeedId[];
  reviewedAt?: string;
  thumbnailUrl: string;
  transcript?: string;
  isFeatured: boolean;
  tags: string[];
};

export type WellnessNeed = {
  description: string;
  id: WellnessNeedId;
  label: string;
};
