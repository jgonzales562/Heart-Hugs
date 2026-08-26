import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { sessionRepository } from '../content/sessionRepository';
import { WELLNESS_STATE_KEY } from '../constants/storage';
import { WellnessNeedId } from '../types/session';
import {
  WellnessState,
  initialWellnessState,
  parseWellnessState,
  recordMoodCheckIn,
  recordPlaybackProgress,
  recordSessionCompleted,
  recordSessionOpened,
  toggleSavedSession,
} from './wellnessState';

type WellnessContextValue = {
  isHydrated: boolean;
  logMood(value: number, note?: string): void;
  markSessionCompleted(sessionId: string): void;
  recordOpened(sessionId: string): void;
  saveProgress(
    sessionId: string,
    positionSeconds: number,
    durationSeconds: number,
    persistImmediately?: boolean
  ): void;
  setNeedPreference(needId: WellnessNeedId): void;
  state: WellnessState;
  toggleSaved(sessionId: string): void;
};

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function WellnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialWellnessState);
  const stateRef = useRef(initialWellnessState);
  const [isHydrated, setIsHydrated] = useState(false);

  const updateState = useCallback(
    (
      updater: (currentState: WellnessState) => WellnessState,
      persistImmediately = false
    ) => {
      const nextState = updater(stateRef.current);

      stateRef.current = nextState;
      setState(nextState);

      if (persistImmediately) {
        void persistWellnessState(nextState);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(WELLNESS_STATE_KEY)
      .then((storedValue) => {
        if (isMounted) {
          const hydratedState = parseWellnessState(
            storedValue,
            sessionRepository.getAll().map((session) => session.id)
          );

          stateRef.current = hydratedState;
          setState(hydratedState);
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
      void persistWellnessState(state);
    }, 350);

    return () => clearTimeout(persistenceTimer);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        void persistWellnessState(stateRef.current);
      }
    });

    return () => subscription.remove();
  }, [isHydrated]);

  const markSessionCompleted = useCallback((sessionId: string) => {
    updateState((currentState) => recordSessionCompleted(currentState, sessionId), true);
  }, [updateState]);

  const logMood = useCallback((value: number, note = '') => {
    updateState((currentState) => recordMoodCheckIn(currentState, value, note));
  }, [updateState]);

  const recordOpened = useCallback((sessionId: string) => {
    updateState((currentState) => recordSessionOpened(currentState, sessionId));
  }, [updateState]);

  const saveProgress = useCallback(
    (
      sessionId: string,
      positionSeconds: number,
      durationSeconds: number,
      persistImmediately = false
    ) => {
      updateState(
        (currentState) =>
          recordPlaybackProgress(currentState, sessionId, positionSeconds, durationSeconds),
        persistImmediately
      );
    },
    [updateState]
  );

  const setNeedPreference = useCallback((needPreference: WellnessNeedId) => {
    updateState((currentState) => ({ ...currentState, needPreference }));
  }, [updateState]);

  const toggleSaved = useCallback((sessionId: string) => {
    updateState((currentState) => toggleSavedSession(currentState, sessionId));
  }, [updateState]);

  const value = useMemo<WellnessContextValue>(
    () => ({
      isHydrated,
      logMood,
      markSessionCompleted,
      recordOpened,
      saveProgress,
      setNeedPreference,
      state,
      toggleSaved,
    }),
    [
      isHydrated,
      logMood,
      markSessionCompleted,
      recordOpened,
      saveProgress,
      setNeedPreference,
      state,
      toggleSaved,
    ]
  );

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

function persistWellnessState(state: WellnessState) {
  return AsyncStorage.setItem(WELLNESS_STATE_KEY, JSON.stringify(state)).catch((error) => {
    console.warn('Unable to save Heart Hugs activity.', error);
  });
}

export function useWellness() {
  const context = useContext(WellnessContext);

  if (!context) {
    throw new Error('useWellness must be used within WellnessProvider.');
  }

  return context;
}
