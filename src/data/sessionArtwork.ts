import type { ImageSourcePropType } from 'react-native';

import type { Session } from '../types/session';

const fiveSenses: ImageSourcePropType = require('../../assets/session-art/five-senses.jpg');
const happyPlace: ImageSourcePropType = require('../../assets/session-art/happy-place.jpg');
const starFish: ImageSourcePropType = require('../../assets/session-art/star-fish.jpg');
const fallingLeavesRiver: ImageSourcePropType = require('../../assets/session-art/falling-leaves-river.jpg');
const bodyMindConnection: ImageSourcePropType = require('../../assets/session-art/body-mind-connection.jpg');
const superHeroPose: ImageSourcePropType = require('../../assets/session-art/super-hero-pose.jpg');
const heartHugs: ImageSourcePropType = require('../../assets/session-art/heart-hugs.jpg');
const treeHug: ImageSourcePropType = require('../../assets/session-art/tree-hug.jpg');
const water: ImageSourcePropType = require('../../assets/session-art/water.jpg');
const ocean: ImageSourcePropType = require('../../assets/session-art/ocean.jpg');
const rain: ImageSourcePropType = require('../../assets/session-art/rain.jpg');
const africanBeats: ImageSourcePropType = require('../../assets/session-art/african-beats.jpg');
const letsMove: ImageSourcePropType = require('../../assets/session-art/lets-move.jpg');
const controlled: ImageSourcePropType = require('../../assets/session-art/controlled.jpg');
const bellyBreathing: ImageSourcePropType = require('../../assets/session-art/belly-breathing.jpg');
const fastSlowBreathing: ImageSourcePropType = require('../../assets/session-art/fast-slow-breathing.jpg');
const footDetox: ImageSourcePropType = require('../../assets/session-art/foot-detox.jpg');
const teaTime: ImageSourcePropType = require('../../assets/session-art/tea-time.jpg');
const barefootGrassWalk: ImageSourcePropType = require('../../assets/session-art/barefoot-grass-walk.jpg');
const guidedMeditation: ImageSourcePropType = require('../../assets/session-art/guided-meditation.jpg');
const feminineEnergy: ImageSourcePropType = require('../../assets/session-art/feminine-energy.jpg');
const masculineEnergy: ImageSourcePropType = require('../../assets/session-art/masculine-energy.jpg');

const artworkBySessionId: Record<string, ImageSourcePropType> = {
  'five-senses': fiveSenses,
  'happy-place': happyPlace,
  'star-fish': starFish,
  'falling-leaves-river': fallingLeavesRiver,
  'body-mind-connection': bodyMindConnection,
  'super-hero-pose': superHeroPose,
  'heart-hugs': heartHugs,
  'tree-hug': treeHug,
  water,
  ocean,
  rain,
  'african-beats': africanBeats,
  'lets-move': letsMove,
  controlled,
  'belly-breathing': bellyBreathing,
  'fast-slow-breathing': fastSlowBreathing,
  'foot-detox': footDetox,
  'tea-time': teaTime,
  'barefoot-grass-walk': barefootGrassWalk,
  'guided-meditation': guidedMeditation,
  'feminine-energy': feminineEnergy,
  'masculine-energy': masculineEnergy,
};

export function getSessionArtwork(
  session: Pick<Session, 'id' | 'thumbnailUrl'>
): ImageSourcePropType {
  return artworkBySessionId[session.id] ?? { uri: session.thumbnailUrl };
}

export const welcomeArtwork = heartHugs;
