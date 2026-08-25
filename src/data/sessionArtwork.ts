import type { ImageSourcePropType } from 'react-native';

import type { Session } from '../types/session';

const desertSpring: ImageSourcePropType = require('../../assets/session-art/desert-spring.jpg');
const waterRipples: ImageSourcePropType = require('../../assets/session-art/water-ripples.jpg');
const desertFire: ImageSourcePropType = require('../../assets/session-art/desert-fire.jpg');
const airBloom: ImageSourcePropType = require('../../assets/session-art/air-bloom.jpg');

const artworkBySessionId: Record<string, ImageSourcePropType> = {
  'morning-grounding': desertSpring,
  'soft-reset': waterRipples,
  'visual-breathing': airBloom,
  'evening-compassion': desertFire,
  'restful-imagery': desertSpring,
  'steady-aftercare': desertFire,
};

export function getSessionArtwork(
  session: Pick<Session, 'id' | 'thumbnailUrl'>
): ImageSourcePropType {
  return artworkBySessionId[session.id] ?? { uri: session.thumbnailUrl };
}

export const welcomeArtwork = desertSpring;
