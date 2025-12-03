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

// ============================================================================
// TYPE DEFINITIONS: Core data structures for the application.
// ============================================================================

// CONSTRAINT: Tasks can be nested infinitely, but the UI is optimized for readability and may not display deep nesting well.
interface Task {
  id: string;
  text: string;
  done: boolean;
  note: string;
  children: Task[];
}

interface Session {
  date: string;
  time: string;
  notes: string;
}

// STRATEGY: A thread's status is explicitly managed to control workflow and visual styling.
// This allows for clear visual cues about the state of a workstream.
type ThreadStatus = "active" | "blocked" | "completed";

// STATE MACHINE MANDATE: Explicitly define the state transitions for a thread's status.
const THREAD_STATE_TRANSITIONS: Record<ThreadStatus, ThreadStatus[]> = {
  active: ["blocked", "completed"],
  blocked: ["active", "completed"],
  completed: ["active"],
};

interface Thread {
  id: string;
  title: string;
  status: ThreadStatus;
  lastWorked: string;
  tasks: Task[];
  sessions: Session[];
}

type ThreadsState = Record<string, Thread>;

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
  const [sessionNotes, setSessionNotes] = useState<string>("");
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
  const addSession = (threadId: string) => {
    if (!sessionNotes.trim()) return;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newSession: Session = { date, time, notes: sessionNotes };

    setThreads((prev) => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        sessions: [newSession, ...prev[threadId].sessions],
        lastWorked: `${date} ${time}`,
      },
    }));
    setSessionNotes("");
    setAddingSessionTo(null);
  };

  // ==========================================================================
  // UI COMPONENTS: Reusable components for rendering the interface.
  // These are defined within the main component to have closure over state and handlers.
  // ==========================================================================

  // CONTEXT ANCHOR
  // PURPOSE: Renders a single task item and recursively renders its children. This component handles displaying task status, notes, and actions like adding a sub-task.
  // DEPENDENCIES: Relies on parent state for expansion, editing status, and data.
  // INVARIANTS: It must be provided a valid 'task' and 'threadId'.
  interface TaskItemProps {
    task: Task;
    threadId: string;
    level?: number;
  }

  const TaskItem: React.FC<TaskItemProps> = ({ task, threadId, level = 0 }) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children.length > 0;
    const isEditing = editingNote === task.id;
    const isAddingChild = addingChildTo === task.id;
    const [editedNoteText, setEditedNoteText] = useState("");
    const isEditingTask = editingTaskId === task.id;

    const handleSaveTaskText = () => {
      if (editedTaskText.trim()) {
        updateTaskText(threadId, task.id, editedTaskText);
      } else {
        setEditingTaskId(null); // Cancel edit if new text is empty
      }
    };

    const handleCancelEdit = () => {
      setEditingTaskId(null);
    };

    // STRATEGY: Use a local state `editedNoteText` for the textarea to prevent re-renders on every keystroke.
    // Sync this local state with the task's note only when the editing mode begins.
    useEffect(() => {
      if (isEditing) {
        setEditedNoteText(task.note);
      }
    }, [isEditing, task.note]);

    return (
      <div className={`${level > 0 ? "ml-7 border-l border-orange-200 pl-4 py-0.5" : ""}`} key={`${threadId}-${task.id}`}>
        <div className="mb-1">
          <div className="flex items-start gap-3 group hover:bg-orange-50/30 px-3 py-2 rounded transition-colors">
            {hasChildren ? (
              <button onClick={() => toggleTask(task.id)} className="mt-0.5 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-4 flex-shrink-0"></div>
            )}

            <button onClick={() => toggleTaskDone(threadId, task.id)} className="mt-0.5 flex-shrink-0 transition-colors">
              {task.done ? <CheckCircle2 className="w-5 h-5 text-orange-400" /> : <Circle className="w-5 h-5 text-gray-300 hover:text-orange-300" />}
            </button>

            <div className="flex-1 min-w-0">
              {isEditingTask ? (
                <input
                  type="text"
                  value={editedTaskText}
                  onChange={(e) => setEditedTaskText(e.target.value)}
                  onBlur={handleSaveTaskText}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTaskText();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="w-full px-2 py-1 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm leading-relaxed ${task.done ? "line-through text-gray-400" : "text-gray-700"} cursor-text`}
                  onClick={() => {
                    setEditingTaskId(task.id);
                    setEditedTaskText(task.text);
                  }}
                >
                  {task.text}
                </span>
              )}

              {task.note && !isEditing && !isEditingTask && (
                <div className="mt-2 text-xs leading-relaxed text-orange-900 bg-orange-100 px-3 py-2 rounded cursor-pointer hover:bg-orange-100/80 transition-colors" onClick={() => setEditingNote(task.id)}>
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-3 h-3 text-orange-700 mt-0.5 flex-shrink-0" />
                    <span>{task.note}</span>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mt-3 space-y-2">
                  <textarea value={editedNoteText} onChange={(e) => setEditedNoteText(e.target.value)} className="w-full px-3 py-2 border border-orange-300 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white leading-relaxed" rows={3} placeholder="Add notes..." autoFocus />
                  <div className="flex gap-2">
                    <button onClick={() => saveNote(threadId, task.id, editedNoteText)} className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors font-medium">Save</button>
                    <button onClick={() => setEditingNote(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {!task.note && !isEditing && (
                <button onClick={() => setEditingNote(task.id)} className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Add note">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setAddingChildTo(task.id)} className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Add subtask">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isAddingChild && (
            <div className="ml-10 mt-2 flex gap-2">
              <input type="text" value={newChildText} onChange={(e) => setNewChildText(e.target.value)} placeholder="New subtask..." className="flex-1 px-3 py-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" autoFocus onKeyPress={(e) => e.key === "Enter" && addChild(threadId, task.id)} />
              <button onClick={() => addChild(threadId, task.id)} className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors font-medium">Add</button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {task.children.map((child) => (
              <TaskItem key={`${threadId}-${child.id}`} task={child} threadId={threadId} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // CONTEXT ANCHOR
  // PURPOSE: Renders a card for a single thread, including its metadata, tasks, and session history. It handles thread-level actions like editing the title, deleting, and logging work sessions.
  // DEPENDENCIES: Relies on parent state and handlers passed via props.
  // INVARIANTS: Must be provided a 'thread' object and all required handler functions.
  interface ThreadCardProps {
    thread: Thread;
    isThreadExpanded: boolean;
    toggleThread: (threadId: string) => void;
    onUpdateTitle: (threadId: string, newTitle: string) => void;
    onDelete: (threadId: string) => void;
    onAddRootTask: (threadId: string) => void;
    onUpdateStatus: (threadId: string, status: ThreadStatus) => void;
  }

  const ThreadCard: React.FC<ThreadCardProps> = ({ thread, isThreadExpanded, toggleThread, onUpdateTitle, onDelete, onAddRootTask, onUpdateStatus }) => {
    const completedCount = thread.tasks.filter((t) => t.done).length;
    const totalCount = thread.tasks.length;
    const isAddingSession = addingSessionTo === thread.id;
    const [title, setTitle] = useState<string>(thread.title);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

    const handleUpdate = () => {
      if (title.trim()) onUpdateTitle(thread.id, title);
    };

    const handleAddTask = () => {
        onAddRootTask(thread.id);
    }
    
    // STATUS CONFIG: Maps status values to visual styles for clarity.
    const statusConfig: Record<ThreadStatus, { bg: string, text: string, dot: string }> = {
      active: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
      blocked: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
      completed: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
    };
    const statusStyle = statusConfig[thread.status];

    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-4 shadow-sm" key={thread.id}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 group mb-3">
                <button onClick={() => toggleThread(thread.id)} className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                  {isThreadExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {editingThreadId === thread.id ? (
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleUpdate} onKeyPress={(e) => e.key === "Enter" && handleUpdate()} className="text-base font-medium text-gray-900 flex-1 px-2 py-1 border-b-2 border-orange-500 focus:outline-none bg-transparent" autoFocus />
                ) : (
                  <h3 className="text-base font-medium text-gray-900">{thread.title}</h3>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                  <button onClick={() => setEditingThreadId(thread.id)} className="p-1 text-gray-400 hover:text-orange-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDelete(thread.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 ml-7">
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> <span className="truncate">{thread.lastWorked}</span></div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">{completedCount}/{totalCount}</span>
                  <div className="bg-gray-200 rounded-full h-1 w-16"><div className="bg-orange-500 h-1 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}></div></div>
                </div>
                <div className="relative">
                  <button onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} onBlur={() => setIsStatusMenuOpen(false)} className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${statusStyle.bg} flex-shrink-0`}>
                    <div className={`w-1 h-1 rounded-full ${statusStyle.dot}`}></div>
                    <span className={`text-xs font-medium ${statusStyle.text}`}>{thread.status}</span>
                  </button>
                  {isStatusMenuOpen && (
                    <div className="absolute top-full mt-1.5 w-24 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      {(Object.keys(THREAD_STATE_TRANSITIONS) as ThreadStatus[]).map((s) => (
                        <button key={s} onMouseDown={() => { onUpdateStatus(thread.id, s); setIsStatusMenuOpen(false);}} className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 capitalize">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => setAddingSessionTo(thread.id)} className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors">
              <Zap className="w-3.5 h-3.5" /> Log
            </button>
          </div>
        </div>

        {isAddingSession && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Work session</h4>
            <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="What did you work on?" className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" rows={2} />
            <div className="flex gap-2 mt-2">
              <button onClick={() => addSession(thread.id)} className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors font-medium">Save</button>
              <button onClick={() => { setAddingSessionTo(null); setSessionNotes(""); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {isThreadExpanded && (
          <>
            <div className="p-4">
              <button onClick={() => setAddingChildTo(`${thread.id}-root`)} className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-xs font-medium mb-3 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add task
              </button>

              {addingChildTo === `${thread.id}-root` && (
                <div className="mb-3 flex gap-2">
                  <input type="text" value={newChildText} onChange={(e) => setNewChildText(e.target.value)} placeholder="New task..." className="flex-1 px-3 py-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" autoFocus onKeyPress={(e) => e.key === "Enter" && handleAddTask()} />
                  <button onClick={handleAddTask} className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors font-medium">Add</button>
                </div>
              )}

              {thread.tasks.length > 0 ? (
                <div className="space-y-0.5">{thread.tasks.map((task) => <TaskItem key={`${thread.id}-${task.id}`} task={task} threadId={thread.id} />)}</div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400"><p>No tasks. Add one to begin.</p></div>
              )}
            </div>

            {thread.sessions.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">Sessions</h4>
                <div className="space-y-2">
                  {thread.sessions.map((session, idx) => (
                    <div key={`${thread.id}-session-${idx}`} className="bg-gray-50 rounded p-2.5 text-xs border border-gray-200">
                      <div className="text-gray-500 mb-1 font-medium">{session.date} {session.time}</div>
                      <div className="text-gray-700 leading-relaxed">{session.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ==========================================================================
  // MAIN COMPONENT RENDER: Assembles the top-level UI structure.
  // ==========================================================================

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
            <ThreadCard key={thread.id} thread={thread} isThreadExpanded={expandedThreads.has(thread.id)} toggleThread={toggleThread} onUpdateTitle={updateThreadTitle} onDelete={deleteThread} onAddRootTask={addRootTaskToThread} onUpdateStatus={updateThreadStatus} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default NestedWorkflow;