"use client";

// CONTEXT ANCHOR
// PURPOSE: This file defines a hierarchical task management interface for tracking nested work items. It allows users to create, update, and organize work with parent-child relationships and status tracking, primarily for managing complex projects.
// DEPENDENCIES: Uses 'react' for component-based UI and 'lucide-react' for iconography.
// INVARIANTS: State is always updated immutably. All task IDs must be unique within their respective threads. A task's status is derived from its `done` property.

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
} from "lucide-react";
import { TaskItem, TaskItemProps } from "./components/TaskItem"; // Import TaskItem
import { ThreadCard } from "./components/ThreadCard"; // Import ThreadCard
import { motion, AnimatePresence } from "framer-motion";
import ProjectSidebar, { Project } from './components/ProjectSidebar';


// ============================================================================
// COMPONENT CONTEXT: High-level overview of imported components for AI reference.
// ============================================================================
/*
  COMPONENT: ProjectSidebar (from ./components/ProjectSidebar.tsx)
  ----------------------------------------------------
  PURPOSE: Renders a sidebar that allows for creation and navigation of nested projects.
           It displays projects in a hierarchical view.

  COMPONENT: TaskItem (from ./components/TaskItem.tsx)
  ----------------------------------------------------
  PURPOSE: Renders a single, potentially nested, task item. It handles displaying
           the task's text, completion status, and note. It also manages user
           interactions for editing a task, adding a sub-task, and toggling
           its 'done' state.
  KEY PROPS:
    - task: The task object to render.
    - threadId: The ID of the parent thread.
    - expandedTasks: A Set<string> to determine if the task's children are visible.
    - ... (and many state handlers from the parent to modify the application state).

  COMPONENT: ThreadCard (from ./components/ThreadCard.tsx)
  ------------------------------------------------------
  PURPOSE: Renders a full "thread" card, which is a top-level container for a
           group of tasks. It displays thread metadata (title, status, last worked on),
           and contains the list of root-level TaskItems for that thread. It also
           handles thread-specific actions like logging a new work session, editing
           the thread title, and changing its status.
  KEY PROPS:
    - thread: The thread object to render.
    - isThreadExpanded: A boolean to control the visibility of the thread's content.
    - onUpdateTitle, onDelete, onUpdateStatus: Handlers for modifying the thread.
    - taskItemProps: A collection of props that are passed down to all child TaskItem components.
*/

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
  projectId: string;
  title: string;
  status: ThreadStatus;
  lastWorked: string;
  tasks: Task[];
  sessions: Session[];
}

export type ThreadsState = Record<string, Thread>;

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

// ============================================================================
// PURE HELPER FUNCTIONS: For calculations and data transformations.
// These are defined at the module level because they do not depend on any component state.
// ============================================================================

/**
 * STRATEGY: Recursion is used to locate an item within the nested structure and apply an update, maintaining immutability.
 * This function is pure and has no side effects.
 * @param tasks The array of tasks to search through.
 * @param taskId The ID of the task to update.
 * @param newDoneState Optional new 'done' state.
 * @param newText Optional new text.
 * @param newNote Optional new note.
 * @returns A new array of tasks with the specified task updated.
 */
const updateTaskRecursive = (tasks: Task[], taskId: string, newDoneState?: boolean, newText?: string, newNote?: string): Task[] => {
    return tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          done: newDoneState !== undefined ? newDoneState : task.done,
          text: newText !== undefined ? newText : task.text,
          note: newNote !== undefined ? newNote : task.note,
        };
      }
      if (task.children.length > 0) {
        return { ...task, children: updateTaskRecursive(task.children, taskId, newDoneState, newText, newNote) };
      }
      return task;
    });
};

/**
 * Recursively counts all tasks in a given array of tasks.
 * @param tasks The array of tasks to count.
 * @returns The total number of tasks and their descendants.
 */
const countAllTasks = (tasks: Task[]): number => {
  return tasks.reduce((count, task) => {
      return count + 1 + countAllTasks(task.children);
  }, 0);
};

/**
 * Recursively counts all completed tasks in a given array of tasks.
 * @param tasks The array of tasks to count.
 * @returns The total number of completed tasks.
 */
const countAllCompletedTasks = (tasks: Task[]): number => {
    return tasks.reduce((count, task) => {
        return count + (task.done ? 1 : 0) + countAllCompletedTasks(task.children);
    }, 0);
};


