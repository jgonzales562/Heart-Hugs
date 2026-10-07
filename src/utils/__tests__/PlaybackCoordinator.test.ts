import { describe, expect, it, jest } from '@jest/globals';

import { PlaybackCoordinator } from '../PlaybackCoordinator';

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

describe('PlaybackCoordinator', () => {
  it('pauses the previous player and switches background audio off for video', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const pauseAudio = jest.fn();
    const pauseVideo = jest.fn();
    const playAudio = jest.fn();
    const playVideo = jest.fn();

    coordinator.register('audio', { kind: 'audio', pause: pauseAudio });
    coordinator.register('video', { kind: 'video', pause: pauseVideo });

    await expect(coordinator.start('audio', playAudio)).resolves.toBe(true);
    await expect(coordinator.start('video', playVideo)).resolves.toBe(true);

    expect(playAudio).toHaveBeenCalledTimes(1);
    expect(pauseAudio).toHaveBeenCalledTimes(1);
    expect(playVideo).toHaveBeenCalledTimes(1);
    expect(configureBackgroundAudio.mock.calls).toEqual([[true], [false]]);
  });

  it('cancels a stale start when a newer player is requested', async () => {
    const backgroundAudioEnabled = createDeferred<boolean>();
    const configureBackgroundAudio = jest
      .fn<(enabled: boolean) => Promise<boolean>>()
      .mockImplementationOnce(() => backgroundAudioEnabled.promise)
      .mockResolvedValue(true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const playFirst = jest.fn();
    const playSecond = jest.fn();

    coordinator.register('first', { kind: 'audio', pause: jest.fn() });
    coordinator.register('second', { kind: 'audio', pause: jest.fn() });

    const firstStart = coordinator.start('first', playFirst);
    const secondStart = coordinator.start('second', playSecond);
    backgroundAudioEnabled.resolve(true);

    await expect(firstStart).resolves.toBe(false);
    await expect(secondStart).resolves.toBe(true);
    expect(playFirst).not.toHaveBeenCalled();
    expect(playSecond).toHaveBeenCalledTimes(1);
    expect(configureBackgroundAudio).toHaveBeenCalledTimes(1);
  });

  it('does not let an inactive video disable active background audio', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);

    coordinator.register('audio', { kind: 'audio', pause: jest.fn() });
    coordinator.register('inactive-video', { kind: 'video', pause: jest.fn() });

    await coordinator.start('audio', jest.fn());
    await coordinator.stop('inactive-video');

    expect(configureBackgroundAudio.mock.calls).toEqual([[true]]);
  });

  it('releases background audio when audio completes or is stopped', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const pauseAudio = jest.fn();

    coordinator.register('audio', { kind: 'audio', pause: pauseAudio });
    await coordinator.start('audio', jest.fn());
    await coordinator.stop('audio');

    expect(pauseAudio).toHaveBeenCalledTimes(1);
    expect(configureBackgroundAudio.mock.calls).toEqual([[true], [false]]);
  });

  it('finishes without pausing an already-ended player', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const pauseAudio = jest.fn();

    coordinator.register('audio', { kind: 'audio', pause: pauseAudio });
    await coordinator.start('audio', jest.fn());
    await coordinator.finish('audio');

    expect(pauseAudio).not.toHaveBeenCalled();
    expect(configureBackgroundAudio.mock.calls).toEqual([[true], [false]]);
  });

  it('pauses and releases background audio when the active player unregisters', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const pauseAudio = jest.fn();
    const unregister = coordinator.register('audio', {
      kind: 'audio',
      pause: pauseAudio,
    });

    await coordinator.start('audio', jest.fn());
    unregister();
    await coordinator.finish('audio');

    expect(pauseAudio).toHaveBeenCalledTimes(1);
    expect(configureBackgroundAudio.mock.calls).toEqual([[true], [false]]);
  });

  it('releases the active player when a registration with the same id replaces it', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const pausePrevious = jest.fn();
    const pauseReplacement = jest.fn();

    coordinator.register('audio', { kind: 'audio', pause: pausePrevious });
    await coordinator.start('audio', jest.fn());
    coordinator.register('audio', { kind: 'audio', pause: pauseReplacement });
    await coordinator.finish('audio');

    expect(pausePrevious).toHaveBeenCalledTimes(1);
    expect(pauseReplacement).not.toHaveBeenCalled();
    expect(configureBackgroundAudio.mock.calls).toEqual([[true], [false]]);
  });

  it('continues with foreground playback when background audio configuration fails', async () => {
    const configurationError = new Error('Native configuration failed');
    const configureBackgroundAudio = jest.fn(async () => {
      throw configurationError;
    });
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const playAudio = jest.fn();
    const consoleWarning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    coordinator.register('audio', { kind: 'audio', pause: jest.fn() });

    await expect(coordinator.start('audio', playAudio)).resolves.toBe(true);

    expect(playAudio).toHaveBeenCalledTimes(1);
    expect(consoleWarning).toHaveBeenCalledWith(
      'Unable to enable background audio playback.',
      configurationError
    );
    consoleWarning.mockRestore();
  });

  it('continues with foreground playback when background audio is unavailable', async () => {
    const configureBackgroundAudio = jest.fn(async () => false);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const playAudio = jest.fn();

    coordinator.register('audio', { kind: 'audio', pause: jest.fn() });

    await expect(coordinator.start('audio', playAudio)).resolves.toBe(true);

    expect(playAudio).toHaveBeenCalledTimes(1);
    expect(configureBackgroundAudio.mock.calls).toEqual([[true]]);
  });

  it('preserves a newer playback request when an older play callback fails', async () => {
    const configureBackgroundAudio = jest.fn(async () => true);
    const coordinator = new PlaybackCoordinator(configureBackgroundAudio);
    const playError = new Error('Unable to play first');
    const playSecond = jest.fn();
    let secondStart: Promise<boolean> | undefined;

    coordinator.register('first', { kind: 'audio', pause: jest.fn() });
    coordinator.register('second', { kind: 'audio', pause: jest.fn() });

    await expect(
      coordinator.start('first', () => {
        secondStart = coordinator.start('second', playSecond);
        throw playError;
      })
    ).rejects.toBe(playError);
    await expect(secondStart).resolves.toBe(true);

    expect(playSecond).toHaveBeenCalledTimes(1);
    expect(configureBackgroundAudio.mock.calls).toEqual([[true]]);
  });
});
