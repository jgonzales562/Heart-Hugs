import { useIsFocused } from '@react-navigation/native';
import { useEventListener } from 'expo';
import { useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer, type VideoPlayerStatus } from 'expo-video';
import { AlertCircle, RotateCcw } from 'lucide-react-native';
import { useEffect, useEffectEvent, useId, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PlaybackProgress,
  getPlaybackProgress,
  sanitizePlaybackTime,
} from './PlaybackProgress';
import { PlaybackToggle } from './PlaybackToggle';
import { playbackCoordinator } from '../services/playback';
import { colors, gradients, theme } from '../theme';
import { Session } from '../types/session';
import { PlaybackKind } from '../utils/PlaybackCoordinator';

type MediaPlayerProps = {
  session: Session;
};

const MEDIA_LOAD_TIMEOUT_MS = 15_000;

function usePlaybackInstanceId(): string {
  return `media-player-${useId()}`;
}

function useRegisteredPlaybackPauser(
  playbackId: string,
  kind: PlaybackKind,
  pausePlayback: () => void
) {
  const onPausePlayback = useEffectEvent(pausePlayback);

  useEffect(() => {
    return playbackCoordinator.register(playbackId, {
      kind,
      pause: onPausePlayback,
    });
  }, [kind, playbackId]);
}

function configureAudioPlayer(player: AudioPlayer) {
  player.loop = false;
  player.volume = 0.86;
}

export function MediaPlayer({ session }: MediaPlayerProps) {
  if (session.mediaType === 'video') {
    return <VideoSessionPlayer session={session} />;
  }

  return <AudioSessionPlayer session={session} />;
}

