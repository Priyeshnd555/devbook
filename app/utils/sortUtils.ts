import { Task, Thread, SortConfig, SortDirection } from "../types";
import { isTaskFullyCompleted } from "./taskUtils";

/**
 * =================================================================================================
 * CONTEXT ANCHOR: Sorting Utilities (sortUtils.ts)
 * =================================================================================================
 * @purpose
 * Provides centralized, deterministic sorting logic for Tasks and Threads.
 * Ensures consistent behavior across the application for creation-based ordering,
 * while respecting the existing priority and completion-based hierarchy.
 *
 * @dependencies
 * - TYPES: `Task`, `Thread`, `SortConfig`, `SortDirection` from `../types`.
 * - UTILS: `isTaskFullyCompleted` from `./taskUtils`.
 *
 * @invariants
 * 1. PRIORITY FIRST: Pinned items (higher priority) always stay at the top.
 * 2. COMPLETION SECOND: Active tasks always appear before fully completed task trees.
 * 3. STABLE SORTING: Uses `id` as a fallback tie-breaker to ensure consistent ordering.
 * 4. IMMUTABILITY: Functions return a new array, preserving the original input.
 * =================================================================================================
 */
export const sortTasks = (tasks: Task[], config?: SortConfig): Task[] => {
  const direction = config?.direction || "desc";

  return [...tasks].sort((a, b) => {
    // 1. Priority (High Priority first)
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }

    // 2. Completion Status (Active before Done)
    const aDone = isTaskFullyCompleted(a);
    const bDone = isTaskFullyCompleted(b);
    if (aDone !== bDone) {
      return aDone ? 1 : -1;
    }

    // 3. Time-based sort (User preference)
    let comparison = (a.createdAt || 0) - (b.createdAt || 0);

    // If direction is DESC, we want Newest first (higher timestamp)
    if (direction === "desc") {
      comparison = -comparison;
    }

    // 4. Stable fallback for identical timestamps
    if (comparison === 0) {
      return a.id.localeCompare(b.id);
    }

    return comparison;
  });
};

/**
 * STRATEGY: Centralized thread sorting logic.
 * It handles directions (asc, desc) based on createdAt timestamp.
 */
export const sortThreads = (threads: Thread[], direction: SortDirection = "desc"): Thread[] => {
  return [...threads].sort((a, b) => {
    let comparison = (a.createdAt || 0) - (b.createdAt || 0);

    if (direction === "desc") {
      comparison = -comparison;
    }

    if (comparison === 0) {
      return a.id.localeCompare(b.id);
    }

    return comparison;
  });
};
