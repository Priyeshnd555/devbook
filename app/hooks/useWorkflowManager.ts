/**
 * =================================================================================================
 * CONTEXT ANCHOR: WORKFLOW MANAGER HOOK (useWorkflowManager.ts)
 * =================================================================================================
 *
 * @purpose
 * This hook is the central nervous system of the application. It encapsulates all business logic,
 * state management, and data operations related to projects, threads, and tasks. By centralizing
 * logic here, we make UI components "presentational" (dumb), which simplifies the UI layer,
 * enhances testability, and provides a single, predictable source of truth for the AI to understand.
 *
 * @dependencies
 * - HOOK: `usePersistentState`: For persisting application state to localStorage.
 * - REACT: `useState`, `useEffect`, `useMemo` for state management and optimization.
 * - UTILS: `taskUtils`: For complex, recursive operations on task data.
 * - TYPES: All core data structures (`Project`, `Thread`, `Task`) are imported from `../types`.
 * - TaskItemProps: Imported for type definitions in `taskItemProps`.
 *
 * @invariants
 * 1. STATE IMMUTABILITY: All state updates are performed immutably (creating new objects/arrays
 *    instead of mutating them) to ensure predictable state transitions and compatibility with React's
 *    rendering cycle.
 * 2. DATA INTEGRITY: Operations like project deletion are designed to be atomic, performing
 *    cascading deletes of related entities (threads) to prevent orphaned data.
 * 3. SINGLE SOURCE OF TRUTH: All application data flows from this hook. Components do not
 *    manage their own conflicting state.
 *
 * @state_management
 * - Uses `usePersistentState` for core data (`projects`, `threads`, `threadOrder`, `expandedTasks`,
 *   `expandedThreads`, `showCompleted`) to survive page reloads.
 * - Uses `useState` for transient UI state (e.g., `isAddingThread`, `newThreadTitle`, `editingNote`).
 * - Employs `useEffect` for initialization, data migration, and state consistency (e.g., selecting
 *   a default project, cleaning up `selectedThreadId`).
 * - Leverages `useMemo` for optimized calculation of derived states (e.g., `descendantProjectIds`,
 *   `filteredThreadOrder`, `globalTotalTasks`).
 *
 * @ai_note
 * - `selectedProjectId` initialization is handled client-side within a `useEffect` to prevent
 *   "localStorage is not defined" errors during Server-Side Rendering (SSR).
 * - `selectedProjectId` and `selectedThreadId` cleanup logic has been carefully refactored to
 *   avoid `set-state-in-effect` linter warnings while maintaining data integrity.
 * - Data migration logic (`threadsNeedMigration`) ensures backward compatibility for older data
 *   structures by assigning missing `projectId`s to an "Inbox" project.
 * - `taskItemProps` object is used to prevent prop drilling for `TaskItem` components, bundling
 *   all necessary props.
 * - **Deterministic Sorting (Gen 6 Update)**: Implements deterministic sorting based on `createdAt`
 *   timestamp with an ID-based tie-breaker. Sorting direction is managed via `SortDirection`.
 * =================================================================================================
 */

import { useState, useEffect, useMemo } from "react";

import usePersistentState from "./usePersistentState";

import {
  Project,
  ThreadsState,
  Thread,
  Task,
  Session,
  ThreadStatus,
  SortConfig,
  SortDirection,
} from "../types";

import {
  updateTaskRecursive,
  countAllTasks,
  countAllCompletedTasks,
} from "../utils/taskUtils";

import { sortThreads } from "../utils/sortUtils";

import { TaskItemProps } from "../components/TaskItem";

