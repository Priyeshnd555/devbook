/**
 * =================================================================================================
 * CONTEXT ANCHOR: PERSISTENT STATE HOOK (usePersistentState.ts)
 * =================================================================================================
 *
 * @purpose
 * This hook provides a `useState`-like interface but with the added functionality of automatically
 * persisting the state to the browser's `localStorage`. It abstracts away the complexities of
 * storage interaction, serialization, and deserialization.
 *
 * @dependencies
 * - REACT: `useState`, `useEffect` for state management and side effects.
 *
 * @invariants
 * 1. UNIQUE KEY: The `key` provided to this hook must be unique across the application to prevent
 *    data collisions in `localStorage`.
 * 2. INITIAL VALUE FALLBACK: The `initialValue` is only used if no value is found in storage for
 *    the given key, or if an error occurs during parsing.
 * 3. SSR-SAFE: The hook is safe to use in Server-Side Rendering (SSR) environments, as it checks
 *    for the existence of the `window` object before accessing `localStorage`.
 *
 * @state_management
 * - On initialization, it attempts to read and parse a value from `localStorage`. If this fails,
 *   it falls back to the `initialValue`.
 * - It includes special logic to correctly serialize and deserialize `Set` objects, which are not
 *   natively supported by `JSON.stringify`/`JSON.parse`.
 * - An `useEffect` hook listens for changes to the state and writes the updated value back to
 *   `localStorage`, ensuring the stored data is always in sync.
 *
 * @ai_note
 * This is a generic, reusable utility hook. Its primary function is to wrap `useState` with a
 * `localStorage` persistence layer. The key logic to understand is the initialization (reading
 * from storage) and the `useEffect` (writing to storage). Note the error handling and the
- * special case for `Set` objects, which demonstrates how it handles non-standard JSON types.
 * =================================================================================================
 */

import { useState, useEffect } from "react";

const usePersistentState = <T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    // CONSTRAINT: During Server-Side Rendering (SSR), `window` is not available.
    // In this case, we must return the initialValue to prevent errors.
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);
      // STRATEGY: Handle deserialization for specific object types that are not
      // natively supported by JSON, such as `Set`.
      if (initialValue instanceof Set) {
        return new Set(parsed) as T;
      }
       if (Array.isArray(initialValue)) {
        return parsed as T;
      }
      return parsed;
    } catch (error) {
      // STRATEGY: If reading or parsing from localStorage fails, log the error and
      // fall back to the initial value to ensure the application does not crash.
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    // CONSTRAINT: Do not attempt to write to localStorage during SSR.
    if (typeof window === "undefined") return;
    try {
      // STRATEGY: Serialize state to a JSON string before storing. Special handling
      // is required for `Set` objects, which are converted to an array first.
      const valueToStore =
        state instanceof Set
          ? JSON.stringify(Array.from(state as Set<unknown>))
          : JSON.stringify(state);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      // STRATEGY: If writing to localStorage fails (e.g., storage is full),
      // log the error but do not crash the application.
      console.error(`Error writing to localStorage for key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

export default usePersistentState;
