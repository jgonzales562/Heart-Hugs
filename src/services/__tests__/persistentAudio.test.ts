import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockCreateAudioPlayer = jest.fn();
const mockFinish = jest.fn(async () => undefined);
const mockRegister = jest.fn<
  (id: string, registration: { kind: 'audio'; pause(): void }) => () => void
>(() => jest.fn());
const mockStop = jest.fn(async () => undefined);

jest.mock('expo-audio', () => ({
  createAudioPlayer: mockCreateAudioPlayer,
}));

jest.mock('../playback', () => ({
  playbackCoordinator: {
    finish: mockFinish,
    register: mockRegister,
    stop: mockStop,
  },
}));

type StatusListener = (status: { didJustFinish: boolean }) => void;

function createPlayerMock() {
  const statusSubscription = { remove: jest.fn() };
  const player = {
    addListener: jest.fn((_eventName: string, _listener: StatusListener) => statusSubscription),
    clearLockScreenControls: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
  };

  return { player, statusSubscription };
}

describe('persistent audio', () => {
  let persistentAudio: typeof import('../persistentAudio');
  let createdPlayers: ReturnType<typeof createPlayerMock>[];

  beforeEach(() => {
    jest.resetModules();
    mockCreateAudioPlayer.mockReset();
    mockFinish.mockClear();
    mockRegister.mockClear();
    mockStop.mockClear();
    createdPlayers = [];
    mockCreateAudioPlayer.mockImplementation(() => {
      const createdPlayer = createPlayerMock();
      createdPlayers.push(createdPlayer);
      return createdPlayer.player;
    });
    persistentAudio = jest.requireActual<typeof import('../persistentAudio')>(
      '../persistentAudio'
    );
  });

  it('reuses the player only when both session id and media URL match', () => {
    const firstPlayer = persistentAudio.getPersistentAudioPlayer('session-one', 'https://a.test');
    const reusedPlayer = persistentAudio.getPersistentAudioPlayer('session-one', 'https://a.test');
    const replacementPlayer = persistentAudio.getPersistentAudioPlayer(
      'session-one',
      'https://b.test'
    );

    expect(reusedPlayer).toBe(firstPlayer);
    expect(replacementPlayer).not.toBe(firstPlayer);
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(2);
    expect(mockCreateAudioPlayer).toHaveBeenNthCalledWith(1, 'https://a.test', {
      updateInterval: 500,
    });
    expect(mockStop).toHaveBeenCalledWith(
      persistentAudio.PERSISTENT_AUDIO_PLAYBACK_ID
    );
    expect(createdPlayers[0]?.statusSubscription.remove).toHaveBeenCalledTimes(1);
    expect(createdPlayers[0]?.player.remove).toHaveBeenCalledTimes(1);
  });

  it('pauses active audio and clears its lock-screen controls through the coordinator', () => {
    persistentAudio.getPersistentAudioPlayer('session-one', 'https://a.test');
    const registration = mockRegister.mock.calls[0]?.[1] as
      | { pause(): void }
      | undefined;

    if (!registration) {
      throw new Error('Expected the persistent audio coordinator registration.');
    }

    registration.pause();

    expect(createdPlayers[0]?.player.pause).toHaveBeenCalledTimes(1);
    expect(createdPlayers[0]?.player.clearLockScreenControls).toHaveBeenCalledTimes(1);
  });

  it('continues releasing the player when listener cleanup fails', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    persistentAudio.getPersistentAudioPlayer('session-one', 'https://a.test');
    createdPlayers[0]?.statusSubscription.remove.mockImplementation(() => {
      throw new Error('listener cleanup failed');
    });

    persistentAudio.getPersistentAudioPlayer('session-two', 'https://b.test');

    expect(createdPlayers[0]?.player.remove).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'Unable to remove audio status listener.',
      expect.any(Error)
    );
    warn.mockRestore();
  });

  it('releases a newly created player when listener registration fails', () => {
    const { player } = createPlayerMock();
    player.addListener.mockImplementation(() => {
      throw new Error('listener registration failed');
    });
    mockCreateAudioPlayer.mockReset().mockReturnValue(player);

    expect(() =>
      persistentAudio.getPersistentAudioPlayer('session-one', 'https://a.test')
    ).toThrow('listener registration failed');
    expect(player.remove).toHaveBeenCalledTimes(1);
  });

  it('notifies the coordinator when playback finishes without a mounted screen', () => {
    persistentAudio.getPersistentAudioPlayer('session-one', 'https://a.test');
    const listener = createdPlayers[0]?.player.addListener.mock.calls[0]?.[1] as
      | StatusListener
      | undefined;

    if (!listener) {
      throw new Error('Expected an audio status listener.');
    }

    listener({ didJustFinish: true });

    expect(createdPlayers[0]?.player.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(mockFinish).toHaveBeenCalledWith(
      persistentAudio.PERSISTENT_AUDIO_PLAYBACK_ID
    );
  });
});
