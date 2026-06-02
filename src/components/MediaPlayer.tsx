import { useFocusEffect } from '@react-navigation/native';
import { useEventListener } from 'expo';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  PlaybackProgress,
  getPlaybackProgress,
  sanitizePlaybackTime,
} from './PlaybackProgress';
import { PlaybackToggle } from './PlaybackToggle';
import { colors, gradients, theme } from '../theme';
import { Session } from '../types/session';

type MediaPlayerProps = {
  session: Session;
};

type PausePlayback = () => void;

const playbackPausers = new Map<string, PausePlayback>();
let playbackInstanceCount = 0;

function usePlaybackInstanceId(): string {
  const playbackInstanceId = useRef<string | null>(null);

  if (playbackInstanceId.current === null) {
    playbackInstanceCount += 1;
    playbackInstanceId.current = `media-player-${playbackInstanceCount}`;
  }

  return playbackInstanceId.current;
}

function pauseOtherPlayers(activePlaybackId: string) {
  Array.from(playbackPausers.entries()).forEach(([playbackId, pausePlayback]) => {
    if (playbackId !== activePlaybackId) {
      pausePlayback();
    }
  });
}

function useRegisteredPlaybackPauser(playbackId: string, pausePlayback: PausePlayback) {
  const pausePlaybackRef = useRef(pausePlayback);
  pausePlaybackRef.current = pausePlayback;

  useEffect(() => {
    const registeredPausePlayback = () => {
      pausePlaybackRef.current();
    };

    playbackPausers.set(playbackId, registeredPausePlayback);

    return () => {
      if (playbackPausers.get(playbackId) === registeredPausePlayback) {
        playbackPausers.delete(playbackId);
      }
    };
  }, [playbackId]);
}

export function MediaPlayer({ session }: MediaPlayerProps) {
  if (session.mediaType === 'video') {
    return <VideoSessionPlayer session={session} />;
  }

  return <AudioSessionPlayer session={session} />;
}

function AudioSessionPlayer({ session }: MediaPlayerProps) {
  const playbackInstanceId = usePlaybackInstanceId();
  const player = useAudioPlayer(session.mediaUrl, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.loop = false;
    player.volume = 0.86;

    return () => {
      player.pause();
    };
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();
      };
    }, [player])
  );

  useRegisteredPlaybackPauser(playbackInstanceId, () => {
    player.pause();
  });

  const currentTime = sanitizePlaybackTime(status.currentTime);
  const duration = sanitizePlaybackTime(status.duration);
  const progress = getPlaybackProgress(currentTime, duration);

  function togglePlayback() {
    if (status.playing) {
      player.pause();
    } else {
      pauseOtherPlayers(playbackInstanceId);
      player.play();
    }
  }

  return (
    <View style={styles.surface}>
      <LinearGradient colors={gradients.card} style={styles.audioGradient}>
        <SessionCopy session={session} />

        <View style={styles.audioFocus}>
          <View style={styles.audioRing}>
            <PlaybackToggle
              accessibilityLabel={
                status.playing ? `Pause ${session.title}` : `Play ${session.title}`
              }
              isPlaying={status.playing}
              onPress={togglePlayback}
              variant="large"
            />
          </View>
        </View>

        <PlaybackProgress
          accessibilityLabel={`${session.title} progress`}
          currentTime={currentTime}
          duration={duration}
          progress={progress}
        />
      </LinearGradient>
    </View>
  );
}

function VideoSessionPlayer({ session }: MediaPlayerProps) {
  const playbackInstanceId = usePlaybackInstanceId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const source = useMemo(
    () => ({
      metadata: {
        artist: 'Heart Hugs',
        artwork: session.thumbnailUrl,
        title: session.title,
      },
      uri: session.mediaUrl,
    }),
    [session.mediaUrl, session.thumbnailUrl, session.title]
  );

  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.timeUpdateEventInterval = 0.5;
    videoPlayer.volume = 0.86;
  });

  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();
        setIsPlaying(false);
      };
    }, [player])
  );

  useRegisteredPlaybackPauser(playbackInstanceId, () => {
    player.pause();
    setIsPlaying(false);
  });

  useEventListener(player, 'playingChange', ({ isPlaying: nextIsPlaying }) => {
    setIsPlaying(nextIsPlaying);
  });

  useEventListener(player, 'timeUpdate', ({ currentTime: nextCurrentTime }) => {
    setCurrentTime(sanitizePlaybackTime(nextCurrentTime));
    setDuration(sanitizePlaybackTime(player.duration));
  });

  useEventListener(player, 'statusChange', () => {
    setDuration(sanitizePlaybackTime(player.duration));
  });

  function togglePlayback() {
    if (isPlaying) {
      player.pause();
    } else {
      pauseOtherPlayers(playbackInstanceId);
      player.play();
    }
  }

  const progress = getPlaybackProgress(currentTime, duration);

  return (
    <View style={styles.surface}>
      <View style={styles.videoShell}>
        <VideoView
          allowsFullscreen
          contentFit="cover"
          nativeControls={false}
          player={player}
          style={styles.video}
        />
        <LinearGradient
          colors={['rgba(23, 42, 68, 0)', 'rgba(23, 42, 68, 0.72)']}
          style={styles.videoControlGradient}
        >
          <View style={styles.videoControls}>
            <PlaybackToggle
              accessibilityLabel={
                isPlaying ? `Pause ${session.title} video` : `Play ${session.title} video`
              }
              isPlaying={isPlaying}
              onPress={togglePlayback}
            />
            <View style={styles.videoProgress}>
              <PlaybackProgress
                accessibilityLabel={`${session.title} video progress`}
                currentTime={currentTime}
                duration={duration}
                progress={progress}
                tone="overlay"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.videoCopy}>
        <SessionCopy session={session} />
      </View>
    </View>
  );
}

function SessionCopy({ session }: MediaPlayerProps) {
  return (
    <View style={styles.sessionCopy}>
      <Text style={styles.playerEyebrow}>
        {session.mediaType === 'audio' ? 'Audio session' : 'Video session'}
      </Text>
      <Text style={styles.playerTitle}>{session.title}</Text>
      <Text style={styles.playerDescription}>{session.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.warmWhite,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  audioGradient: {
    gap: theme.spacing.xl,
    padding: theme.spacing.lg,
  },
  audioFocus: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  audioRing: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 138,
    justifyContent: 'center',
    width: 138,
  },
  sessionCopy: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  videoCopy: {
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  playerEyebrow: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  playerTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
    textAlign: 'center',
  },
  playerDescription: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: 'center',
  },
  videoShell: {
    aspectRatio: 16 / 10,
    backgroundColor: colors.navy,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  video: {
    height: '100%',
    width: '100%',
  },
  videoControlGradient: {
    bottom: 0,
    left: 0,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    position: 'absolute',
    right: 0,
  },
  videoControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  videoProgress: {
    flex: 1,
  },
});
