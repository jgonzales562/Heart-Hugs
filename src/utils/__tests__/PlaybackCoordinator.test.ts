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
});
