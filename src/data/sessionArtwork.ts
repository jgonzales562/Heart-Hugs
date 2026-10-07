import type { ImageSourcePropType } from 'react-native';

import type { Session } from '../types/session';

export const welcomeArtwork: ImageSourcePropType = require('../../assets/session-art/heart-hugs.jpg');

const artworkBySessionId: Readonly<Record<string, ImageSourcePropType>> = {
  'five-senses': require('../../assets/session-art/five-senses.jpg'),
  'happy-place': require('../../assets/session-art/happy-place.jpg'),
  'star-fish': require('../../assets/session-art/star-fish.jpg'),
  'falling-leaves-river': require('../../assets/session-art/falling-leaves-river.jpg'),
  'body-mind-connection': require('../../assets/session-art/body-mind-connection.jpg'),
  'super-hero-pose': require('../../assets/session-art/super-hero-pose.jpg'),
  'heart-hugs': welcomeArtwork,
  'tree-hug': require('../../assets/session-art/tree-hug.jpg'),
  water: require('../../assets/session-art/water.jpg'),
  ocean: require('../../assets/session-art/ocean.jpg'),
  rain: require('../../assets/session-art/rain.jpg'),
  'african-beats': require('../../assets/session-art/african-beats.jpg'),
  'lets-move': require('../../assets/session-art/lets-move.jpg'),
  controlled: require('../../assets/session-art/controlled.jpg'),
  'belly-breathing': require('../../assets/session-art/belly-breathing.jpg'),
  'fast-slow-breathing': require('../../assets/session-art/fast-slow-breathing.jpg'),
  'foot-detox': require('../../assets/session-art/foot-detox.jpg'),
  'tea-time': require('../../assets/session-art/tea-time.jpg'),
  'barefoot-grass-walk': require('../../assets/session-art/barefoot-grass-walk.jpg'),
  'guided-meditation': require('../../assets/session-art/guided-meditation.jpg'),
  'feminine-energy': require('../../assets/session-art/feminine-energy.jpg'),
  'masculine-energy': require('../../assets/session-art/masculine-energy.jpg'),
};

export function getSessionArtwork(
  session: Pick<Session, 'id' | 'thumbnailUrl'>
): ImageSourcePropType {
  return artworkBySessionId[session.id] ?? { uri: session.thumbnailUrl };
}
