import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, createElement, type ComponentProps, type ElementType, type ReactElement } from 'react';
import { FlatList } from 'react-native';

import { SavedScreen } from '../SavedScreen';
import { SessionCard } from '../../components/SessionCard';
import { useWellness } from '../../state/WellnessProvider';
import { initialWellnessState, toggleSavedSession, type SessionActivity } from '../../state/wellnessState';
import type { MainTabScreenProps } from '../../types/navigation';

jest.mock('lucide-react-native', () => ({ Bookmark: 'Bookmark', Compass: 'Compass', Settings: 'Settings' }));
jest.mock('../../components/BreathingPressable', () => ({ BreathingPressable: 'BreathingPressable' }));
jest.mock('../../components/GradientScreen', () => ({ GradientScreen: 'GradientScreen' }));
jest.mock('../../components/SessionCard', () => ({ SessionCard: jest.fn() }));
jest.mock('../../state/WellnessProvider', () => ({ useWellness: jest.fn() }));

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

const { create } = jest.requireActual<{ create(element: ReactElement): TestRenderer }>('react-test-renderer');
const navigation = { navigate: jest.fn() };

function savedElement(): ReactElement {
  return (
    <SavedScreen
      navigation={navigation as unknown as MainTabScreenProps<'Saved'>['navigation']}
      route={{ key: 'saved-tab', name: 'Saved' }}
    />
  );
}

function createActivity(lastPlayedAt: string, completionCount: number): SessionActivity {
  return { completionCount, durationSeconds: 360, lastPlayedAt, positionSeconds: 0 };
}

describe('SavedScreen', () => {
  let renderer: TestRenderer;
  let wellness: ReturnType<typeof useWellness>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(SessionCard).mockImplementation((props) => createElement('session-card', props));
    wellness = {
      logMood: jest.fn(),
      markSessionCompleted: jest.fn(),
      recordOpened: jest.fn(),
      saveProgress: jest.fn(),
      setNeedPreference: jest.fn(),
      state: {
        ...initialWellnessState,
        activityBySessionId: {
          'five-senses': createActivity('2026-10-08T08:30:00-07:00', 2),
          'happy-place': createActivity('2026-10-08T14:00:00.000Z', 3),
        },
        savedSessionIds: ['five-senses'],
      },
      storageError: null,
      toggleSaved: jest.fn((sessionId: string) => {
        wellness = { ...wellness, state: toggleSavedSession(wellness.state, sessionId) };
      }),
    };
    jest.mocked(useWellness).mockImplementation(() => wellness);
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    jest.restoreAllMocks();
  });

  function renderSaved(): void {
    act(() => {
      renderer = create(savedElement());
    });
  }

  function cards(): readonly ComponentProps<typeof SessionCard>[] {
    return renderer.root.findAllByType(SessionCard)
      .map(({ props }) => props as ComponentProps<typeof SessionCard>);
  }

  function pressButton(label: string): void {
    const button = renderer.root.findAllByProps({ accessibilityLabel: label })[0];
    if (!button) {
      throw new Error(`Expected the ${label} button.`);
    }
    const onPress = button.props.onPress as () => void;
    act(() => onPress());
  }

  it('updates saved and recent cards together after unsaving and saving again', () => {
    renderSaved();
    expect(cards().filter(({ session }) => session.id === 'five-senses')).toHaveLength(2);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Completions: 5' }).length).toBeGreaterThan(0);

    const savedCard = cards()[0];
    act(() => {
      savedCard.onToggleSaved(savedCard.session);
      renderer.update(savedElement());
    });

    expect(wellness.toggleSaved).toHaveBeenCalledWith('five-senses');
    expect(cards().map(({ session }) => session.id)).toEqual(['five-senses', 'happy-place']);
    expect(cards()[0].isSaved).toBe(false);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Saved: 0' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: 'Your saved practices will appear here' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Completions: 5' }).length).toBeGreaterThan(0);

    const recentCard = cards()[0];
    act(() => {
      recentCard.onToggleSaved(recentCard.session);
      renderer.update(savedElement());
    });

    expect(cards().filter(({ session }) => session.id === 'five-senses')).toHaveLength(2);
    expect(cards().filter(({ session }) => session.id === 'five-senses').every(({ isSaved }) => isSaved)).toBe(true);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Saved: 1' }).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({ children: 'Your saved practices will appear here' })).toHaveLength(0);
  });

  it('uses distinct list keys when a session appears in both sections', () => {
    renderSaved();
    const list = renderer.root.findByType(FlatList).props as {
      readonly data: readonly { readonly key: string }[];
      readonly keyExtractor: (row: { readonly key: string }, index: number) => string;
    };
    const keys = list.data.map(list.keyExtractor);

    expect(new Set(keys).size).toBe(keys.length);
    expect(cards().map(({ session }) => session.id)).toEqual(['five-senses', 'five-senses', 'happy-place']);
  });

  it('skips unchanged card renders when only playback progress changes', () => {
    renderSaved();
    expect(SessionCard).toHaveBeenCalledTimes(3);
    jest.mocked(SessionCard).mockClear();

    act(() => {
      const activity = wellness.state.activityBySessionId['five-senses'];
      wellness = {
        ...wellness,
        state: {
          ...wellness.state,
          activityBySessionId: {
            ...wellness.state.activityBySessionId,
            'five-senses': { ...activity, positionSeconds: 45 },
          },
        },
      };
      renderer.update(savedElement());
    });

    expect(SessionCard).not.toHaveBeenCalled();
  });

  it('preserves Player, Settings, and Today navigation actions', () => {
    wellness = { ...wellness, state: { ...wellness.state, savedSessionIds: [] } };
    renderSaved();
    const recentCard = cards()[0];

    act(() => recentCard.onPress(recentCard.session));
    expect(navigation.navigate).toHaveBeenCalledWith('Player', { sessionId: 'five-senses' });

    pressButton('Open settings and safety information');
    expect(navigation.navigate).toHaveBeenCalledWith('Settings');

    pressButton('Browse practices');
    expect(navigation.navigate).toHaveBeenCalledWith('Today');
  });
});
