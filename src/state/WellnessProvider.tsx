import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import { sessionRepository } from '../content/sessionRepository';
import { WELLNESS_STATE_KEY } from '../constants/storage';
import type { WellnessNeedId } from '../types/session';
import {
  initialWellnessState,
  parseWellnessState,
  recordMoodCheckIn,
  recordPlaybackProgress,
  recordSessionCompleted,
  recordSessionOpened,
  toggleSavedSession,
} from './wellnessState';
import type { WellnessState } from './wellnessState';

const knownSessionIds: ReadonlySet<string> = new Set(
  sessionRepository.getAll().map((session) => session.id)
);
const LOAD_ERROR_MESSAGE =
  'Some saved activity could not be loaded. It will not be replaced unless you make a new change.';
const SAVE_ERROR_MESSAGE =
  'Recent changes could not be saved to this device. Heart Hugs will retry after another change.';

type WellnessContextValue = {
  logMood(value: number): void;
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
  storageError: string | null;
  toggleSaved(sessionId: string): void;
};

type WellnessProviderProps = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
};

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function WellnessProvider({ children, fallback }: WellnessProviderProps) {
  const [state, setState] = useState(initialWellnessState);
  const stateRef = useRef(initialWellnessState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const canPersist = useRef(false);
  const isMounted = useRef(true);
  const lastQueuedValue = useRef<string | null>(null);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const skipNextDebouncedWrite = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const persistState = useCallback((nextState: WellnessState) => {
    if (!canPersist.current) {
      return persistenceQueue.current;
    }

    const serializedState = JSON.stringify(nextState);

    if (serializedState === lastQueuedValue.current) {
      return persistenceQueue.current;
    }

    lastQueuedValue.current = serializedState;
    persistenceQueue.current = persistenceQueue.current
      .then(() => AsyncStorage.setItem(WELLNESS_STATE_KEY, serializedState))
      .then(() => {
        if (isMounted.current) {
          setStorageError(null);
        }
      })
      .catch((error) => {
        if (lastQueuedValue.current === serializedState) {
          lastQueuedValue.current = null;
        }

        if (isMounted.current) {
          setStorageError(SAVE_ERROR_MESSAGE);
        }

        console.warn('Unable to save Heart Hugs activity.', error);
      });

    return persistenceQueue.current;
  }, []);

  const updateState = useCallback(
    (
      updater: (currentState: WellnessState) => WellnessState,
      persistImmediately = false
    ) => {
      const currentState = stateRef.current;
      const nextState = updater(currentState);

      if (nextState !== currentState) {
        canPersist.current = true;
        stateRef.current = nextState;
        setState(nextState);
      }

      if (persistImmediately) {
        void persistState(nextState);
      }
    },
    [persistState]
  );

  useEffect(() => {
    let isHydrationActive = true;

    AsyncStorage.getItem(WELLNESS_STATE_KEY)
      .then((storedValue) => {
        if (isHydrationActive) {
          const hydratedState = parseWellnessState(
            storedValue,
            Array.from(knownSessionIds)
          );

          canPersist.current = true;
          stateRef.current = hydratedState;
          setState(hydratedState);
          setStorageError(null);

          if (storedValue !== null && storedValue !== JSON.stringify(hydratedState)) {
            void persistState(hydratedState);
          }
        }
      })
      .catch((error) => {
        canPersist.current = false;
        skipNextDebouncedWrite.current = true;
        console.warn('Unable to load saved Heart Hugs activity.', error);

        if (isHydrationActive) {
          setStorageError(LOAD_ERROR_MESSAGE);
        }
      })
      .finally(() => {
        if (isHydrationActive) {
          setIsHydrated(true);
        }
      });

    return () => {
      isHydrationActive = false;
    };
  }, [persistState]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (skipNextDebouncedWrite.current) {
      skipNextDebouncedWrite.current = false;
      return;
    }

    if (!canPersist.current) {
      return;
    }

    const persistenceTimer = setTimeout(() => {
      void persistState(state);
    }, 350);

    return () => clearTimeout(persistenceTimer);
  }, [isHydrated, persistState, state]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active' && canPersist.current) {
        void persistState(stateRef.current);
      }
    });

    return () => subscription.remove();
  }, [isHydrated, persistState]);

  const markSessionCompleted = useCallback((sessionId: string) => {
    if (!knownSessionIds.has(sessionId)) {
      return;
    }

    updateState((currentState) => recordSessionCompleted(currentState, sessionId), true);
  }, [updateState]);

  const logMood = useCallback((value: number) => {
    updateState((currentState) => recordMoodCheckIn(currentState, value));
  }, [updateState]);

  const recordOpened = useCallback((sessionId: string) => {
    if (!knownSessionIds.has(sessionId)) {
      return;
    }

    updateState((currentState) => recordSessionOpened(currentState, sessionId));
  }, [updateState]);

  const saveProgress = useCallback(
    (
      sessionId: string,
      positionSeconds: number,
      durationSeconds: number,
      persistImmediately = false
    ) => {
      if (!knownSessionIds.has(sessionId)) {
        return;
      }

      updateState(
        (currentState) =>
          recordPlaybackProgress(currentState, sessionId, positionSeconds, durationSeconds),
        persistImmediately
      );
    },
    [updateState]
  );

  const setNeedPreference = useCallback((needPreference: WellnessNeedId) => {
    updateState((currentState) =>
      currentState.needPreference === needPreference
        ? currentState
        : { ...currentState, needPreference }
    );
  }, [updateState]);

  const toggleSaved = useCallback((sessionId: string) => {
    if (!knownSessionIds.has(sessionId)) {
      return;
    }

    updateState((currentState) => toggleSavedSession(currentState, sessionId));
  }, [updateState]);

  const value = useMemo<WellnessContextValue>(
    () => ({
      logMood,
      markSessionCompleted,
      recordOpened,
      saveProgress,
      setNeedPreference,
      state,
      storageError,
      toggleSaved,
    }),
    [
      logMood,
      markSessionCompleted,
      recordOpened,
      saveProgress,
      setNeedPreference,
      state,
      storageError,
      toggleSaved,
    ]
  );

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  const context = useContext(WellnessContext);

  if (!context) {
    throw new Error('useWellness must be used within WellnessProvider.');
  }

  return context;
}