// ============================================================================
// WORKFLOW MANAGER HOOK: Encapsulates all application state and business logic.
// PURPOSE: To separate state management from the UI, making the main component
// a "dumb" presentational component. This improves testability, maintainability,
// and AI comprehension by isolating complexity.
// DEPENDENCIES: `usePersistentState` hook, React hooks (`useState`, `useEffect`, `useMemo`).
// INVARIANTS: Returns a consistent API for the `NestedWorkflow` component to consume.
// ============================================================================
const useWorkflowManager = () => {
  // ==========================================================================
  // CORE STATE: All application data and UI state are managed here.
  // ==========================================================================
  const [projects, setProjects] = usePersistentState<Record<string, Project>>(
    "nested-workflow-projects",
    {}
  );
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [threads, setThreads] = usePersistentState<ThreadsState>(
    "nested-workflow-threads",
    {}
  );

  const [threadOrder, setThreadOrder] = usePersistentState<string[]>(
    "nested-workflow-thread-order",
    []
  );

  const [expandedTasks, setExpandedTasks] = usePersistentState<Set<string>>(
    "nested-workflow-expanded-tasks",
    new Set()
  );
  const [expandedThreads, setExpandedThreads] = usePersistentState<Set<string>>(
    "nested-workflow-expanded-threads",
    new Set()
  );

  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [newChildText, setNewChildText] = useState<string>("");
  const [addingSessionTo, setAddingSessionTo] = useState<string | null>(null);
  const [isAddingThread, setIsAddingThread] = useState<boolean>(false);
  const [newThreadTitle, setNewThreadTitle] = useState<string>("");
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>("");

    useEffect(() => {
    if (Object.keys(projects).length === 0) {
      const inboxId = 'proj-inbox';
      const newProject: Project = { id: inboxId, name: 'Inbox', parentId: null };
      setProjects({ [inboxId]: newProject });
      setSelectedProjectId(inboxId);
    }

    if(!selectedProjectId && Object.keys(projects).length > 0){
        const firstProject = Object.values(projects).find(p => p.parentId === null) || Object.values(projects)[0];
        if(firstProject) {
            setSelectedProjectId(firstProject.id);
        }
    }

    const threadsNeedMigration = Object.values(threads).some(t => !t.projectId);
    if (threadsNeedMigration && Object.keys(projects).length > 0) {
      let inboxId = Object.values(projects).find(p => p.name === 'Inbox')?.id;
      if (!inboxId) {
        inboxId = 'proj-inbox';
      }
      setThreads(currentThreads => {
        const migratedThreads = { ...currentThreads };
        Object.keys(migratedThreads).forEach(id => {
          if (!migratedThreads[id].projectId) {
            migratedThreads[id].projectId = inboxId!;
          }
        });
        return migratedThreads;
      });
    }
  }, [projects, setProjects, threads, setThreads, selectedProjectId]);


  useEffect(() => {
    if (selectedThreadId && !threads[selectedThreadId]) {
      setSelectedThreadId(null);
    }
    const currentThreadIds = Object.keys(threads);
    if(threadOrder.length === 0 && currentThreadIds.length > 0){
        setThreadOrder(currentThreadIds);
        return;
    }

    const newOrder = threadOrder.filter(id => currentThreadIds.includes(id));
    currentThreadIds.forEach(id => {
        if(!newOrder.includes(id)){
            newOrder.push(id);
        }
    });
    if(newOrder.length !== threadOrder.length || newOrder.some((id,i) => id !== threadOrder[i])){
        setThreadOrder(newOrder);
    }

  }, [threads, selectedThreadId, threadOrder, setThreadOrder]);
  
  // ==========================================================================
  // PROJECT OPERATIONS
  // ==========================================================================
  const addProject = (name: string, parentId: string | null) => {
    if (!name.trim()) return;
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      name,
      parentId,
    };
    setProjects(prev => ({ ...prev, [newProjectId]: newProject }));
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  }

  // ==========================================================================
  // THREAD OPERATIONS
  // ==========================================================================
  const addThread = () => {
    if (!newThreadTitle.trim() || !selectedProjectId) {
        alert("Please select a project before adding a thread.");
        return;
    };

    const newThreadId = `thread-${Date.now()}`;
    const newThread: Thread = {
      id: newThreadId,
      projectId: selectedProjectId,
      title: newThreadTitle,
      status: "active",
      lastWorked: new Date().toISOString().split("T")[0],
      tasks: [],
      sessions: [],
    };

    setThreads((prev) => ({ ...prev, [newThreadId]: newThread }));
    setThreadOrder(prev => [newThreadId, ...prev]);
    setNewThreadTitle("");
    setIsAddingThread(false);
    setExpandedThreads((prev) => new Set([...prev, newThreadId]));
    setSelectedThreadId(newThreadId);
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreadOrder(prev => {
        const newOrder = prev.filter(id => id !== threadId);
        return [threadId, ...newOrder];
    });
  };

  const updateThreadTitle = (threadId: string, newTitle: string) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: { ...prev[threadId], title: newTitle },
    }));
    setEditingThreadId(null);
  };
    
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
  
  const deleteThread = (threadId: string) => {
    if (window.confirm("Are you sure you want to delete this thread?")) {
      const newThreads = { ...threads };
      delete newThreads[threadId];
      setThreads(newThreads);
      setThreadOrder(prev => prev.filter(id => id !== threadId));
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
    }
  };

  // ==========================================================================
  // TASK OPERATIONS
  // ==========================================================================
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

  const toggleTaskDone = (threadId: string, taskId: string) => {
    setThreads(prevThreads => {
      const threadToUpdate = prevThreads[threadId];
      if (!threadToUpdate) return prevThreads;
      
      const findTask = (tasks: Task[], id: string): Task | undefined => {
        for(const task of tasks) {
            if(task.id === id) return task;
            if(task.children) {
                const found = findTask(task.children, id);
                if(found) return found;
            }
        }
      }
      const taskToUpdate = findTask(threadToUpdate.tasks, taskId);

      const updatedTasks = updateTaskRecursive(threadToUpdate.tasks, taskId, !taskToUpdate?.done);
      return {
        ...prevThreads,
        [threadId]: {
          ...threadToUpdate,
          tasks: updatedTasks,
        },
      };
    });
  };

  const saveNote = (threadId: string, taskId: string, newText: string) => {
    setThreads(prevThreads => {
      const threadToUpdate = prevThreads[threadId];
      if (!threadToUpdate) return prevThreads;

      const updatedTasks = updateTaskRecursive(threadToUpdate.tasks, taskId, undefined, undefined, newText);
      return {
        ...prevThreads,
        [threadId]: {
          ...threadToUpdate,
          tasks: updatedTasks,
        },
      };
    });
    setEditingNote(null);
  };

  const updateTaskText = (threadId: string, taskId: string, newText: string) => {
    setThreads(prevThreads => {
      const threadToUpdate = prevThreads[threadId];
      if (!threadToUpdate) return prevThreads;

      const updatedTasks = updateTaskRecursive(threadToUpdate.tasks, taskId, undefined, newText);
      return {
        ...prevThreads,
        [threadId]: {
          ...threadToUpdate,
          tasks: updatedTasks,
        },
      };
    });
    setEditingTaskId(null);
  };
  
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
  
  const addChild = (threadId: string, parentId: string) => {
    if (!newChildText.trim()) return;

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
  // SESSION OPERATIONS
  // ==========================================================================
  const addSession = (threadId: string, notes: string) => {
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
  // DERIVED STATE & MEMOIZED VALUES
  // ==========================================================================
  const selectedThread = selectedThreadId ? threads[selectedThreadId] : null;

  const descendantProjectIds = useMemo(() => {
    const getDescendants = (projectId: string): string[] => {
        const children = Object.values(projects)
            .filter(p => p.parentId === projectId)
            .map(p => p.id);
        return [...children, ...children.flatMap(getDescendants)];
    };

    if (!selectedProjectId) return [];
    return [selectedProjectId, ...getDescendants(selectedProjectId)];
  }, [selectedProjectId, projects]);

  const filteredThreadOrder = useMemo(() => {
    if (!selectedProjectId) return threadOrder;
    return threadOrder.filter(id => {
        const thread = threads[id];
        return thread && descendantProjectIds.includes(thread.projectId);
    });
  }, [threadOrder, threads, descendantProjectIds, selectedProjectId]);

  const { globalTotalTasks, globalCompletedTasks } = useMemo(() => {
    let total = 0;
    let completed = 0;
    threadOrder.forEach(threadId => {
        const thread = threads[threadId];
        if(thread){
          total += countAllTasks(thread.tasks);
          completed += countAllCompletedTasks(thread.tasks);
        }
    });
    return { globalTotalTasks: total, globalCompletedTasks: completed };
  }, [threadOrder, threads]);
  
  const globalTotalThreads = threadOrder.length;
  
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

  return {
    projects,
    selectedProjectId,
    threads,
    threadOrder,
    expandedTasks,
    expandedThreads,
    editingNote,
    addingChildTo,
    newChildText,
    addingSessionTo,
    isAddingThread,
    newThreadTitle,
    editingThreadId,
    editingTaskId,
    selectedThreadId,
    editedTaskText,
    selectedThread,
    descendantProjectIds,
    filteredThreadOrder,
    globalTotalThreads,
    globalTotalTasks,
    globalCompletedTasks,
    taskItemProps,
    setProjects,
    setSelectedProjectId,
    setThreads,
    setThreadOrder,
    setExpandedTasks,
    setExpandedThreads,
    setEditingNote,
    setAddingChildTo,
    setNewChildText,
    setAddingSessionTo,
    setIsAddingThread,
    setNewThreadTitle,
    setEditingThreadId,
    setEditingTaskId,
    setSelectedThreadId,
    setEditedTaskText,
    addProject,
    handleSelectProject,
    addThread,
    handleSelectThread,
    updateThreadTitle,
    updateThreadStatus,
    deleteThread,
    toggleTask,
    toggleThread,
    toggleTaskDone,
    saveNote,
    updateTaskText,
    addRootTaskToThread,
    addChild,
    addSession,
  };
};


// ==========================================================================
// MAIN COMPONENT RENDER: Assembles the top-level UI structure.
// This is now a "dumb" component that receives all state and handlers from the useWorkflowManager hook.
// ==========================================================================
const NestedWorkflow = () => {
  const {
    projects,
    selectedProjectId,
    threads,
    filteredThreadOrder,
    expandedThreads,
    selectedThreadId,
    selectedThread,
    globalTotalThreads,
    globalTotalTasks,
    globalCompletedTasks,
    isAddingThread,
    newThreadTitle,
    addingSessionTo,
    editingThreadId,
    addProject,
    handleSelectProject,
    setIsAddingThread,
    setNewThreadTitle,
    addThread,
    handleSelectThread,
    updateThreadTitle,
    updateThreadStatus,
    deleteThread,
    toggleThread,
    addRootTaskToThread,
    setAddingSessionTo,
    addSession,
    setEditingThreadId,
    taskItemProps,
  } = useWorkflowManager();
  
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <ProjectSidebar 
        projects={projects}
        selectedProjectId={selectedProjectId}
        onAddProject={addProject}
        onSelectProject={handleSelectProject}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 shadow-xs z-20">
            <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900">Thread Notes</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Nested task tracking &bull; {globalTotalThreads} Threads &bull; {globalCompletedTasks}/{globalTotalTasks} Tasks
                </p>
                </div>
                <button 
                    onClick={() => setIsAddingThread(true)} 
                    className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors disabled:bg-gray-400"
                    disabled={!selectedProjectId}
                    title={!selectedProjectId ? "Select a project to add a thread" : "Add new thread"}
                >
                <Plus className="w-3.5 h-3.5" /> New Thread
                </button>
            </div>
            </div>
        </header>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 py-4 w-full overflow-y-auto">
            <div className="md:col-span-2">
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
                <AnimatePresence>
                {filteredThreadOrder.map((threadId, index) => {
                const thread = threads[threadId];
                if(!thread) return null;
                const totalTasks = countAllTasks(thread.tasks);
                const completedTasks = countAllCompletedTasks(thread.tasks);
                return (
                    <motion.div
                    key={thread.id}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50}}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <ThreadCard 
                        thread={thread}
                        threadNumber={index + 1}
                        totalTaskCount={totalTasks}
                        completedTaskCount={completedTasks}
                        isSelected={selectedThreadId === thread.id}
                        onSelect={() => handleSelectThread(thread.id)}
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
                    </motion.div>
                );
                })}
                </AnimatePresence>
            </div>
            </div>
            <div className="md:col-span-1">
            <div className="sticky top-6">
                {selectedThread ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                    <h2 className="text-base font-medium text-gray-900">Session Log</h2>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedThread.title}</p>
                    </div>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto">
                    {selectedThread.sessions.length > 0 ? (
                        selectedThread.sessions.map((session, idx) => (
                        <div key={`${selectedThread.id}-session-${idx}`} className="bg-gray-50 rounded p-3 text-xs border border-gray-200">
                            <div className="text-gray-500 mb-1.5 font-medium">{session.date} at {session.time}</div>
                            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{session.notes}</div>
                        </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-xs text-gray-400">
                        <p>No sessions logged for this thread.</p>
                        </div>
                    )}
                    </div>
                </div>
                ) : (
                <div className="py-20 text-center text-sm text-gray-400">
                    <p>Select a thread to view its session log.</p>
                </div>
                )}
            </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default NestedWorkflow;