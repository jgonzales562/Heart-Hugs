import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, type ComponentProps, type ElementType, type ReactElement } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { PlayerScreen } from '../PlayerScreen';
import { BreathingPressable } from '../../components/BreathingPressable';
import { MediaPlayer } from '../../components/MediaPlayer';
import { SessionCard } from '../../components/SessionCard';
import { useWellness } from '../../state/WellnessProvider';
import { initialWellnessState, type SessionActivity } from '../../state/wellnessState';
import type { RootStackScreenProps } from '../../types/navigation';

jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  Bookmark: 'Bookmark',
  Check: 'Check',
  Clock3: 'Clock3',
}));
jest.mock('../../components/BreathingPressable', () => ({ BreathingPressable: 'BreathingPressable' }));
jest.mock('../../components/GradientScreen', () => ({ GradientScreen: 'GradientScreen' }));
jest.mock('../../components/MediaPlayer', () => ({ MediaPlayer: 'MediaPlayer' }));
jest.mock('../../components/SessionCard', () => ({ SessionCard: 'SessionCard' }));
jest.mock('../../state/WellnessProvider', () => ({ useWellness: jest.fn() }));

// jest-expo supplies the renderer; keep the small surface used by these lifecycle tests typed.
type TestInstance = {
  readonly props: Record<string, unknown>;
  findByType(type: ElementType): TestInstance;
  findAllByType(type: ElementType): readonly TestInstance[];
  findAllByProps(props: Readonly<Record<string, unknown>>): readonly TestInstance[];
};

type TestRenderer = {
  readonly root: TestInstance;
  unmount(): void;
  update(element: ReactElement): void;
};

const { create } = jest.requireActual<{
  create(element: ReactElement): TestRenderer;
}>('react-test-renderer');

const navigation = {
  goBack: jest.fn(),
  popTo: jest.fn(),
  replace: jest.fn(),
};

function playerElement(sessionId: string): ReactElement {
  return (
    <PlayerScreen
      navigation={navigation as unknown as RootStackScreenProps<'Player'>['navigation']}
      route={{ key: 'same-player-route', name: 'Player', params: { sessionId } }}
    />
  );
}

function createActivity(positionSeconds: number): SessionActivity {
  return {
    completionCount: 0,
    durationSeconds: 360,
    lastPlayedAt: '2026-10-08T12:00:00.000Z',
    positionSeconds,
  };
}

