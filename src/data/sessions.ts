import type { Session } from '../types/session';

type SessionSeed = Pick<
  Session,
  | 'benefits'
  | 'category'
  | 'description'
  | 'id'
  | 'needIds'
  | 'tags'
  | 'title'
>;

const featuredSessionId = 'five-senses';
const prototypeDurationMinutes = 6;
const prototypeMediaUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const prototypeThumbnailUrl =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

const sessionSeeds = [
  {
    id: 'five-senses',
    title: 'Five Senses',
    description: 'A grounding check-in using what you can see, feel, hear, smell, and taste.',
    category: 'Grounding',
    tags: ['sensory awareness', 'present moment', 'grounding'],
    benefits: ['return to the present', 'engage the senses'],
    needIds: ['grounding'],
  },
  {
    id: 'happy-place',
    title: 'Happy Place',
    description: 'Imagine a safe, vivid place that brings ease to your body and mind.',
    category: 'Guided Imagery',
    tags: ['safe place', 'visualization', 'ease'],
    benefits: ['support a sense of safety', 'invite calm imagery'],
    needIds: ['guided-imagery'],
  },
  {
    id: 'star-fish',
    title: 'Starfish',
    description: 'Follow a gentle ocean visualization shaped by the five points of a starfish.',
    category: 'Guided Imagery',
    tags: ['ocean', 'starfish', 'visualization'],
    benefits: ['focus attention', 'settle into a steady rhythm'],
    needIds: ['guided-imagery'],
  },
  {
    id: 'falling-leaves-river',
    title: 'Falling Leaves in the River',
    description: 'Picture thoughts as leaves drifting downstream without needing to hold them.',
    category: 'Guided Imagery',
    tags: ['letting go', 'river', 'visualization'],
    benefits: ['create distance from thoughts', 'practice gentle release'],
    needIds: ['guided-imagery'],
  },
  {
    id: 'body-mind-connection',
    title: 'Body & Mind Connection',
    description: 'Notice how thoughts, breath, emotions, and body sensations move together.',
    category: 'Mindfulness',
    tags: ['body scan', 'awareness', 'mindfulness'],
    benefits: ['build body awareness', 'notice inner patterns'],
    needIds: ['mindfulness'],
  },
  {
    id: 'super-hero-pose',
    title: 'Superhero Pose',
    description: 'Explore an open, steady stance designed to help you feel present and capable.',
    category: 'Supportive Postures',
    tags: ['posture', 'confidence', 'movement'],
    benefits: ['encourage an open posture', 'invite energized attention'],
    needIds: ['mood-elevating-positions'],
  },
  {
    id: 'heart-hugs',
    title: 'Heart Hugs',
    description: 'Wrap your arms around yourself in a gentle posture of warmth and care.',
    category: 'Supportive Postures',
    tags: ['self-hug', 'comfort', 'posture'],
    benefits: ['practice self-kindness', 'create a comforting pause'],
    needIds: ['mood-elevating-positions'],
  },
  {
    id: 'tree-hug',
    title: 'Tree Hug',
    description: 'Connect with steadiness through a grounded, tree-inspired embrace.',
    category: 'Supportive Postures',
    tags: ['tree', 'connection', 'posture'],
    benefits: ['invite grounded energy', 'practice gentle connection'],
    needIds: ['mood-elevating-positions'],
  },
  {
    id: 'water',
    title: 'Water',
    description: 'Rest your attention on the soft movement, bubbles, and ripples of water.',
    category: 'Nature Sounds',
    tags: ['water', 'ripples', 'ambient sound'],
    benefits: ['create a quiet soundscape', 'support restful attention'],
    needIds: ['nature-sounds'],
  },
  {
    id: 'ocean',
    title: 'Ocean',
    description: 'Settle into the spacious rhythm of waves arriving and receding.',
    category: 'Nature Sounds',
    tags: ['ocean', 'waves', 'ambient sound'],
    benefits: ['follow a steady rhythm', 'invite a sense of spaciousness'],
    needIds: ['nature-sounds'],
  },
  {
    id: 'rain',
    title: 'Rain',
    description: 'Listen to a gentle rainfall atmosphere with soft puddle echoes.',
    category: 'Nature Sounds',
    tags: ['rain', 'puddles', 'ambient sound'],
    benefits: ['create a cozy pause', 'support quiet focus'],
    needIds: ['nature-sounds'],
  },
  {
    id: 'african-beats',
    title: 'Rhythmic Shake',
    description: 'Move with layered hand-percussion rhythms and let your body shake freely.',
    category: 'Shaking',
    tags: ['rhythm', 'percussion', 'shaking'],
    benefits: ['encourage free movement', 'release restless energy'],
    needIds: ['shaking'],
  },
  {
    id: 'lets-move',
    title: "Let's Move",
    description: 'Flow through approachable reaches and stretches at your own pace.',
    category: 'Gentle Stretching',
    tags: ['stretching', 'mobility', 'gentle movement'],
    benefits: ['create space in the body', 'invite comfortable movement'],
    needIds: ['gentle-stretching'],
  },
  {
    id: 'controlled',
    title: 'Controlled',
    description: 'Practice an even, intentional breathing rhythm with a steady visual pace.',
    category: 'Breathwork',
    tags: ['paced breathing', 'control', 'focus'],
    benefits: ['practice an even rhythm', 'support focused attention'],
    needIds: ['breathworks'],
  },
  {
    id: 'belly-breathing',
    title: 'Belly Breathing',
    description: 'Bring your attention to the gentle rise and fall of breath in the abdomen.',
    category: 'Breathwork',
    tags: ['diaphragmatic breathing', 'body awareness', 'breath'],
    benefits: ['notice abdominal movement', 'practice slower breathing'],
    needIds: ['breathworks'],
  },
  {
    id: 'fast-slow-breathing',
    title: 'Fast-Slow Breathing',
    description: 'Compare quicker and slower breath patterns while staying within your comfort.',
    category: 'Breathwork',
    tags: ['breath rhythm', 'contrast', 'regulation'],
    benefits: ['notice changing rhythms', 'build breath awareness'],
    needIds: ['breathworks'],
  },
  {
    id: 'foot-detox',
    title: 'Botanical Foot Soak',
    description: 'Create a warm botanical foot-soak ritual focused on rest and sensory care.',
    category: 'Sensory Rituals',
    tags: ['foot soak', 'botanicals', 'sensory ritual'],
    benefits: ['make space for rest', 'practice sensory care'],
    needIds: ['natural-remedies'],
  },
  {
    id: 'tea-time',
    title: 'Tea Time',
    description: 'Slow down with the warmth, aroma, and simple ritual of herbal tea.',
    category: 'Sensory Rituals',
    tags: ['tea', 'warmth', 'ritual'],
    benefits: ['engage the senses', 'create an intentional pause'],
    needIds: ['natural-remedies'],
  },
  {
    id: 'barefoot-grass-walk',
    title: 'Barefoot Grass Walk',
    description: 'Imagine each step through cool grass with attention to texture and contact.',
    category: 'Sensory Rituals',
    tags: ['grass', 'barefoot', 'sensory walk'],
    benefits: ['notice texture and movement', 'reconnect with the ground'],
    needIds: ['natural-remedies'],
  },
  {
    id: 'guided-meditation',
    title: 'Guided Meditation',
    description: 'Follow a calm path through desert trees, water, and distant mountains.',
    category: 'Nature Walk',
    tags: ['nature walk', 'meditation', 'desert'],
    benefits: ['imagine steady movement', 'connect with a natural landscape'],
    needIds: ['nature-walk'],
  },
  {
    id: 'feminine-energy',
    title: 'Feminine Energy',
    description: 'Reflect on receptive, intuitive, and flowing qualities within yourself.',
    category: 'Manifestation',
    tags: ['intention', 'feminine energy', 'reflection'],
    benefits: ['explore inner qualities', 'clarify an intention'],
    needIds: ['manifestation'],
  },
  {
    id: 'masculine-energy',
    title: 'Masculine Energy',
    description: 'Reflect on grounded, purposeful, and steady qualities within yourself.',
    category: 'Manifestation',
    tags: ['intention', 'masculine energy', 'reflection'],
    benefits: ['explore inner qualities', 'clarify an intention'],
    needIds: ['manifestation'],
  },
] satisfies readonly SessionSeed[];

export const sessionCatalog: readonly Session[] = sessionSeeds.map((seed) => ({
  ...seed,
  authorName: 'Heart Hugs',
  contentStatus: 'prototype',
  durationMinutes: prototypeDurationMinutes,
  isFeatured: seed.id === featuredSessionId,
  mediaType: 'audio',
  mediaUrl: prototypeMediaUrl,
  thumbnailUrl: prototypeThumbnailUrl,
}));
