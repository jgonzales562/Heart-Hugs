import { createAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';

import { playbackCoordinator } from './playback';

export const PERSISTENT_AUDIO_PLAYBACK_ID = 'persistent-audio-player';

type AudioStatusSubscription = {
  remove(): void;
};

type PersistentAudioState = {
  player: AudioPlayer;
  sessionId: string;
  statusSubscription: AudioStatusSubscription;
};

export type PersistentAudioHandle = {
  player: AudioPlayer;
  shouldRestorePosition: boolean;
};

let activeAudio: PersistentAudioState | null = null;

playbackCoordinator.register(PERSISTENT_AUDIO_PLAYBACK_ID, {
  kind: 'audio',
  pause: () => {
    activeAudio?.player.pause();
    activeAudio?.player.clearLockScreenControls();
  },
});

function releaseActiveAudio() {
  if (!activeAudio) {
    return;
  }

  activeAudio.statusSubscription.remove();
  activeAudio.player.pause();
  activeAudio.player.clearLockScreenControls();
  activeAudio.player.remove();
  activeAudio = null;
}

export function getPersistentAudioPlayer(
  sessionId: string,
  mediaUrl: string
): PersistentAudioHandle {
  if (activeAudio?.sessionId === sessionId) {
    return {
      player: activeAudio.player,
      shouldRestorePosition: false,
    };
  }

  void playbackCoordinator.stop(PERSISTENT_AUDIO_PLAYBACK_ID);
  releaseActiveAudio();

  const player = createAudioPlayer(mediaUrl, {
    downloadFirst: true,
    updateInterval: 500,
  });
  const statusSubscription = player.addListener(
    'playbackStatusUpdate',
    (status: AudioStatus) => {
      if (status.didJustFinish) {
        void playbackCoordinator.finish(PERSISTENT_AUDIO_PLAYBACK_ID);
      }
    }
  );

  activeAudio = {
    player,
    sessionId,
    statusSubscription,
  };

  return {
    player,
    shouldRestorePosition: true,
  };
}
