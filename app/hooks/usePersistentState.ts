// ============================================================================
// PERSISTENCE HOOK: Manages state persistence to localStorage.
// PURPOSE: To abstract data storage for easy migration and to avoid repetitive
// localStorage logic. It's a reusable pattern for syncing state with the browser's storage.
// STRATEGY: This hook encapsulates the logic for reading from and writing to
// localStorage. It handles JSON serialization/deserialization, including for Sets.
// This can be swapped with another storage mechanism (e.g., IndexedDB) in one place.
// DEPENDENCIES: 'react' (useState, useEffect).
// INVARIANTS: The key must be unique. The initialValue is used only if no value
// is found in storage.
// ============================================================================

import { useState, useEffect } from "react";

const usePersistentState = <T extends object>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);
      // Handle Set deserialization
      if (initialValue instanceof Set) {
        return new Set(parsed) as T;
      }
       if (Array.isArray(initialValue)) {
        return parsed as T;
      }
      return parsed;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const valueToStore =
        state instanceof Set
          ? JSON.stringify(Array.from(state as Set<unknown>))
          : JSON.stringify(state);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

export default usePersistentState;
