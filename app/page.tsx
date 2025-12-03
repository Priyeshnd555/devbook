"use client";

// CONTEXT ANCHOR
// PURPOSE: This file defines a hierarchical task management interface for tracking nested work items. It allows users to create, update, and organize work with parent-child relationships and status tracking, primarily for managing complex projects.
// DEPENDENCIES: Uses 'react' for component-based UI and 'lucide-react' for iconography.
// INVARIANTS: State is always updated immutably. All task IDs must be unique within their respective threads. A task's status is derived from its `done` property.

import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Zap,
  StickyNote,
  Pencil,
  Trash2,
} from "lucide-react";
import { TaskItem, TaskItemProps } from "./components/TaskItem"; // Import TaskItem
import { ThreadCard, ThreadCardProps } from "./components/ThreadCard"; // Import ThreadCard

// ============================================================================
// TYPE DEFINITIONS: Core data structures for the application.
// ============================================================================

// CONSTRAINT: Tasks can be nested infinitely, but the UI is optimized for readability and may not display deep nesting well.
export interface Task {
  id: string;
  text: string;
  done: boolean;
  note: string;
  children: Task[];
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
  title: string;
  status: ThreadStatus;
  lastWorked: string;
  tasks: Task[];
  sessions: Session[];
}

export type ThreadsState = Record<string, Thread>;

// ============================================================================
// STATE TRANSITIONS: Visual map of how state changes flow.
// ============================================================================
/*
  THREAD STATE FLOW:
  1. Initial state → Default threads loaded from initial state.
  2. User actions trigger state update functions:
     - toggleThread() → expands/collapses a thread.
     - toggleTask() → expands/collapses a task.
     - toggleTaskDone() → toggles the 'done' status of a task.
     - addThread() → creates a new thread.
     - deleteThread() → removes a thread.
     - updateThreadStatus() → changes the status of a thread.
     - addChild() → adds a new sub-task to a parent task.
     - addSession() → adds a new work session log to a thread.
     - updateThreadTitle() → updates the title of a thread.
     - saveNote() → saves a note for a task.
  3. UI re-renders to reflect the new, immutable state.
*/

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