function AudioSessionPlayer({ session }: MediaPlayerProps) {
  const isFocused = useIsFocused();
  const playbackInstanceId = usePlaybackInstanceId();
  const player = useAudioPlayer(session.mediaUrl, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [isStarting, setIsStarting] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const isLoading = !status.isLoaded || status.isBuffering;
  const loadError =
    status.playbackState === 'failed'
      ? 'This audio could not be loaded.'
      : null;
  const errorMessage = playbackError ?? loadError;

  useEffect(() => {
    configureAudioPlayer(player);
  }, [player]);

  useEffect(() => {
    if (!isFocused) {
      void playbackCoordinator.stop(playbackInstanceId);
    }
  }, [isFocused, playbackInstanceId]);

  useRegisteredPlaybackPauser(playbackInstanceId, 'audio', () => {
    player.pause();
    player.clearLockScreenControls();
  });

  useEffect(() => {
    if (status.didJustFinish) {
      void playbackCoordinator.stop(playbackInstanceId);
    }
  }, [playbackInstanceId, status.didJustFinish]);

  const currentTime = sanitizePlaybackTime(status.currentTime);
  const duration = sanitizePlaybackTime(status.duration);
  const progress = getPlaybackProgress(currentTime, duration);

  async function togglePlayback() {
    if (status.playing) {
      await playbackCoordinator.stop(playbackInstanceId);
      return;
    }

    if (!status.isLoaded || errorMessage) {
      return;
    }

    setIsStarting(true);
    setPlaybackError(null);

    try {
      if (status.didJustFinish || (duration > 0 && currentTime >= duration)) {
        await player.seekTo(0);
      }

      await playbackCoordinator.start(playbackInstanceId, () => {
        player.setActiveForLockScreen(true, {
          artist: 'Heart Hugs',
          artworkUrl: session.thumbnailUrl,
          title: session.title,
        }, {
          showSeekBackward: true,
          showSeekForward: true,
        });
        player.play();
      });
    } catch (error) {
      console.warn(`Unable to play ${session.title}.`, error);
      setPlaybackError('Playback could not start. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  async function seekAudio(time: number) {
    if (!status.isLoaded) {
      return;
    }

    try {
      await player.seekTo(time);
    } catch (error) {
      console.warn(`Unable to seek ${session.title}.`, error);
      setPlaybackError('Playback could not seek to that position. Please try again.');
    }
  }

  function retryAudio() {
    void playbackCoordinator.stop(playbackInstanceId);
    setPlaybackError(null);
    setRetryAttempt((attempt) => attempt + 1);

    try {
      player.replace(session.mediaUrl);
    } catch (error) {
      console.warn(`Unable to reload ${session.title}.`, error);
      setPlaybackError('This audio could not be reloaded. Please try again.');
    }
  }

  return (
    <View style={styles.surface}>
      <LinearGradient colors={gradients.player} style={styles.audioGradient}>
        <SessionCopy session={session} tone="overlay" />

        {errorMessage || isLoading ? (
          <PlaybackStatusMessage
            errorMessage={errorMessage}
            isLoading={isLoading && !errorMessage}
            key={`audio-${retryAttempt}-${errorMessage ? 'error' : 'loading'}`}
            loadingMessage={status.isBuffering ? 'Buffering audio…' : 'Loading audio…'}
            onRetry={retryAudio}
            timeoutMessage="This audio is taking longer than expected to load."
          />
        ) : null}

        <View style={styles.audioFocus}>
          <View style={styles.audioRing}>
            <PlaybackToggle
              accessibilityLabel={
                status.playing ? `Pause ${session.title}` : `Play ${session.title}`
              }
              disabled={(!status.isLoaded || Boolean(errorMessage)) && !status.playing}
              isPending={isStarting}
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
          onSeek={seekAudio}
          progress={progress}
          tone="overlay"
        />
      </LinearGradient>
    </View>
  );
}

function VideoSessionPlayer({ session }: MediaPlayerProps) {
  const isFocused = useIsFocused();
  const playbackInstanceId = usePlaybackInstanceId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<VideoPlayerStatus>('idle');
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

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
  const isLoading = playbackStatus === 'idle' || playbackStatus === 'loading';
  const errorMessage = playbackError;

  useEffect(() => {
    if (!isFocused) {
      void playbackCoordinator.stop(playbackInstanceId);
    }
  }, [isFocused, playbackInstanceId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        void playbackCoordinator.stop(playbackInstanceId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [playbackInstanceId]);

  useRegisteredPlaybackPauser(playbackInstanceId, 'video', () => {
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

  useEventListener(player, 'statusChange', ({ error, status: nextStatus }) => {
    setPlaybackStatus(nextStatus);
    setDuration(sanitizePlaybackTime(player.duration));

    if (nextStatus === 'error') {
      setPlaybackError(error?.message || 'This video could not be loaded.');
    } else if (nextStatus === 'readyToPlay') {
      setPlaybackError(null);
    }
  });

  useEventListener(player, 'playToEnd', () => {
    setCurrentTime(sanitizePlaybackTime(player.duration));
    void playbackCoordinator.stop(playbackInstanceId);
  });

  async function togglePlayback() {
    if (isPlaying) {
      await playbackCoordinator.stop(playbackInstanceId);
      return;
    }

    if (playbackStatus !== 'readyToPlay' || errorMessage) {
      return;
    }

    setIsStarting(true);

    try {
      if (duration > 0 && currentTime >= duration) {
        player.seekBy(-currentTime);
      }

      await playbackCoordinator.start(playbackInstanceId, () => player.play());
    } catch (error) {
      console.warn(`Unable to play ${session.title}.`, error);
      setPlaybackError('Playback could not start. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  async function retryVideo() {
    await playbackCoordinator.stop(playbackInstanceId);
    setPlaybackError(null);
    setRetryAttempt((attempt) => attempt + 1);

    try {
      await player.replaceAsync(source);
    } catch (error) {
      console.warn(`Unable to reload ${session.title}.`, error);
      setPlaybackError('This video could not be reloaded. Please try again.');
    }
  }

  function seekVideo(time: number) {
    if (playbackStatus !== 'readyToPlay') {
      return;
    }

    try {
      player.seekBy(time - currentTime);
      setCurrentTime(time);
    } catch (error) {
      console.warn(`Unable to seek ${session.title}.`, error);
      setPlaybackError('Playback could not seek to that position. Please try again.');
    }
  }

  const progress = getPlaybackProgress(currentTime, duration);

  return (
    <View style={styles.surface}>
      <View style={styles.videoShell}>
        <VideoView
          contentFit="cover"
          fullscreenOptions={{ enable: true }}
          nativeControls={false}
          player={player}
          style={styles.video}
          surfaceType="textureView"
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
              disabled={
                (playbackStatus !== 'readyToPlay' || Boolean(errorMessage)) && !isPlaying
              }
              isPending={isStarting}
              isPlaying={isPlaying}
              onPress={togglePlayback}
            />
            <View style={styles.videoProgress}>
              <PlaybackProgress
                accessibilityLabel={`${session.title} video progress`}
                currentTime={currentTime}
                duration={duration}
                onSeek={seekVideo}
                progress={progress}
                tone="overlay"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.videoCopy}>
        {errorMessage || isLoading ? (
          <PlaybackStatusMessage
            errorMessage={errorMessage}
            isLoading={isLoading && !errorMessage}
            key={`video-${retryAttempt}-${errorMessage ? 'error' : 'loading'}`}
            loadingMessage="Loading video…"
            onRetry={retryVideo}
            timeoutMessage="This video is taking longer than expected to load."
          />
        ) : null}
        <SessionCopy session={session} tone="overlay" />
      </View>
    </View>
  );
}

type PlaybackStatusMessageProps = {
  errorMessage: string | null;
  isLoading: boolean;
  loadingMessage: string;
  onRetry: () => void;
  timeoutMessage: string;
};

function PlaybackStatusMessage({
  errorMessage,
  isLoading,
  loadingMessage,
  onRetry,
  timeoutMessage,
}: PlaybackStatusMessageProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading || errorMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setHasTimedOut(true);
    }, MEDIA_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [errorMessage, isLoading]);

  const visibleError = errorMessage ?? (hasTimedOut ? timeoutMessage : null);

  if (!visibleError && !isLoading) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.statusMessage, visibleError && styles.errorMessage]}
    >
      {visibleError ? (
        <AlertCircle color={colors.rose} size={18} />
      ) : (
        <ActivityIndicator color={colors.tealDeep} size="small" />
      )}
      <Text style={styles.statusMessageText}>{visibleError ?? loadingMessage}</Text>
      {visibleError ? (
        <Pressable
          accessibilityLabel="Retry loading this session"
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        >
          <RotateCcw color={colors.tealDeep} size={15} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type SessionCopyProps = MediaPlayerProps & {
  tone?: 'default' | 'overlay';
};

function SessionCopy({ session, tone = 'default' }: SessionCopyProps) {
  const isOverlay = tone === 'overlay';

  return (
    <View style={styles.sessionCopy}>
      <Text style={[styles.playerEyebrow, isOverlay && styles.overlayPlayerEyebrow]}>
        {session.mediaType === 'audio' ? 'Audio session' : 'Video session'}
      </Text>
      <Text style={[styles.playerTitle, isOverlay && styles.overlayPlayerText]}>
        {session.title}
      </Text>
      <Text style={[styles.playerDescription, isOverlay && styles.overlayPlayerDescription]}>
        {session.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.deepOcean,
    borderRadius: theme.radius.lg,
    elevation: 5,
    gap: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  audioGradient: {
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  statusMessage: {
    alignItems: 'center',
    backgroundColor: colors.tealMist,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  errorMessage: {
    backgroundColor: colors.roseSoft,
  },
  statusMessageText: {
    color: colors.inkMuted,
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  retryButtonPressed: {
    opacity: 0.72,
  },
  retryButtonText: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
  },
  audioFocus: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  audioRing: {
    alignItems: 'center',
    backgroundColor: colors.whiteFaint,
    borderColor: 'rgba(255, 255, 255, 0.28)',
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
    gap: theme.spacing.md,
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
  overlayPlayerEyebrow: {
    color: colors.teal,
  },
  overlayPlayerText: {
    color: colors.white,
  },
  overlayPlayerDescription: {
    color: colors.whiteMuted,
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
