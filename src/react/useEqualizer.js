import { useSyncExternalStore } from "react";

/** Current state of an equalizer instance; re-renders whenever it changes (from the panel or from your own code). */
export function useEqualizer(eq) {
  return useSyncExternalStore(eq.subscribe, eq.getState, eq.getState);
}
