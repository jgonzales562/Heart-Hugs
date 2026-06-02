import { Session } from '../types/session';

export const sessions: Session[] = [
  {
    id: 'morning-grounding',
    title: 'Morning Grounding',
    description: 'A steady breath and body scan for beginning the day with more ease.',
    durationMinutes: 8,
    category: 'Grounding',
    difficulty: 'Beginner',
    tags: ['body scan', 'morning', 'steadying'],
    benefits: ['settle the nervous system', 'start with clarity'],
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
    durationMinutes: 6,
    category: 'Stress Relief',
    difficulty: 'Beginner',
    tags: ['tension release', 'quick reset', 'body awareness'],
    benefits: ['ease physical stress', 'return to the present'],
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
    durationMinutes: 5,
    category: 'Breathwork',
    difficulty: 'Beginner',
    tags: ['paced breathing', 'visual cue', 'focus'],
    benefits: ['slow racing thoughts', 'support calmer breathing'],
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
    durationMinutes: 11,
    category: 'Self-Compassion',
    difficulty: 'Intermediate',
    tags: ['reflection', 'self-kindness', 'evening'],
    benefits: ['soften self-criticism', 'process difficult moments'],
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
    durationMinutes: 9,
    category: 'Sleep',
    difficulty: 'Beginner',
    tags: ['guided imagery', 'bedtime', 'unwinding'],
    benefits: ['prepare for rest', 'release the day'],
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
    durationMinutes: 7,
    category: 'Aftercare',
    difficulty: 'Intermediate',
    tags: ['aftercare', 'boundaries', 'emotional steadiness'],
    benefits: ['re-center after intensity', 'support emotional recovery'],
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
