import { useIsFocused } from '@react-navigation/native';
import { useEventListener } from 'expo';
import { useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer, type VideoPlayerStatus } from 'expo-video';
import { AlertCircle, FastForward, Rewind, RotateCcw } from 'lucide-react-native';
import { ReactNode, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from './BreathingPressable';
import {
  PlaybackProgress,
  getPlaybackProgress,
  sanitizePlaybackTime,
} from './PlaybackProgress';
import { PlaybackToggle } from './PlaybackToggle';
import { playbackCoordinator } from '../services/playback';
import {
  getPersistentAudioPlayer,
  PERSISTENT_AUDIO_PLAYBACK_ID,
} from '../services/persistentAudio';
import { colors, gradients, theme } from '../theme';
import { Session } from '../types/session';
import { PlaybackKind } from '../utils/PlaybackCoordinator';

type MediaPlayerProps = {
  initialPosition?: number;
  onComplete?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  session: Session;
};

const MEDIA_LOAD_TIMEOUT_MS = 15_000;
const AUDIO_LOADING_MESSAGE_DELAY_MS = 2_000;

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

export function MediaPlayer(props: MediaPlayerProps) {
  if (props.session.mediaType === 'video') {
    return <VideoSessionPlayer {...props} />;
  }

  return <AudioSessionPlayer {...props} />;
}

function AudioSessionPlayer({
  initialPosition = 0,
  onComplete,
  onProgress,
  session,
}: MediaPlayerProps) {
  const [{ player, shouldRestorePosition }] = useState(() =>
    getPersistentAudioPlayer(session.id, session.mediaUrl)
  );
  const status = useAudioPlayerStatus(player);
  const [isStarting, setIsStarting] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const hasRestoredPosition = useRef(!shouldRestorePosition);
  const hasReportedCompletion = useRef(false);
  const reportProgress = useEffectEvent((position: number, totalDuration: number) => {
    onProgress?.(position, totalDuration);
  });
  const reportCompletion = useEffectEvent(() => {
    onComplete?.();
  });
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
    if (status.didJustFinish) {
      if (!hasReportedCompletion.current) {
        hasReportedCompletion.current = true;
        reportCompletion();
      }
      void playbackCoordinator.finish(PERSISTENT_AUDIO_PLAYBACK_ID);
    }
  }, [status.didJustFinish]);

  const currentTime = sanitizePlaybackTime(status.currentTime);
  const duration = sanitizePlaybackTime(status.duration);
  const progress = getPlaybackProgress(currentTime, duration);

  useEffect(() => {
    if (!status.isLoaded || hasRestoredPosition.current) {
      return;
    }

    hasRestoredPosition.current = true;

    if (initialPosition > 1 && (!duration || initialPosition < duration - 2)) {
      void player.seekTo(initialPosition).catch((error) => {
        console.warn(`Unable to restore ${session.title}.`, error);
      });
    }
  }, [duration, initialPosition, player, session.title, status.isLoaded]);

  useEffect(() => {
    if (duration > 0) {
      reportProgress(currentTime, duration);
    }
  }, [currentTime, duration]);

  async function togglePlayback() {
    if (status.playing) {
      await playbackCoordinator.stop(PERSISTENT_AUDIO_PLAYBACK_ID);
      return;
    }

    hasReportedCompletion.current = false;

    if (!status.isLoaded || errorMessage) {
      return;
    }

    setIsStarting(true);
    setPlaybackError(null);

    try {
      if (status.didJustFinish || (duration > 0 && currentTime >= duration)) {
        await player.seekTo(0);
      }

      await playbackCoordinator.start(PERSISTENT_AUDIO_PLAYBACK_ID, () => {
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

  function cycleAudioPlaybackRate() {
    const rates = [0.75, 1, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    player.setPlaybackRate(nextRate);
    setPlaybackRate(nextRate);
  }

  function retryAudio() {
    void playbackCoordinator.stop(PERSISTENT_AUDIO_PLAYBACK_ID);
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
            key={`audio-${retryAttempt}-${errorMessage ? 'error' : status.isLoaded ? 'buffering' : 'loading'}`}
            loadingDelayMs={AUDIO_LOADING_MESSAGE_DELAY_MS}
            loadingMessage={
              status.isLoaded && status.isBuffering ? 'Buffering audio…' : 'Loading audio…'
            }
            onRetry={retryAudio}
            timeoutMessage="This audio is taking longer than expected to load."
          />
        ) : null}

        <View style={styles.audioFocus}>
          <TransportButton
            accessibilityLabel="Rewind 15 seconds"
            disabled={!status.isLoaded}
            onPress={() => seekAudio(Math.max(0, currentTime - 15))}
          >
            <Rewind color={colors.white} size={23} />
          </TransportButton>
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
          <TransportButton
            accessibilityLabel="Fast-forward 15 seconds"
            disabled={!status.isLoaded}
            onPress={() => seekAudio(Math.min(duration, currentTime + 15))}
          >
            <FastForward color={colors.white} size={23} />
          </TransportButton>
        </View>

        <PlaybackRateButton onPress={cycleAudioPlaybackRate} rate={playbackRate} />

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

function VideoSessionPlayer({
  initialPosition = 0,
  onComplete,
  onProgress,
  session,
}: MediaPlayerProps) {
  const isFocused = useIsFocused();
  const playbackInstanceId = usePlaybackInstanceId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<VideoPlayerStatus>('idle');
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const hasRestoredPosition = useRef(false);
  const reportProgress = useEffectEvent((position: number, totalDuration: number) => {
    onProgress?.(position, totalDuration);
  });

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
  const isLoading =
    !hasFinished && (playbackStatus === 'idle' || playbackStatus === 'loading');
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
    const nextDuration = sanitizePlaybackTime(player.duration);
    setDuration(nextDuration);

    if (nextStatus === 'error') {
      setPlaybackError(error?.message || 'This video could not be loaded.');
    } else if (nextStatus === 'readyToPlay') {
      setPlaybackError(null);

      if (
        !hasRestoredPosition.current &&
        initialPosition > 1 &&
        (!nextDuration || initialPosition < nextDuration - 2)
      ) {
        hasRestoredPosition.current = true;
        player.seekBy(initialPosition - player.currentTime);
        setCurrentTime(initialPosition);
      }
    }
  });

  useEventListener(player, 'playToEnd', () => {
    setCurrentTime(sanitizePlaybackTime(player.duration));
    setHasFinished(true);
    onComplete?.();
    void playbackCoordinator.finish(playbackInstanceId);
  });

  async function togglePlayback() {
    if (isPlaying) {
      await playbackCoordinator.stop(playbackInstanceId);
      return;
    }

    if ((!hasFinished && playbackStatus !== 'readyToPlay') || errorMessage) {
      return;
    }

    setIsStarting(true);

    try {
      const shouldReplay = hasFinished || (duration > 0 && currentTime >= duration);

      const didStart = await playbackCoordinator.start(playbackInstanceId, () => {
        if (shouldReplay) {
          player.replay();
        } else {
          player.play();
        }
      });

      if (didStart && shouldReplay) {
        setCurrentTime(0);
        setHasFinished(false);
      }
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
    setHasFinished(false);
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
      setHasFinished(duration > 0 && time >= duration);
    } catch (error) {
      console.warn(`Unable to seek ${session.title}.`, error);
      setPlaybackError('Playback could not seek to that position. Please try again.');
    }
  }

  const progress = getPlaybackProgress(currentTime, duration);

  useEffect(() => {
    if (duration > 0) {
      reportProgress(currentTime, duration);
    }
  }, [currentTime, duration]);

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
                ((!hasFinished && playbackStatus !== 'readyToPlay') ||
                  Boolean(errorMessage)) &&
                !isPlaying
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
        <View style={styles.videoTransportRow}>
          <TransportButton
            accessibilityLabel="Rewind video 15 seconds"
            disabled={playbackStatus !== 'readyToPlay'}
            onPress={() => seekVideo(Math.max(0, currentTime - 15))}
          >
            <Rewind color={colors.white} size={21} />
          </TransportButton>
          <Text style={styles.videoTransportLabel}>15 sec</Text>
          <TransportButton
            accessibilityLabel="Fast-forward video 15 seconds"
            disabled={playbackStatus !== 'readyToPlay'}
            onPress={() => seekVideo(Math.min(duration, currentTime + 15))}
          >
            <FastForward color={colors.white} size={21} />
          </TransportButton>
        </View>
      </View>
    </View>
  );
}

type PlaybackStatusMessageProps = {
  errorMessage: string | null;
  isLoading: boolean;
  loadingDelayMs?: number;
  loadingMessage: string;
  onRetry: () => void;
  timeoutMessage: string;
};

function PlaybackStatusMessage({
  errorMessage,
  isLoading,
  loadingDelayMs = 0,
  loadingMessage,
  onRetry,
  timeoutMessage,
}: PlaybackStatusMessageProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasLoadingDelayElapsed, setHasLoadingDelayElapsed] = useState(false);

  useEffect(() => {
    if (!isLoading || errorMessage || loadingDelayMs <= 0) {
      return;
    }

    const delay = setTimeout(() => {
      setHasLoadingDelayElapsed(true);
    }, loadingDelayMs);

    return () => clearTimeout(delay);
  }, [errorMessage, isLoading, loadingDelayMs]);

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
  const isLoadingVisible = loadingDelayMs <= 0 || hasLoadingDelayElapsed;

  if (!visibleError && (!isLoading || !isLoadingVisible)) {
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
        <ActivityIndicator color={colors.leafDeep} size="small" />
      )}
      <Text style={styles.statusMessageText}>{visibleError ?? loadingMessage}</Text>
      {visibleError ? (
        <BreathingPressable
          accessibilityLabel="Retry loading this session"
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          onPress={onRetry}
          style={styles.retryButton}
        >
          <RotateCcw color={colors.leafDeep} size={15} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </BreathingPressable>
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

type TransportButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
};

function TransportButton({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
}: TransportButtonProps) {
  function handlePress() {
    try {
      const result = onPress();
      if (result) {
        void result.catch((error) => console.warn('Unable to seek playback.', error));
      }
    } catch (error) {
      console.warn('Unable to seek playback.', error);
    }
  }

  return (
    <BreathingPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.transportButton,
        disabled && styles.transportButtonDisabled,
      ]}
    >
      {children}
    </BreathingPressable>
  );
}

function PlaybackRateButton({ onPress, rate }: { onPress: () => void; rate: number }) {
  return (
    <BreathingPressable
      accessibilityLabel={`Playback speed ${rate} times. Change playback speed.`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.rateButton}
    >
      <Text style={styles.rateButtonText}>{rate}×</Text>
    </BreathingPressable>
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
    backgroundColor: colors.mintSoft,
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
  retryButtonText: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
  },
  audioFocus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
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
  transportButton: {
    alignItems: 'center',
    backgroundColor: colors.whiteFaint,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  transportButtonDisabled: {
    opacity: 0.45,
  },
  rateButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.whiteFaint,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    minHeight: 42,
    minWidth: 62,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  rateButtonText: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
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
  videoTransportRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoTransportLabel: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
  },
  playerEyebrow: {
    color: colors.leafDeep,
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
    color: colors.vitality,
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
