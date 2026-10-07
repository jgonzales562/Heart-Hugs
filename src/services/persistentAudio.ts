import { createAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';

import { playbackCoordinator } from './playback';

export const PERSISTENT_AUDIO_PLAYBACK_ID = 'persistent-audio-player';

type AudioStatusSubscription = {
  remove(): void;
};

type PersistentAudioState = {
  readonly mediaUrl: string;
  readonly player: AudioPlayer;
  readonly sessionId: string;
  readonly statusSubscription: AudioStatusSubscription;
};

let activeAudio: PersistentAudioState | null = null;

playbackCoordinator.register(PERSISTENT_AUDIO_PLAYBACK_ID, {
  kind: 'audio',
  pause: () => {
    const player = activeAudio?.player;

    if (!player) {
      return;
    }

    runCleanup(() => player.pause(), 'pause persistent audio');
    runCleanup(() => player.clearLockScreenControls(), 'clear audio lock-screen controls');
  },
});

function releaseActiveAudio() {
  const audioToRelease = activeAudio;

  if (!audioToRelease) {
    return;
  }

  activeAudio = null;
  runCleanup(() => audioToRelease.statusSubscription.remove(), 'remove audio status listener');
  runCleanup(() => audioToRelease.player.remove(), 'release persistent audio player');
}

function runCleanup(cleanup: () => void, description: string) {
  try {
    cleanup();
  } catch (error) {
    console.warn(`Unable to ${description}.`, error);
  }
}

export function getPersistentAudioPlayer(
  sessionId: string,
  mediaUrl: string
): AudioPlayer {
  if (activeAudio?.sessionId === sessionId && activeAudio.mediaUrl === mediaUrl) {
    return activeAudio.player;
  }

  if (activeAudio) {
    void playbackCoordinator.stop(PERSISTENT_AUDIO_PLAYBACK_ID);
    releaseActiveAudio();
  }

  const player = createAudioPlayer(mediaUrl, {
    updateInterval: 500,
  });
  let statusSubscription: AudioStatusSubscription;

  try {
    statusSubscription = player.addListener(
      'playbackStatusUpdate',
      (status: AudioStatus) => {
        if (status.didJustFinish) {
          runCleanup(
            () => player.clearLockScreenControls(),
            'clear completed audio lock-screen controls'
          );
          void playbackCoordinator.finish(PERSISTENT_AUDIO_PLAYBACK_ID);
        }
      }
    );
  } catch (error) {
    runCleanup(() => player.remove(), 'release audio player after listener failure');
    throw error;
  }

  activeAudio = {
    mediaUrl,
    player,
    sessionId,
    statusSubscription,
  };

  return player;
}
