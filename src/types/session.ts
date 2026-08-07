export type MediaType = 'audio' | 'video';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ContentStatus = 'prototype' | 'reviewed';
export type WellnessNeedId =
  | 'calm'
  | 'grounding'
  | 'recovery'
  | 'self-compassion'
  | 'sleep';

export type Session = {
  authorName: string;
  benefits: string[];
  contentStatus: ContentStatus;
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
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