describe('PlayerScreen', () => {
  let renderer: TestRenderer;
  let wellness: ReturnType<typeof useWellness>;

  beforeEach(() => {
    jest.clearAllMocks();
    wellness = {
      logMood: jest.fn(),
      markSessionCompleted: jest.fn(),
      recordOpened: jest.fn(),
      saveProgress: jest.fn(),
      setNeedPreference: jest.fn(),
      state: {
        ...initialWellnessState,
        activityBySessionId: {
          'five-senses': createActivity(45),
          'happy-place': createActivity(120),
        },
      },
      storageError: null,
      toggleSaved: jest.fn(),
    };
    jest.mocked(useWellness).mockImplementation(() => wellness);
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    jest.restoreAllMocks();
  });

  function renderPlayer(sessionId: string): void {
    act(() => {
      renderer = create(playerElement(sessionId));
    });
  }

  function mediaProps(): ComponentProps<typeof MediaPlayer> {
    return renderer.root.findByType(MediaPlayer).props as ComponentProps<typeof MediaPlayer>;
  }

  it('offers a route to Today for a missing session without mounting media or recording activity', () => {
    renderPlayer('missing-session');

    expect(renderer.root.findAllByProps({ children: 'Session unavailable' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByType(MediaPlayer)).toHaveLength(0);
    expect(renderer.root.findAllByType(SessionCard)).toHaveLength(0);
    expect(useWellness).not.toHaveBeenCalled();
    expect(wellness.recordOpened).not.toHaveBeenCalled();
    expect(wellness.saveProgress).not.toHaveBeenCalled();
    expect(wellness.markSessionCompleted).not.toHaveBeenCalled();

    const button = renderer.root.findByType(BreathingPressable).props as ComponentProps<typeof BreathingPressable>;
    act(() => button.onPress?.({} as Parameters<NonNullable<typeof button.onPress>>[0]));

    expect(navigation.popTo).toHaveBeenCalledWith('MainTabs', { screen: 'Today' });
  });

  it('retains the opening resume snapshot while progress changes for the same session', () => {
    renderPlayer('five-senses');
    expect(mediaProps().initialPosition).toBe(45);

    act(() => {
      mediaProps().onProgress?.(70, 360);
      wellness = {
        ...wellness,
        state: {
          ...wellness.state,
          activityBySessionId: { ...wellness.state.activityBySessionId, 'five-senses': createActivity(70) },
        },
      };
      renderer.update(playerElement('five-senses'));
    });

    expect(mediaProps().initialPosition).toBe(45);
    expect(wellness.saveProgress).toHaveBeenCalledWith('five-senses', 70, 360);
    expect(wellness.recordOpened).toHaveBeenCalledTimes(1);
  });

  it('resets resume and completion state when the session id changes on the same route', () => {
    renderPlayer('five-senses');
    act(() => mediaProps().onComplete?.());
    expect(renderer.root.findAllByProps({ role: 'status' }).length).toBeGreaterThan(0);
    expect(wellness.markSessionCompleted).toHaveBeenCalledWith('five-senses');

    act(() => renderer.update(playerElement('happy-place')));

    expect(mediaProps().session.id).toBe('happy-place');
    expect(mediaProps().initialPosition).toBe(120);
    expect(renderer.root.findAllByProps({ role: 'status' })).toHaveLength(0);
    act(() => mediaProps().onPause?.(150, 360));
    expect(wellness.saveProgress).toHaveBeenCalledWith('happy-place', 150, 360, true);
    expect(wellness.recordOpened).toHaveBeenNthCalledWith(2, 'happy-place');

    act(() => renderer.update(playerElement('five-senses')));
    expect(mediaProps().initialPosition).toBe(45);
    expect(renderer.root.findAllByProps({ role: 'status' })).toHaveLength(0);
  });

  it('unmounts the experience when the route changes to an unavailable session', () => {
    renderPlayer('five-senses');
    act(() => renderer.update(playerElement('missing-session')));

    expect(renderer.root.findAllByType(MediaPlayer)).toHaveLength(0);
    expect(wellness.recordOpened).toHaveBeenCalledTimes(1);
    expect(wellness.recordOpened).toHaveBeenCalledWith('five-senses');
  });

  it('exposes completion as a polite status and queues its announcement on iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    renderPlayer('five-senses');
    expect(announce).not.toHaveBeenCalled();

    act(() => mediaProps().onComplete?.());

    expect(renderer.root.findAllByProps({
      accessible: true,
      accessibilityLabel: 'Session complete. Take a moment to notice how you feel now.',
      accessibilityLiveRegion: 'polite',
      role: 'status',
    }).length).toBeGreaterThan(0);
    expect(announce).toHaveBeenCalledWith(
      'Session complete. Take a moment to notice how you feel now.',
      { queue: true }
    );
    expect(renderer.root.findAllByProps({ children: 'Continue from your last listening position.' })).toHaveLength(0);

    act(() => renderer.update(playerElement('five-senses')));
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('uses the status live region on Android without a second explicit announcement', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    renderPlayer('five-senses');
    act(() => mediaProps().onComplete?.());

    expect(renderer.root.findAllByProps({ accessibilityLiveRegion: 'polite', role: 'status' }).length).toBeGreaterThan(0);
    expect(announce).not.toHaveBeenCalled();
  });

  it('keeps related-session save and replacement actions tied to the selected session', () => {
    renderPlayer('five-senses');
    const card = renderer.root.findAllByType(SessionCard)[0]?.props as ComponentProps<typeof SessionCard>;

    act(() => {
      card.onPress(card.session);
      card.onToggleSaved(card.session);
    });

    expect(navigation.replace).toHaveBeenCalledWith('Player', { sessionId: card.session.id });
    expect(wellness.toggleSaved).toHaveBeenCalledWith(card.session.id);
  });
});
