import { Session } from '../types/session';

export const sessions: Session[] = [
  {
    id: 'morning-grounding',
    title: 'Morning Grounding',
    description: 'A steady breath and body scan for beginning the day with more ease.',
    duration: '8 min',
    category: 'Grounding',
    mediaType: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=900&q=80',
    isFeatured: true,
  },
  {
    id: 'soft-reset',
    title: 'Soft Reset',
    description: 'A brief check-in for releasing tension through the shoulders and jaw.',
    duration: '6 min',
    category: 'Stress Relief',
    mediaType: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    isFeatured: false,
  },
  {
    id: 'visual-breathing',
    title: 'Visual Breathing',
    description: 'A quiet visual pace-setter for inhaling, pausing, and exhaling slowly.',
    duration: '5 min',
    category: 'Breathwork',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    isFeatured: true,
  },
  {
    id: 'evening-compassion',
    title: 'Evening Compassion',
    description: 'A gentle reflection for meeting hard moments without self-criticism.',
    duration: '11 min',
    category: 'Self-Compassion',
    mediaType: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80',
    isFeatured: false,
  },
  {
    id: 'restful-imagery',
    title: 'Restful Imagery',
    description: 'A soothing visual session for settling the nervous system before rest.',
    duration: '9 min',
    category: 'Sleep',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    isFeatured: false,
  },
  {
    id: 'steady-aftercare',
    title: 'Steady Aftercare',
    description: 'A grounding practice for the hour after a tender conversation.',
    duration: '7 min',
    category: 'Aftercare',
    mediaType: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    isFeatured: false,
  },
];

export const categories = ['All', ...Array.from(new Set(sessions.map((session) => session.category)))];

export function getSessionById(sessionId?: string) {
  return sessions.find((session) => session.id === sessionId);
}

export function getDefaultSession() {
  return sessions.find((session) => session.isFeatured) ?? sessions[0];
}
