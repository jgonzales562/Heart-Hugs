import { useEventListener } from 'expo';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, theme } from '../theme';
import { Session } from '../types/session';
import { formatPlaybackTime } from '../utils/time';

type MediaPlayerProps = {
  session: Session;
};

export function MediaPlayer({ session }: MediaPlayerProps) {
  if (session.mediaType === 'video') {
    return <VideoSessionPlayer session={session} />;
  }

  return <AudioSessionPlayer session={session} />;
}

function AudioSessionPlayer({ session }: MediaPlayerProps) {
  const player = useAudioPlayer(session.mediaUrl, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.loop = false;
    player.volume = 0.86;
  }, [player]);

  const progress = useMemo(() => {
    if (!status.duration) {
      return 0;
    }

    return Math.min(status.currentTime / status.duration, 1);
  }, [status.currentTime, status.duration]);

  function togglePlayback() {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  return (
    <View style={styles.playerSurface}>
      <Image source={{ uri: session.thumbnailUrl }} style={styles.audioArtwork} />
      <View style={styles.audioCopy}>
        <Text style={styles.playerEyebrow}>Audio session</Text>
        <Text style={styles.playerTitle}>{session.title}</Text>
        <Text style={styles.playerDescription}>{session.description}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.controlsRow}>
        <Text style={styles.timeText}>{formatPlaybackTime(status.currentTime)}</Text>
        <Pressable
          accessibilityLabel={status.playing ? 'Pause audio session' : 'Play audio session'}
          accessibilityRole="button"
          onPress={togglePlayback}
          style={styles.playButton}
        >
          {status.playing ? (
            <Pause color={colors.offWhite} fill={colors.offWhite} size={24} />
          ) : (
            <Play color={colors.offWhite} fill={colors.offWhite} size={24} />
          )}
        </Pressable>
        <Text style={styles.timeText}>{formatPlaybackTime(status.duration)}</Text>
      </View>
    </View>
  );
}

function VideoSessionPlayer({ session }: MediaPlayerProps) {
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

  useEventListener(player, 'playingChange', ({ isPlaying: nextIsPlaying }) => {
    setIsPlaying(nextIsPlaying);
  });

  useEventListener(player, 'timeUpdate', ({ currentTime: nextCurrentTime }) => {
    setCurrentTime(nextCurrentTime);
    setDuration(player.duration);
  });

  useEventListener(player, 'statusChange', () => {
    setDuration(player.duration);
  });

  function togglePlayback() {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  return (
    <View style={styles.playerSurface}>
      <View style={styles.videoShell}>
        <VideoView
          allowsFullscreen
          contentFit="cover"
          nativeControls={false}
          player={player}
          style={styles.video}
        />
        <Pressable
          accessibilityLabel={isPlaying ? 'Pause video session' : 'Play video session'}
          accessibilityRole="button"
          onPress={togglePlayback}
          style={styles.videoPlayButton}
        >
          {isPlaying ? (
            <Pause color={colors.offWhite} fill={colors.offWhite} size={28} />
          ) : (
            <Play color={colors.offWhite} fill={colors.offWhite} size={28} />
          )}
        </Pressable>
      </View>

      <View style={styles.audioCopy}>
        <Text style={styles.playerEyebrow}>Video session</Text>
        <Text style={styles.playerTitle}>{session.title}</Text>
        <Text style={styles.playerDescription}>{session.description}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.videoTimeRow}>
        <Text style={styles.timeText}>{formatPlaybackTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatPlaybackTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerSurface: {
    backgroundColor: colors.warmWhite,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  audioArtwork: {
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    width: '100%',
  },
  audioCopy: {
    gap: theme.spacing.xs,
  },
  playerEyebrow: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'uppercase',
  },
  playerTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  playerDescription: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  progressTrack: {
    backgroundColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    height: 7,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: colors.tealDeep,
    borderRadius: theme.radius.full,
    height: '100%',
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: theme.radius.full,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  timeText: {
    color: colors.slate,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    minWidth: 42,
  },
  videoShell: {
    aspectRatio: 16 / 10,
    backgroundColor: colors.navy,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  video: {
    height: '100%',
    width: '100%',
  },
  videoPlayButton: {
    alignItems: 'center',
    backgroundColor: colors.transparentNavy,
    borderColor: colors.offWhiteTransparent,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -32,
    marginTop: -32,
    position: 'absolute',
    top: '50%',
    width: 64,
  },
  videoTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
