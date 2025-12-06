// ============================================================================
// WORKFLOW MANAGER HOOK: Encapsulates all application state and business logic.
// PURPOSE: To separate state management from the UI, making the main component
// a "dumb" presentational component. This improves testability, maintainability,
// and AI comprehension by isolating complexity.
// DEPENDENCIES: `usePersistentState` hook, React hooks (`useState`, `useEffect`, `useMemo`).
// INVARIANTS: Returns a consistent API for the `NestedWorkflow` component to consume.
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import usePersistentState from './usePersistentState';
import {
  Project,
  ThreadsState,
  Thread,
  Task,
  Session,
  ThreadStatus,
} from '../types';
import {
  updateTaskRecursive,
  countAllTasks,
  countAllCompletedTasks,
} from '../utils/taskUtils';
import { TaskItemProps } from '../components/TaskItem';

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

  // STRATEGY: Renames a project by updating its name in the projects state.
  // This is a non-destructive, single-entity update.
  // INVARIANT: The projectId must exist in the projects state for the update to occur.
  const renameProject = (projectId: string, newName: string) => {
    if (!newName.trim()) return; // Disallow empty names
    setProjects(prev => {
      if (!prev[projectId]) return prev; // Safety check
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
    while(queue.length > 0) {
      const currentId = queue.shift()!;
      const children = Object.values(projects).filter(p => p.parentId === currentId);
      children.forEach(child => {
        if (!idsToDelete.has(child.id)) {
          idsToDelete.add(child.id);
          queue.push(child.id);
        }
      });
    }

    const idsToDeleteArray = Array.from(idsToDelete);
    
    // 2. Project Deletion: Atomically update projects state.
    setProjects(prev => {
      const newProjects = { ...prev };
      idsToDeleteArray.forEach(id => delete newProjects[id]);
      return newProjects;
    });

    // 3. Thread Deletion: Atomically update threads state.
    setThreads(prev => {
      const newThreads = { ...prev };
      Object.keys(newThreads).forEach(threadId => {
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
      // Prefer selecting the parent of the deleted project.
      if (parentId && projects[parentId] && !idsToDelete.has(parentId)) {
        setSelectedProjectId(parentId);
      } else {
        // Fallback: select any other root project that wasn't deleted.
        const anyOtherRootProject = Object.values(projects).find(p => p.parentId === null && !idsToDelete.has(p.id));
        setSelectedProjectId(anyOtherRootProject ? anyOtherRootProject.id : null);
      }
    }
  };

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
    renameProject,
    deleteProject
  };
};

export default useWorkflowManager;
