export type PlaybackKind = 'audio' | 'video';

type ConfigureBackgroundAudio = (enabled: boolean) => Promise<boolean>;
type PlaybackRegistration = {
  kind: PlaybackKind;
  pause: () => void;
};

/**
 * Coordinates every mounted media player through one serialized transition queue.
 * The desired player is updated synchronously so a newer request can cancel an
 * older request while native audio configuration is still in flight.
 */
export class PlaybackCoordinator {
  private backgroundAudioEnabled = false;
  private desiredPlaybackId: string | null = null;
  private registrations = new Map<string, PlaybackRegistration>();
  private transitionQueue: Promise<void> = Promise.resolve();

  constructor(private readonly configureBackgroundAudio: ConfigureBackgroundAudio) {}

  register(id: string, registration: PlaybackRegistration) {
    this.registrations.set(id, registration);

    return () => {
      if (this.registrations.get(id) !== registration) {
        return;
      }

      this.registrations.delete(id);

      if (this.desiredPlaybackId === id) {
        this.desiredPlaybackId = null;
      }

      void this.enqueue(() => this.releaseBackgroundAudioWhenUnused());
    };
  }

  start(id: string, play: () => void): Promise<boolean> {
    const registration = this.registrations.get(id);

    if (!registration) {
      return Promise.resolve(false);
    }

    this.desiredPlaybackId = id;
    this.pauseOtherPlayers(id);

    return this.enqueue(async () => {
      const currentRegistration = this.registrations.get(id);

      if (this.desiredPlaybackId !== id || currentRegistration !== registration) {
        return false;
      }

      if (registration.kind === 'audio') {
        if (!this.backgroundAudioEnabled) {
          this.backgroundAudioEnabled = await this.configureBackgroundAudio(true);
        }

      } else {
        await this.disableBackgroundAudio();
      }

      if (this.desiredPlaybackId !== id || this.registrations.get(id) !== registration) {
        return false;
      }

      try {
        play();
        return true;
      } catch (error) {
        this.desiredPlaybackId = null;
        await this.releaseBackgroundAudioWhenUnused();
        throw error;
      }
    });
  }

  stop(id: string): Promise<void> {
    try {
      this.registrations.get(id)?.pause();
    } catch (error) {
      console.warn(`Unable to stop ${id}.`, error);
    }

    if (this.desiredPlaybackId === id) {
      this.desiredPlaybackId = null;
    }

    return this.enqueue(() => this.releaseBackgroundAudioWhenUnused());
  }

  private enqueue<T>(transition: () => Promise<T>): Promise<T> {
    const result = this.transitionQueue.then(transition, transition);
    this.transitionQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  private pauseOtherPlayers(activePlaybackId: string) {
    this.registrations.forEach((registration, playbackId) => {
      if (playbackId === activePlaybackId) {
        return;
      }

      try {
        registration.pause();
      } catch (error) {
        console.warn(`Unable to pause ${playbackId}.`, error);
      }
    });
  }

  private async releaseBackgroundAudioWhenUnused() {
    const desiredRegistration = this.desiredPlaybackId
      ? this.registrations.get(this.desiredPlaybackId)
      : undefined;
    const anotherAudioIsStarting = desiredRegistration?.kind === 'audio';

    if (!anotherAudioIsStarting) {
      await this.disableBackgroundAudio();
    }
  }

  private async disableBackgroundAudio() {
    if (!this.backgroundAudioEnabled) {
      return;
    }

    const wasDisabled = await this.configureBackgroundAudio(false);

    if (wasDisabled) {
      this.backgroundAudioEnabled = false;
    }
  }
}