const NestedWorkflow = () => {
  // ==========================================================================
  // CORE STATE: All application data and UI state are managed here.
  // ==========================================================================

  // MAIN DATA: 'threads' holds the primary data for the application, persisted to localStorage.
  const [threads, setThreads] = usePersistentState<ThreadsState>(
    "nested-workflow-threads",
    {}
  );

  // UI STATE: Manages expanded/collapsed sections for a clear user experience, persisted to localStorage.
  const [expandedTasks, setExpandedTasks] = usePersistentState<Set<string>>(
    "nested-workflow-expanded-tasks",
    new Set()
  );
  const [expandedThreads, setExpandedThreads] = usePersistentState<Set<string>>(
    "nested-workflow-expanded-threads",
    new Set()
  );

  // UI STATE: Manages states for inline editing and content creation.
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [newChildText, setNewChildText] = useState<string>("");
  const [addingSessionTo, setAddingSessionTo] = useState<string | null>(null);
  // Removed sessionNotes state from here, now local to ThreadCard
  const [isAddingThread, setIsAddingThread] = useState<boolean>(false);
  const [newThreadTitle, setNewThreadTitle] = useState<string>("");
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>("");

  // ==========================================================================
  // THREAD OPERATIONS: Functions for managing top-level thread data.
  // ==========================================================================

  // STATE CHANGE: Creates a new thread and adds it to the threads object.
  const addThread = () => {
    if (!newThreadTitle.trim()) return;

    const newThreadId = `thread-${Date.now()}`;
    const newThread: Thread = {
      id: newThreadId,
      title: newThreadTitle,
      status: "active",
      lastWorked: new Date().toISOString().split("T")[0],
      tasks: [],
      sessions: [],
    };

    setThreads((prev) => ({ ...prev, [newThreadId]: newThread }));
    setNewThreadTitle("");
    setIsAddingThread(false);
    setExpandedThreads((prev) => new Set([...prev, newThreadId]));
  };

  // STATE CHANGE: Updates a thread's title and exits edit mode.
  const updateThreadTitle = (threadId: string, newTitle: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: { ...prev[threadId], title: newTitle },
    }));
    setEditingThreadId(null);
  };
    // STATE CHANGE: Updates the status of a specific thread.
  const updateThreadStatus = (threadId: string, status: ThreadStatus) => {
    setThreads((prev) => {
      if (prev[threadId]) {
        return {
          ...prev,
          [threadId]: { ...prev[threadId], status: status },
        };
      }
      return prev;
    });
  };
  // STATE CHANGE: Removes a thread after user confirmation.
  const deleteThread = (threadId: string) => {
    // CONSTRAINT: Deletion is a destructive action and requires confirmation.
    if (window.confirm("Are you sure you want to delete this thread?")) {
      const newThreads = { ...threads };
      delete newThreads[threadId];
      setThreads(newThreads);
    }
  };

  // ==========================================================================
  // TASK OPERATIONS: Functions for managing individual tasks and their state.
  // ==========================================================================

  // UI STATE CHANGE: Toggles the expansion state of a single task.
  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // UI STATE CHANGE: Toggles the expansion state of a single thread.
  const toggleThread = (threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // STATE CHANGE: Recursively finds and toggles the 'done' status of a task.
  const toggleTaskDone = (threadId: string, taskId: string) => {
    // STRATEGY: Use recursion to traverse the nested task structure. This function creates new objects and arrays for the modified path, ensuring the state update is immutable.
    const updateTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, done: !task.done };
        }
        if (task.children.length > 0) {
          return { ...task, children: updateTaskRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: updateTaskRecursive(prev[threadId].tasks),
      },
    }));
  };

  // STATE CHANGE: Recursively finds a task and updates its note text.
  const saveNote = (threadId: string, taskId: string, newText: string) => {
    // STRATEGY: A recursive approach is used to immutably update the note for a deeply nested task.
    const updateNoteRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, note: newText };
        }
        if (task.children.length > 0) {
          return { ...task, children: updateNoteRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: updateNoteRecursive(prev[threadId].tasks),
      },
    }));
    setEditingNote(null);
  };

  // STATE CHANGE: Recursively finds a task and updates its text.
  const updateTaskText = (threadId: string, taskId: string, newText: string) => {
    // STRATEGY: A recursive function to immutably update the text for a given task.
    const updateTextRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, text: newText };
        }
        if (task.children.length > 0) {
          return { ...task, children: updateTextRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: updateTextRecursive(prev[threadId].tasks),
      },
    }));

    setEditingTaskId(null);
  };

  // STATE CHANGE: Adds a new root-level task to a thread.
  const addRootTaskToThread = (threadId: string) => {
    if (!newChildText.trim()) return;
    const newId = `${threadId}-task-${Date.now()}`;
    const newTask: Task = {
      id: newId,
      text: newChildText,
      done: false,
      note: "",
      children: [],
    };
    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: [...prev[threadId].tasks, newTask],
      },
    }));
    setNewChildText("");
    setAddingChildTo(null);
  };
  
  // STATE CHANGE: Adds a new child task to a specified parent task.
  const addChild = (threadId: string, parentId: string) => {
    if (!newChildText.trim()) return;

    // STRATEGY: Recursion is used to locate the parent task within the nested structure and add the new child task, maintaining immutability.
    const addChildRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === parentId) {
          const newId = `${parentId}-${task.children.length + 1}`;
          const newChild: Task = {
            id: newId,
            text: newChildText,
            done: false,
            note: "",
            children: [],
          };
          return { ...task, children: [...task.children, newChild] };
        }
        if (task.children.length > 0) {
          return { ...task, children: addChildRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: addChildRecursive(prev[threadId].tasks),
      },
    }));
    setExpandedTasks((prev) => new Set([...prev, parentId]));
    setNewChildText("");
    setAddingChildTo(null);
  };

  // ==========================================================================
  // SESSION OPERATIONS: Functions for managing work session logs.
  // ==========================================================================

  // STATE CHANGE: Adds a new work session log to a thread and updates the 'lastWorked' timestamp.
  const addSession = (threadId: string, notes: string) => { // Modified to accept notes
    if (!notes.trim()) return;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newSession: Session = { date, time, notes };

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        sessions: [newSession, ...prev[threadId].sessions],
        lastWorked: `${date} ${time}`,
      },
    }));
    setAddingSessionTo(null);
  };

  // ==========================================================================
  // MAIN COMPONENT RENDER: Assembles the top-level UI structure.
  // ==========================================================================

  const taskItemProps: Omit<TaskItemProps, 'task' | 'threadId' | 'level'> = {
    expandedTasks,
    editingNote,
    addingChildTo,
    editingTaskId,
    editedTaskText,
    toggleTask,
    toggleTaskDone,
    setEditingNote,
    saveNote,
    setAddingChildTo,
    newChildText,
    setNewChildText,
    addChild,
    setEditingTaskId,
    setEditedTaskText,
    updateTaskText,
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-xs z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">Deep Linking Phase 2</h1>
              <p className="text-xs text-gray-500 mt-0.5">Nested task tracking</p>
            </div>
            <button onClick={() => setIsAddingThread(true)} className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-4">
        {isAddingThread && (
          <div className="mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">New thread</h3>
            <input type="text" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="Title..." className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" autoFocus onKeyPress={(e) => e.key === "Enter" && addThread()} />
            <div className="flex gap-2 mt-2">
              <button onClick={addThread} className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors font-medium">Create</button>
              <button onClick={() => { setIsAddingThread(false); setNewThreadTitle(""); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Object.values(threads).map((thread) => (
            <ThreadCard 
              key={thread.id} 
              thread={thread} 
              isThreadExpanded={expandedThreads.has(thread.id)} 
              toggleThread={toggleThread} 
              onUpdateTitle={updateThreadTitle} 
              onDelete={deleteThread} 
              onAddRootTask={addRootTaskToThread} 
              onUpdateStatus={updateThreadStatus}
              addingSessionTo={addingSessionTo}
              setAddingSessionTo={setAddingSessionTo}
              onAddSession={addSession}
              editingThreadId={editingThreadId}
              setEditingThreadId={setEditingThreadId}
              taskItemProps={taskItemProps}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default NestedWorkflow;