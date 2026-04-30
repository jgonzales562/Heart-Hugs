export type MediaType = 'audio' | 'video';

export type Session = {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
};
