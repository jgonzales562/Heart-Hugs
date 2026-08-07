import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DurationPreference, sessionRepository } from '../content/sessionRepository';
import { WELLNESS_STATE_KEY } from '../constants/storage';
import { WellnessNeedId } from '../types/session';
import {
  WellnessState,
  initialWellnessState,
  parseWellnessState,
  recordPlaybackProgress,
  recordSessionCompleted,
  recordSessionOpened,
  toggleSavedSession,
} from './wellnessState';

type WellnessContextValue = {
  isHydrated: boolean;
  markSessionCompleted(sessionId: string): void;
  recordOpened(sessionId: string): void;
  saveProgress(sessionId: string, positionSeconds: number, durationSeconds: number): void;
  setDurationPreference(duration: DurationPreference): void;
  setNeedPreference(needId: WellnessNeedId): void;
  state: WellnessState;
  toggleSaved(sessionId: string): void;
};

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function WellnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialWellnessState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(WELLNESS_STATE_KEY)
      .then((storedValue) => {
        if (isMounted) {
          setState(
            parseWellnessState(
              storedValue,
              sessionRepository.getAll().map((session) => session.id)
            )
          );
        }
      })
      .catch((error) => {
        console.warn('Unable to load saved Heart Hugs activity.', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistenceTimer = setTimeout(() => {
      AsyncStorage.setItem(WELLNESS_STATE_KEY, JSON.stringify(state)).catch((error) => {
        console.warn('Unable to save Heart Hugs activity.', error);
      });
    }, 350);

    return () => clearTimeout(persistenceTimer);
  }, [isHydrated, state]);

  const markSessionCompleted = useCallback((sessionId: string) => {
    setState((currentState) => recordSessionCompleted(currentState, sessionId));
  }, []);

  const recordOpened = useCallback((sessionId: string) => {
    setState((currentState) => recordSessionOpened(currentState, sessionId));
  }, []);

  const saveProgress = useCallback(
    (sessionId: string, positionSeconds: number, durationSeconds: number) => {
      setState((currentState) =>
        recordPlaybackProgress(currentState, sessionId, positionSeconds, durationSeconds)
      );
    },
    []
  );

  const setDurationPreference = useCallback((durationPreference: DurationPreference) => {
    setState((currentState) => ({ ...currentState, durationPreference }));
  }, []);

  const setNeedPreference = useCallback((needPreference: WellnessNeedId) => {
    setState((currentState) => ({ ...currentState, needPreference }));
  }, []);

  const toggleSaved = useCallback((sessionId: string) => {
    setState((currentState) => toggleSavedSession(currentState, sessionId));
  }, []);

  const value = useMemo<WellnessContextValue>(
    () => ({
      isHydrated,
      markSessionCompleted,
      recordOpened,
      saveProgress,
      setDurationPreference,
      setNeedPreference,
      state,
      toggleSaved,
    }),
    [
      isHydrated,
      markSessionCompleted,
      recordOpened,
      saveProgress,
      setDurationPreference,
      setNeedPreference,
      state,
      toggleSaved,
    ]
  );

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  const context = useContext(WellnessContext);

  if (!context) {
    throw new Error('useWellness must be used within WellnessProvider.');
  }

  return context;
}
