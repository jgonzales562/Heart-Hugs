import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, type EmitterSubscription } from 'react-native';

type StoreListener = () => void;

const listeners = new Set<StoreListener>();
let isReducedMotionEnabled = true;
let nativeSubscription: EmitterSubscription | null = null;
let preferenceRequestGeneration = 0;

function updateReducedMotionPreference(isEnabled: boolean): void {
  if (isReducedMotionEnabled === isEnabled) {
    return;
  }

  isReducedMotionEnabled = isEnabled;
  listeners.forEach((listener) => listener());
}

function startListening(): void {
  const requestGeneration = ++preferenceRequestGeneration;

  try {
    nativeSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      updateReducedMotionPreference
    );
  } catch (error) {
    console.warn('Unable to monitor the Reduce Motion preference.', error);
  }

  void AccessibilityInfo.isReduceMotionEnabled()
    .then((isEnabled) => {
      if (requestGeneration === preferenceRequestGeneration && listeners.size > 0) {
        updateReducedMotionPreference(isEnabled);
      }
    })
    .catch((error) => {
      if (requestGeneration === preferenceRequestGeneration && listeners.size > 0) {
        console.warn('Unable to read the Reduce Motion preference.', error);
      }
    });
}

function stopListening(): void {
  preferenceRequestGeneration += 1;
  nativeSubscription?.remove();
  nativeSubscription = null;
  isReducedMotionEnabled = true;
}

function subscribe(listener: StoreListener): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    startListening();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      stopListening();
    }
  };
}

function getSnapshot(): boolean {
  return isReducedMotionEnabled;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
