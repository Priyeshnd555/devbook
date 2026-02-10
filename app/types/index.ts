/**
 * =================================================================================================
 * CONTEXT ANCHOR: Core Type Definitions (types/index.ts)
 * =================================================================================================
 * @purpose
 * Defines the foundational data structures and types used throughout the application.
 * This centralizes the domain model, ensuring consistent data handling and state management.
 *
 * @dependencies
 * - NONE: This is a leaf module that provides types to all other components and hooks.
 *
 * @invariants
 * 1. UNIQUE IDENTIFIERS: All major entities (Project, Thread, Task) must have a unique `id`.
 * 2. RECURSIVE TASKS: The `Task` interface is recursive, allowing for sub-tasks of arbitrary depth.
 * 3. READ-ONLY DEFAULTS: Types represent the "ideal" state of data at rest.
 * =================================================================================================
 */

// STRATEGY: Sorting configuration to allow per-container independent sorting.
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  direction: SortDirection;
}

// CONSTRAINT: Tasks can be nested infinitely, but the UI is optimized for readability and may not display deep nesting well.
export interface Task {
  id: string;
  text: string;
  done: boolean;
  note: string;
  children: Task[];
  priority: number;
  sortConfig?: SortConfig; // Optional sort config for children
  createdAt: number; // Timestamp for creation-based sorting
}

export interface Session {
  date: string;
  time: string;
  notes: string;
}

// STRATEGY: A thread's status is explicitly managed to control workflow and visual styling.
// This allows for clear visual cues about the state of a workstream.
export type ThreadStatus = "active" | "blocked" | "completed";

// STATE MACHINE MANDATE: Explicitly define the state transitions for a thread's status.
export const THREAD_STATE_TRANSITIONS: Record<ThreadStatus, ThreadStatus[]> = {
  active: ["blocked", "completed"],
  blocked: ["active", "completed"],
  completed: ["active"],
};

export interface Thread {
  id: string;
  projectId: string;
  title: string;
  status: ThreadStatus;
  lastWorked: string;
  tasks: Task[];
  sessions: Session[];
  sortConfig?: SortConfig; // Optional sort config for root tasks
  createdAt: number; // Timestamp for creation-based sorting
}

export type ThreadsState = Record<string, Thread>;

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
}
