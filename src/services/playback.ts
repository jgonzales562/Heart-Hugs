import { setAudioModeAsync } from 'expo-audio';

import { PlaybackCoordinator } from '../utils/PlaybackCoordinator';

async function configureBackgroundAudio(enabled: boolean) {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
      playsInSilentMode: true,
      shouldPlayInBackground: enabled,
      shouldRouteThroughEarpiece: false,
    });

    return true;
  } catch (error) {
    console.warn(`Unable to ${enabled ? 'enable' : 'disable'} background audio playback.`, error);
    return false;
  }
}

export const playbackCoordinator = new PlaybackCoordinator(configureBackgroundAudio);
