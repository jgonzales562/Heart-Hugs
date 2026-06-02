export type MediaType = 'audio' | 'video';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type Session = {
  benefits: string[];
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  category: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  tags: string[];
};
