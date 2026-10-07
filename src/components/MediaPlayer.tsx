import { useIsFocused } from '@react-navigation/native';
import { useEventListener } from 'expo';
import { useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer, type VideoPlayerStatus } from 'expo-video';
import { AlertCircle, FastForward, Rewind, RotateCcw } from 'lucide-react-native';
import {
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from './BreathingPressable';
import { PlaybackProgress } from './PlaybackProgress';
import { PlaybackToggle } from './PlaybackToggle';
import { playbackCoordinator } from '../services/playback';
import {
  getPersistentAudioPlayer,
  PERSISTENT_AUDIO_PLAYBACK_ID,
} from '../services/persistentAudio';
import { colors, gradients, theme } from '../theme';
import type { Session } from '../types/session';
import type { PlaybackKind } from '../utils/PlaybackCoordinator';
import {
  getNextAudioPlaybackRate,
  getRetryRestorePosition,
  getSupportedAudioPlaybackRate,
  runPlaybackCompletion,
  shouldRestorePlaybackPosition,
} from '../utils/mediaPlayback';
import { sanitizePlaybackTime } from '../utils/playbackProgress';

type MediaPlayerProps = {
  readonly initialPosition?: number;
  readonly onComplete?: () => void;
  readonly onPause?: (currentTime: number, duration: number) => void;
  readonly onProgress?: (currentTime: number, duration: number) => void;
  readonly session: Session;
};

const MEDIA_LOAD_TIMEOUT_MS = 15_000;
const AUDIO_LOADING_MESSAGE_DELAY_MS = 2_000;
const VIDEO_CONTROL_GRADIENT = [
  'rgba(23, 42, 68, 0)',
  'rgba(23, 42, 68, 0.72)',
] as const;

function usePlaybackInstanceId(): string {
  return `media-player-${useId()}`;
}

function useRegisteredPlaybackPauser(
  playbackId: string,
  kind: PlaybackKind,
  pausePlayback: () => void
): void {
  const onPausePlayback = useEffectEvent(pausePlayback);

  useEffect(() => {
    return playbackCoordinator.register(playbackId, {
      kind,
      pause: onPausePlayback,
    });
  }, [kind, playbackId]);
}

function configureAudioPlayer(player: AudioPlayer): void {
  player.loop = false;
  player.volume = 0.86;
}

function completePlayback(
  playbackId: string,
  sessionTitle: string,
  reportCompletion: () => void
): void {
  void runPlaybackCompletion(
    () => playbackCoordinator.finish(playbackId),
    reportCompletion,
    (error) => console.warn(`Unable to finish ${sessionTitle}.`, error)
  );
}

export function MediaPlayer(props: MediaPlayerProps): ReactElement {
  if (props.session.mediaType === 'video') {
    return <VideoSessionPlayer {...props} />;
  }

  return <AudioSessionPlayer {...props} />;
}

function AudioSessionPlayer({
  initialPosition = 0,
  onComplete,
  onPause,
  onProgress,
  session,
}: MediaPlayerProps): ReactElement {
  const [player] = useState(() =>
    getPersistentAudioPlayer(session.id, session.mediaUrl)
  );
  const status = useAudioPlayerStatus(player);
  const [isStarting, setIsStarting] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const restorePosition = useRef(sanitizePlaybackTime(initialPosition));
  const hasRestoredPosition = useRef(false);
  const hasReportedCompletion = useRef(false);
  const wasPlaying = useRef(false);
  const reportProgress = useEffectEvent((position: number, totalDuration: number) => {
    onProgress?.(position, totalDuration);
  });
  const reportPause = useEffectEvent((position: number, totalDuration: number) => {
    onPause?.(position, totalDuration);
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
        completePlayback(PERSISTENT_AUDIO_PLAYBACK_ID, session.title, reportCompletion);
      }
    }
  }, [session.title, status.didJustFinish]);

  const currentTime = sanitizePlaybackTime(status.currentTime);
  const duration = sanitizePlaybackTime(status.duration);
  const playbackRate = getSupportedAudioPlaybackRate(status.playbackRate);

  useEffect(() => {
    if (loadError) {
      void playbackCoordinator.stop(PERSISTENT_AUDIO_PLAYBACK_ID);
    }
  }, [loadError]);

  useEffect(() => {
    if (!status.isLoaded || hasRestoredPosition.current) {
      return;
    }

    hasRestoredPosition.current = true;

    if (shouldRestorePlaybackPosition(currentTime, restorePosition.current, duration)) {
      void player.seekTo(restorePosition.current).catch((error) => {
        console.warn(`Unable to restore ${session.title}.`, error);
      });
    }
  }, [currentTime, duration, player, session.title, status.isLoaded]);

  useEffect(() => {
    if (duration > 0) {
      reportProgress(currentTime, duration);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (wasPlaying.current && !status.playing && !status.didJustFinish) {
      reportPause(currentTime, duration);
    }

    wasPlaying.current = status.playing;
  }, [currentTime, duration, status.didJustFinish, status.playing]);

  async function togglePlayback(): Promise<void> {
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
        player.setActiveForLockScreen(
          true,
          {
            artist: 'Heart Hugs',
            artworkUrl: session.thumbnailUrl,
            title: session.title,
          },
          {
            showSeekBackward: true,
            showSeekForward: true,
          }
        );
        player.play();
      });
    } catch (error) {
      await playbackCoordinator.stop(PERSISTENT_AUDIO_PLAYBACK_ID);
      console.warn(`Unable to play ${session.title}.`, error);
      setPlaybackError('Playback could not start. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  async function seekAudio(time: number): Promise<void> {
    if (!status.isLoaded) {
      return;
    }

    try {
      await player.seekTo(time);
      setPlaybackError(null);
    } catch (error) {
      console.warn(`Unable to seek ${session.title}.`, error);
      setPlaybackError('Playback could not seek to that position. Please try again.');
    }
  }

  function cycleAudioPlaybackRate(): void {
    try {
      player.setPlaybackRate(getNextAudioPlaybackRate(playbackRate));
      setPlaybackError(null);
    } catch (error) {
      console.warn(`Unable to change playback speed for ${session.title}.`, error);
      setPlaybackError('Playback speed could not be changed. Please try again.');
    }
  }

  function retryAudio(): void {
    restorePosition.current = getRetryRestorePosition(
      currentTime,
      restorePosition.current
    );
    hasRestoredPosition.current = false;
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
        <SessionCopy session={session} />

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
          tone="overlay"
        />
      </LinearGradient>
    </View>
  );
}

