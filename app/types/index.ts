// ============================================================================
// TYPE DEFINITIONS: Core data structures for the application.
// PURPOSE: To provide a single source of truth for all data shapes, ensuring
// consistency and making the system easier for an AI to understand.
// By centralizing types, we avoid duplication and make refactoring safer.
// ============================================================================

// CONSTRAINT: Tasks can be nested infinitely, but the UI is optimized for readability and may not display deep nesting well.
export interface Task {
  id: string;
  text: string;
  done: boolean;
  note: string;
  children: Task[];
  priority: number;
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
}

export type ThreadsState = Record<string, Thread>;

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
}