const useWorkflowManager = () => {
  // ==========================================================================

  // CORE STATE: All application data and UI state are managed here.

  // ==========================================================================

  const [projects, setProjects] = usePersistentState<Record<string, Project>>(
    "nested-workflow-projects",

    {}
  );

  const [selectedProjectId, setSelectedProjectId] = usePersistentState<string | null>(
    "nested-workflow-selected-project",
    null
  );

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

    // STRATEGY: Add a persistent state to control the visibility of completed tasks.
    // This allows the user's preference to be saved across sessions. Defaults to false (hidden).
  const [showCompleted, setShowCompleted] = usePersistentState<boolean>(
    "nested-workflow-show-completed",

    false
  );

  const [localShowCompleted, setLocalShowCompleted] = usePersistentState<Record<string, boolean>>(
    "localShowCompleted",
    {}
  );

  // STRATEGY: Global sort direction for threads. Defaults to newest first (desc).
  const [threadsSortDirection, setThreadsSortDirection] = usePersistentState<SortDirection>(
    "threadsSortDirection",
    "desc"
  );
  const toggleThreadShowCompleted = (threadId: string) => {
    setLocalShowCompleted(prev => ({
      ...prev,
      [threadId]: !(prev[threadId] ?? false),
    }));
  };


  useEffect(() => {
    // STRATEGY: Handles application initialization and data integrity checks on mount.

    // 1. Project Initialization: If no projects exist, create a default "Inbox" project.

    //    This ensures the app is never in a state without at least one project.

    if (Object.keys(projects).length === 0) {
      const inboxId = "proj-inbox";

      const newProject: Project = {
        id: inboxId,
        name: "Inbox",
        parentId: null,
      };

      setProjects({ [inboxId]: newProject });
    }

    // 2. Project Selection: If no project is selected but projects exist, select the first

    //    available root project to ensure the UI is always displaying a valid project context.

    if (!selectedProjectId && Object.keys(projects).length > 0) {
      const firstProject =
        (Object.values(projects) as Project[]).find(
          (p) => p.parentId === null
        ) || (Object.values(projects) as Project[])[0];

      if (firstProject) {
        setSelectedProjectId(firstProject.id);
      }
    }

    // 3. Data Migration: For backward compatibility, this checks if any threads are missing a

    //    `projectId`. If so, it assigns them to the "Inbox" project. This is a one-time

    //    migration to handle older data structures.

        const threadsNeedMigration =
      Array.isArray(threads) ||
      Object.values(threads).some((t) => typeof t === 'object' && t !== null && !('projectId' in t));

    if (threadsNeedMigration && Object.keys(projects).length > 0) {
      let inboxId = (Object.values(projects) as Project[]).find(
        (p) => p.name === "Inbox"
      )?.id;

      if (!inboxId) {
        inboxId = "proj-inbox";
      }

      // Define a utility function to normalize thread data
      const normalizeThread = (thread: Partial<Thread>, inboxId: string): Thread => {
          return {
              id: thread.id || `thread-${Date.now()}`, // Ensure ID exists
              projectId: thread.projectId || inboxId,
              title: thread.title || 'Migrated Thread',
              status: thread.status || 'active',
              lastWorked: thread.lastWorked || new Date().toISOString().split("T")[0],
              tasks: thread.tasks || [],
              sessions: thread.sessions || [],
              createdAt: thread.createdAt || Date.now(),
          };
      };

      setThreads((currentThreads) => {
        const migratedThreads: ThreadsState = {};

        if (Array.isArray(currentThreads)) {
          (currentThreads as Array<Partial<Thread>>).forEach((thread) => {
            if (typeof thread === "object" && thread !== null && thread.id) {
              migratedThreads[thread.id] = normalizeThread(thread, inboxId!);
            }
          });
        } else {
          Object.keys(currentThreads).forEach((id) => {
            const thread = currentThreads[id];
            if (typeof thread === "object" && thread !== null && thread.id) {
                migratedThreads[id] = normalizeThread(thread, inboxId!);
            }
          });
        }

        return migratedThreads;
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, setProjects, threads, setThreads]);

  useEffect(() => {
    // STRATEGY: Ensures the integrity and consistency of the thread order and selection.

    // 1. Selection Cleanup: If the `selectedThreadId` points to a thread that no longer exists,

    //    it resets the selection to null, preventing UI errors.

    if (selectedThreadId && !threads[selectedThreadId]) {
      setSelectedThreadId(null);
    }

    const currentThreadIds = Object.keys(threads);

    // 2. Initial Order: If `threadOrder` is empty but threads exist, initialize it with all

    //    current thread IDs.

    if (threadOrder.length === 0 && currentThreadIds.length > 0) {
      setThreadOrder(currentThreadIds);

      return;
    }

    // 3. Order Sync: This reconciles the `threadOrder` array with the `threads` object. It removes

    //    any IDs from the order that are no longer in `threads` and appends any new thread IDs that

    //    are not yet in the order. This prevents desynchronization between the order and the data.

    const newOrder = threadOrder.filter((id) => currentThreadIds.includes(id));

    currentThreadIds.forEach((id) => {
      if (!newOrder.includes(id)) {
        newOrder.push(id);
      }
    });

    if (
      newOrder.length !== threadOrder.length ||
      newOrder.some((id, i) => id !== threadOrder[i])
    ) {
      setThreadOrder(newOrder);
    }
  }, [threads, selectedThreadId, threadOrder, setThreadOrder]);

  // ==========================================================================

  // PROJECT OPERATIONS

  // ==========================================================================

  const addProject = (name: string, parentId: string | null) => {
    // CONSTRAINT: Do not allow projects with empty or whitespace-only names.

    if (!name.trim()) return;

    const newProjectId = `proj-${Date.now()}`;

    const newProject: Project = {
      id: newProjectId,

      name,

      parentId,
    };

    setProjects((prev) => ({ ...prev, [newProjectId]: newProject }));
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  // STRATEGY: Renames a project by updating its name in the projects state.

  // This is a non-destructive, single-entity update.

  // INVARIANT: The projectId must exist in the projects state for the update to occur.

  const renameProject = (projectId: string, newName: string) => {
    if (!newName.trim()) return; // Disallow empty names

    setProjects((prev) => {
      // CONSTRAINT: Safety check to prevent errors if the project ID does not exist.

      if (!prev[projectId]) return prev;

      return {
        ...prev,

        [projectId]: { ...prev[projectId], name: newName },
      };
    });
  };

  // STRATEGY: Implements a cascading delete for a project and all its descendants.

  // This is a critical and destructive operation that affects multiple parts of the state.

  // 1. Identification: It first traverses the project hierarchy to gather the IDs of the target project and all its nested children. A breadth-first search is used for this traversal.

  // 2. Project Deletion: It removes all identified projects from the main `projects` state object.

  // 3. Thread Deletion: It then purges all threads from the `threads` state object that are associated with any of the deleted project IDs.

  // 4. UI State Update: Finally, it intelligently updates the `selectedProjectId` to ensure the UI doesn't point to a non-existent project. It prioritizes selecting the parent of the deleted project, falling back to another root project if necessary.

  // INVARIANT: All descendants of the deleted project and their associated threads must be removed to maintain data integrity.

  const deleteProject = (projectId: string) => {
    // 1. Identification: Gather all descendant project IDs.

    const idsToDelete = new Set<string>([projectId]);

    const queue = [projectId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      const children = (Object.values(projects) as Project[]).filter(
        (p) => p.parentId === currentId
      );

      children.forEach((child) => {
        if (!idsToDelete.has(child.id)) {
          idsToDelete.add(child.id);

          queue.push(child.id);
        }
      });
    }

    const idsToDeleteArray = Array.from(idsToDelete);

    // 2. Project Deletion: Atomically update projects state.

    setProjects((prev) => {
      const newProjects = { ...prev };

      idsToDeleteArray.forEach((id) => delete newProjects[id]);

      return newProjects;
    });

    // 3. Thread Deletion: Atomically update threads state.

    setThreads((prev) => {
      const newThreads = { ...prev };

      Object.keys(newThreads).forEach((threadId) => {
        if (idsToDelete.has(newThreads[threadId].projectId)) {
          delete newThreads[threadId];
        }
      });

      return newThreads;
    });

    // 4. UI State Update: Reselect a new project if the current one was deleted.

    if (selectedProjectId && idsToDelete.has(selectedProjectId)) {
      const projectToDelete = projects[projectId];

      const parentId = projectToDelete?.parentId;

      // STRATEGY: Prefer selecting the parent of the deleted project for better UX continuity.

      if (parentId && projects[parentId] && !idsToDelete.has(parentId)) {
        setSelectedProjectId(parentId);
      } else {
        // Fallback: select any other root project that wasn't deleted to avoid a blank screen.

        const anyOtherRootProject = (Object.values(projects) as Project[]).find(
          (p) => p.parentId === null && !idsToDelete.has(p.id)
        );

        setSelectedProjectId(
          anyOtherRootProject ? anyOtherRootProject.id : null
        );
      }
    }
  };

  // ==========================================================================

  // THREAD OPERATIONS

  // ==========================================================================

  const addThread = () => {
    // CONSTRAINT: A thread must have a title and be associated with a project.

    if (!newThreadTitle.trim() || !selectedProjectId) {
      alert("Please select a project before adding a thread.");

      return;
    }

    const newThreadId = `thread-${Date.now()}`;

    const newThread: Thread = {
      id: newThreadId,

      projectId: selectedProjectId,

      title: newThreadTitle,

      status: "active",

      lastWorked: new Date().toISOString().split("T")[0],

      tasks: [],

      sessions: [],
      createdAt: Date.now(),
    };

    setThreads((prev) => ({ ...prev, [newThreadId]: newThread }));

    // STRATEGY: New threads are prepended to the order to appear at the top of the list by default.
    setThreadOrder((prev) => [newThreadId, ...prev]);

    setNewThreadTitle("");

    setIsAddingThread(false);

    // STRATEGY: Automatically expand the new thread and select it for immediate user interaction.

    setExpandedThreads((prev) => new Set([...prev, newThreadId]));

    setSelectedThreadId(newThreadId);
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);

    // STRATEGY: When a thread is selected, move it to the top of the order for visibility.

    setThreadOrder((prev) => {
      const newOrder = prev.filter((id) => id !== threadId);

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
      // CONSTRAINT: Ensure thread exists before attempting to update its status.

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
    // STRATEGY: Use a confirmation dialog before performing a destructive action.

    if (window.confirm("Are you sure you want to delete this thread? This action cannot be undone.")) {
      const newThreads = { ...threads };

      delete newThreads[threadId];

      setThreads(newThreads);

      setThreadOrder((prev) => prev.filter((id) => id !== threadId));

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
    setThreads((prevThreads) => {
      const threadToUpdate = prevThreads[threadId];

      if (!threadToUpdate) return prevThreads;

      const findTask = (tasks: Task[], id: string): Task | undefined => {
        for (const task of tasks) {
          if (task.id === id) return task;

          if (task.children) {
            const found = findTask(task.children, id);

            if (found) return found;
          }
        }
      };

      const taskToUpdate = findTask(threadToUpdate.tasks, taskId);

      const updatedTasks = updateTaskRecursive(
        threadToUpdate.tasks,
        taskId,
        !taskToUpdate?.done
      );

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
    setThreads((prevThreads) => {
      const threadToUpdate = prevThreads[threadId];

      if (!threadToUpdate) return prevThreads;

      const updatedTasks = updateTaskRecursive(
        threadToUpdate.tasks,
        taskId,
        undefined,
        undefined,
        newText
      );

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

  const updateTaskText = (
    threadId: string,
    taskId: string,
    newText: string
  ) => {
    setThreads((prevThreads) => {
      const threadToUpdate = prevThreads[threadId];

      if (!threadToUpdate) return prevThreads;

      const updatedTasks = updateTaskRecursive(
        threadToUpdate.tasks,
        taskId,
        undefined,
        newText
      );

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

      priority: 0,
      createdAt: Date.now(),
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

            priority: 0,
            createdAt: Date.now(),
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

  const setTaskPriority = (
    threadId: string,
    taskId: string,
    priority: number
  ) => {
    setThreads((prevThreads) => {
      const threadToUpdate = prevThreads[threadId];

      if (!threadToUpdate) return prevThreads;

      const updatedTasks = updateTaskRecursive(
        threadToUpdate.tasks,
        taskId,
        undefined,
        undefined,
        undefined,
        priority
      );

      return {
        ...prevThreads,

        [threadId]: {
          ...threadToUpdate,

          tasks: updatedTasks,
        },
      };
    });
  };

  // ==========================================================================

  // SESSION OPERATIONS

  // ==========================================================================

  const updateThreadSort = (threadId: string, config: SortConfig) => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: { ...prev[threadId], sortConfig: config },
    }));
  };

  const updateTaskSort = (threadId: string, taskId: string, config: SortConfig) => {
    setThreads((prevThreads) => {
      const threadToUpdate = prevThreads[threadId];
      if (!threadToUpdate) return prevThreads;

      const updatedTasks = updateTaskRecursive(
        threadToUpdate.tasks,
        taskId,
        undefined,
        undefined,
        undefined,
        undefined,
        config
      );

      return {
        ...prevThreads,
        [threadId]: {
          ...threadToUpdate,
          tasks: updatedTasks,
        },
      };
    });
  };

  const addSession = (threadId: string, notes: string) => {
    if (!notes.trim()) return;

    const now = new Date();

    const date = now.toISOString().split("T")[0];

    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newSession: Session = { date, time, notes };

    setThreads((prev) => ({
      ...prev,

      [threadId]: {
        ...prev[threadId],

        // STRATEGY: Prepend new sessions to the array so they appear at the top of the log.

        sessions: [newSession, ...prev[threadId].sessions],

        lastWorked: `${date} ${time}`,
      },
    }));

    setAddingSessionTo(null);
  };

  // ==========================================================================

  // DERIVED STATE & MEMOIZED VALUES

  // STRATEGY: `useMemo` is used for computationally expensive derived state. This prevents

  // these values from being recalculated on every render, optimizing performance.

  // ==========================================================================

  // Get the full object for the currently selected thread.

  const selectedThread = selectedThreadId ? threads[selectedThreadId] : null;

  // Calculate all descendant project IDs for the currently selected project.

  const descendantProjectIds = useMemo(() => {
    // STRATEGY: A recursive function traverses the project tree to find all children.

    const getDescendants = (projectId: string): string[] => {
      const children = (Object.values(projects) as Project[])

        .filter((p) => p.parentId === projectId)

        .map((p) => p.id);

      return [...children, ...children.flatMap(getDescendants)];
    };

    if (!selectedProjectId) return [];

    return [selectedProjectId, ...getDescendants(selectedProjectId)];
  }, [selectedProjectId, projects]);

  // Filter the master thread order to only show threads belonging to the selected project and its descendants.

  const filteredThreadOrder = useMemo(() => {
    let order = threadOrder;
    if (selectedProjectId) {
      order = threadOrder.filter((id) => {
        const thread = threads[id];
        return thread && descendantProjectIds.includes(thread.projectId);
      });
    }

    // Apply global thread sorting
    const filteredThreads = order.map(id => threads[id]).filter(t => !!t) as Thread[];
    const sorted = sortThreads(filteredThreads, threadsSortDirection);
    return sorted.map(t => t.id);
  }, [threadOrder, threads, descendantProjectIds, selectedProjectId, threadsSortDirection]);

  // Calculate global task counts across all threads.

  const { globalTotalTasks, globalCompletedTasks } = useMemo(() => {
    let total = 0;

    let completed = 0;

    threadOrder.forEach((threadId) => {
      const thread = threads[threadId];

      if (thread) {
        // STRATEGY: Delegate task counting to a dedicated utility function to handle recursion.

        total += countAllTasks(thread.tasks);

        completed += countAllCompletedTasks(thread.tasks);
      }
    });

    return { globalTotalTasks: total, globalCompletedTasks: completed };
  }, [threadOrder, threads]);

  const globalTotalThreads = threadOrder.length;

  // STRATEGY: Group all props needed by `TaskItem` into a single object. This avoids passing a

  // long list of individual props through multiple component layers (prop drilling).

    const taskItemProps: Omit<TaskItemProps, "task" | "threadId" | "level"> = {

      expandedTasks,

      editingNote,

      addingChildTo,

      editingTaskId,

      editedTaskText,

      showCompleted,

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

      setTaskPriority,
      updateTaskSort,
    };

  return {
    // ================== CORE DATA STATE ==================

    projects,

    threads,

    threadOrder,

    // ================== UI SELECTION & EXPANSION STATE ==================

    selectedProjectId,

    selectedThreadId,

    expandedTasks,

    expandedThreads,

    // ================== TRANSIENT UI EDITING STATE ==================

    isAddingThread,

    newThreadTitle,

    addingSessionTo,

    editingThreadId,

    editingTaskId,

    editedTaskText,

    

        editingNote,

    

        addingChildTo,

    

        newChildText,

    

        // ================== DERIVED STATE ==================

    

        selectedThread,

    

        descendantProjectIds,

    

        filteredThreadOrder,

    

        globalTotalThreads,

    

        globalTotalTasks,

    

        globalCompletedTasks,

    

        showCompleted,

        localShowCompleted,

    

        // ================== PROP COLLECTIONS ==================

    

        taskItemProps,

    

        // ================== STATE SETTERS & ACTIONS ==================

    

        // Projects

    

        addProject,

    

        handleSelectProject,

    

        renameProject,

    

        deleteProject,

    

        setProjects,

    

        setSelectedProjectId,

    

        // Threads

    

        addThread,

    

        handleSelectThread,

    

        updateThreadTitle,

    

        updateThreadStatus,

    

        deleteThread,

    

        toggleThread,

    

        setThreads,

    

        setThreadOrder,

    

        setExpandedThreads,

    

        setIsAddingThread,

    

        setNewThreadTitle,

    

        setEditingThreadId,

    

        setSelectedThreadId,
        toggleThreadShowCompleted,
        threadsSortDirection,
        setThreadsSortDirection,

    

        // Tasks

    

        addRootTaskToThread,

    

        addChild,

    

        toggleTask,

    

        toggleTaskDone,

    

        saveNote,

    

        updateTaskText,

    

        setExpandedTasks,

    

        setEditingNote,

    

        setAddingChildTo,

        setNewChildText,

    

        setEditingTaskId,

    

        setEditedTaskText,

    

        setTaskPriority,
        updateTaskSort,
        updateThreadSort,

    

        // Sessions

    

        addSession,

    

        setAddingSessionTo,

    

        setShowCompleted,

      };

    };

export default useWorkflowManager;