function VideoSessionPlayer({
  initialPosition = 0,
  onComplete,
  onPause,
  onProgress,
  session,
}: MediaPlayerProps): ReactElement {
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
  const restorePosition = useRef(sanitizePlaybackTime(initialPosition));
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
    try {
      player.pause();
    } finally {
      setIsPlaying(false);
      onPause?.(currentTime, duration);
    }
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
      console.warn(`Unable to load ${session.title}.`, error);
      setPlaybackError('This video could not be loaded. Please try again.');
      void playbackCoordinator.stop(playbackInstanceId);
    } else if (nextStatus === 'readyToPlay') {
      setPlaybackError(null);

      if (!hasRestoredPosition.current) {
        hasRestoredPosition.current = true;

        if (
          shouldRestorePlaybackPosition(
            player.currentTime,
            restorePosition.current,
            nextDuration
          )
        ) {
          try {
            player.seekBy(restorePosition.current - player.currentTime);
            setCurrentTime(restorePosition.current);
          } catch (restoreError) {
            console.warn(`Unable to restore ${session.title}.`, restoreError);
          }
        }
      }
    }
  });

  useEventListener(player, 'playToEnd', () => {
    setCurrentTime(sanitizePlaybackTime(player.duration));
    setHasFinished(true);
    completePlayback(playbackInstanceId, session.title, () => onComplete?.());
  });

  async function togglePlayback(): Promise<void> {
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
      await playbackCoordinator.stop(playbackInstanceId);
      console.warn(`Unable to play ${session.title}.`, error);
      setPlaybackError('Playback could not start. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }

  async function retryVideo(): Promise<void> {
    await playbackCoordinator.stop(playbackInstanceId);
    restorePosition.current = getRetryRestorePosition(
      currentTime,
      restorePosition.current
    );
    hasRestoredPosition.current = false;
    setPlaybackError(null);
    setHasFinished(false);
    setPlaybackStatus('loading');
    setRetryAttempt((attempt) => attempt + 1);

    try {
      await player.replaceAsync(source);
    } catch (error) {
      console.warn(`Unable to reload ${session.title}.`, error);
      setPlaybackError('This video could not be reloaded. Please try again.');
    }
  }

  function seekVideo(time: number): void {
    if (playbackStatus !== 'readyToPlay') {
      return;
    }

    try {
      player.seekBy(time - currentTime);
      setCurrentTime(time);
      setHasFinished(duration > 0 && time >= duration);
      setPlaybackError(null);
    } catch (error) {
      console.warn(`Unable to seek ${session.title}.`, error);
      setPlaybackError('Playback could not seek to that position. Please try again.');
    }
  }

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
          nativeControls={false}
          player={player}
          style={styles.video}
          surfaceType="textureView"
        />
        <LinearGradient
          colors={VIDEO_CONTROL_GRADIENT}
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
        <SessionCopy session={session} />
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
  readonly errorMessage: string | null;
  readonly isLoading: boolean;
  readonly loadingDelayMs?: number;
  readonly loadingMessage: string;
  readonly onRetry: () => void | Promise<void>;
  readonly timeoutMessage: string;
};

function PlaybackStatusMessage({
  errorMessage,
  isLoading,
  loadingDelayMs = 0,
  loadingMessage,
  onRetry,
  timeoutMessage,
}: PlaybackStatusMessageProps): ReactElement | null {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasLoadingDelayElapsed, setHasLoadingDelayElapsed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const isRetryInFlight = useRef(false);

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

  function handleRetry(): void {
    if (isRetryInFlight.current) {
      return;
    }

    isRetryInFlight.current = true;
    setIsRetrying(true);
    void (async () => {
      try {
        await onRetry();
      } catch (error) {
        console.warn('Unable to retry media loading.', error);
      } finally {
        isRetryInFlight.current = false;
        setIsRetrying(false);
      }
    })();
  }

  if (!visibleError && (!isLoading || !isLoadingVisible)) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion={visibleError ? 'assertive' : 'polite'}
      accessibilityRole={visibleError ? 'alert' : undefined}
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
          accessibilityState={{ busy: isRetrying, disabled: isRetrying }}
          disabled={isRetrying}
          hitSlop={theme.spacing.xs}
          onPress={handleRetry}
          style={styles.retryButton}
        >
          {isRetrying ? (
            <ActivityIndicator color={colors.leafDeep} size="small" />
          ) : (
            <RotateCcw color={colors.leafDeep} size={15} />
          )}
          <Text style={styles.retryButtonText}>{isRetrying ? 'Retrying' : 'Retry'}</Text>
        </BreathingPressable>
      ) : null}
    </View>
  );
}

type SessionCopyProps = {
  readonly session: Session;
};

function SessionCopy({ session }: SessionCopyProps): ReactElement {
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

type TransportButtonProps = {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly onPress: () => void | Promise<void>;
};

function TransportButton({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
}: TransportButtonProps): ReactElement {
  function handlePress(): void {
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

type PlaybackRateButtonProps = {
  readonly onPress: () => void;
  readonly rate: number;
};

function PlaybackRateButton({ onPress, rate }: PlaybackRateButtonProps): ReactElement {
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
    alignSelf: 'center',
    backgroundColor: colors.deepOcean,
    borderRadius: theme.radius.lg,
    elevation: 5,
    gap: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    width: '92%',
  },
  audioGradient: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
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
    gap: theme.spacing.md,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  audioRing: {
    alignItems: 'center',
    backgroundColor: colors.whiteFaint,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  transportButton: {
    alignItems: 'center',
    backgroundColor: colors.whiteFaint,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    minHeight: 44,
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
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
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
    color: colors.vitality,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  playerTitle: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
    textAlign: 'center',
  },
  playerDescription: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: 'center',
  },
  videoShell: {
    aspectRatio: 16 / 9,
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
