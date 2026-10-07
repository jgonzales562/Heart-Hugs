export type PlaybackKind = 'audio' | 'video';

type ConfigureBackgroundAudio = (enabled: boolean) => Promise<boolean>;
type PlaybackRegistration = {
  readonly kind: PlaybackKind;
  readonly pause: () => void;
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

  register(id: string, registration: PlaybackRegistration): () => void {
    const previousRegistration = this.registrations.get(id);

    if (previousRegistration && previousRegistration !== registration) {
      if (this.desiredPlaybackId === id) {
        this.pauseRegistration(id, previousRegistration);
        this.desiredPlaybackId = null;
        void this.enqueue(() => this.releaseBackgroundAudioWhenUnused());
      }
    }

    this.registrations.set(id, registration);

    return () => {
      if (this.registrations.get(id) !== registration) {
        return;
      }

      if (this.desiredPlaybackId === id) {
        this.pauseRegistration(id, registration);
        this.desiredPlaybackId = null;
      }

      this.registrations.delete(id);
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
          this.backgroundAudioEnabled = await this.tryConfigureBackgroundAudio(true);
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
        if (this.desiredPlaybackId === id) {
          this.desiredPlaybackId = null;
        }

        await this.releaseBackgroundAudioWhenUnused();
        throw error;
      }
    });
  }

  stop(id: string): Promise<void> {
    const registration = this.registrations.get(id);

    if (registration) {
      this.pauseRegistration(id, registration);
    }

    if (this.desiredPlaybackId === id) {
      this.desiredPlaybackId = null;
    }

    return this.enqueue(() => this.releaseBackgroundAudioWhenUnused());
  }

  finish(id: string): Promise<void> {
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

  private pauseOtherPlayers(activePlaybackId: string): void {
    this.registrations.forEach((registration, playbackId) => {
      if (playbackId === activePlaybackId) {
        return;
      }

      this.pauseRegistration(playbackId, registration);
    });
  }

  private pauseRegistration(id: string, registration: PlaybackRegistration): void {
    try {
      registration.pause();
    } catch (error) {
      console.warn(`Unable to pause ${id}.`, error);
    }
  }

  private async releaseBackgroundAudioWhenUnused(): Promise<void> {
    const desiredRegistration = this.desiredPlaybackId
      ? this.registrations.get(this.desiredPlaybackId)
      : undefined;
    const anotherAudioIsStarting = desiredRegistration?.kind === 'audio';

    if (!anotherAudioIsStarting) {
      await this.disableBackgroundAudio();
    }
  }

  private async disableBackgroundAudio(): Promise<void> {
    if (!this.backgroundAudioEnabled) {
      return;
    }

    const wasDisabled = await this.tryConfigureBackgroundAudio(false);

    if (wasDisabled) {
      this.backgroundAudioEnabled = false;
    }
  }

  private async tryConfigureBackgroundAudio(enabled: boolean): Promise<boolean> {
    try {
      return await this.configureBackgroundAudio(enabled);
    } catch (error) {
      console.warn(
        `Unable to ${enabled ? 'enable' : 'disable'} background audio playback.`,
        error
      );
      return false;
    }
  }
}
