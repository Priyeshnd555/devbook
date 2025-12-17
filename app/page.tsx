"use client";

// =================================================================================================
// CONTEXT ANCHOR: MAIN PAGE (app/page.tsx)
// =================================================================================================
// PURPOSE: This file serves as the main entry point for the Nested Workflow application's UI.
// It assembles the primary components and orchestrates the overall layout and data flow.
//
// DEPENDENCIES:
// - HOOK: useWorkflowManager (from ./hooks/useWorkflowManager.ts)
// - HOOK: usePersistentState (from ./hooks/usePersistentState.ts)
// - UTILS: taskUtils (from ./utils/taskUtils.ts)
// - TYPES: (from ./types/index.ts)
// - COMPONENT: ProjectSidebar (from ./components/ProjectSidebar.tsx)
// - COMPONENT: ThreadCard (from ./components/ThreadCard.tsx)
// - COMPONENT: TaskItem (implied within ThreadCard, from ./components/TaskItem.tsx)
// - COMPONENT: HeaderActions (from ./components/HeaderActions.tsx)
//
// INVARIANTS:
// - This component strictly follows a "thin" or "presentational" pattern, focusing solely on UI
//   layout and composition. It does not contain complex business logic or state manipulation.
// - All data flow is managed through props and callbacks provided by the `useWorkflowManager` hook.
// - Application data (projects, threads, tasks) is consistently typed according to `types/index.ts`.
//
// ARCHITECTURE OVERVIEW:
// This component leverages several architectural pieces:
//
// # HOOK: useWorkflowManager (from /hooks/useWorkflowManager.ts)
//    - PURPOSE: The brain of the application. It encapsulates all state (projects, threads, tasks)
//      and the logic to manipulate it (add, update, delete operations).
//    - AI-NOTE: To understand the application's business logic, start by analyzing this hook.
//
// # HOOK: usePersistentState (from /hooks/usePersistentState.ts)
//    - PURPOSE: A generic utility hook that abstracts away the logic for storing and retrieving
//      state from the browser's localStorage. It ensures data persists across sessions.
//
// # UTILS: taskUtils (from /utils/taskUtils.ts)
//    - PURPOSE: A collection of pure, stateless functions for performing calculations and
//      transformations on task data (e.g., counting tasks, recursive updates).
//
// # TYPES: index.ts (from /types/index.ts)
//    - PURPOSE: The single source of truth for all data structures (interfaces and types) used
//      throughout the application, like `Project`, `Thread`, and `Task`.
//
// # COMPONENTS:
//    - ProjectSidebar: Renders the hierarchical project list and navigation controls.
//    - ThreadCard: Renders a container for a top-level workstream, including its tasks.
//    - TaskItem: Renders a single, potentially nested, task.
// =================================================================================================

// =================================================================================================
// CONTEXT ANCHOR: CSS & THEMING STRATEGY
// =================================================================================================
// PURPOSE: To document the evolved styling approach, specifically the user-configurable dark theme.
//
// EVOLUTIONARY FOOTPRINT:
// # GENERATION 1: Utility-first, hardcoded values (Initial State)
//   - Components used raw Tailwind classes like `bg-gray-50`.
//   - No support for global theme switching.
//
// # GENERATION 2: Semantic Variables & Dark Mode (Intermediate State)
//   - IMPLEMENTATION:
//     1. `app/globals.css`: Defines CSS variables for colors (e.g., `--color-primary`) for both
//        root (light) and `.dark` scopes.
//     2. `tailwind.config.js`: Configured with `darkMode: 'class'` class mapping.
//     3. `app/providers/ThemeProvider.tsx`: Wraps the application to manage the `dark` class.
//
// # GENERATION 3: Dynamic Custom Colors (Current State)
//   - FEATURE: User can select preset colors (Orange, Green, Blue) or a Custom Color via picker.
//   - LOGIC: 
//     - `data-color='orange|green|blue'` handles presets via CSS overrides.
//     - `data-color='custom'` triggers dynamic injection of calculated CSS variables (via JS) 
//       directly onto the root element, bypassing `globals.css` presets for that specific mode.
//
// # GENERATION 4: Global Accessibility & Font Scaling (Current State)
//   - FEATURE: User can adjust global font size (Small/Normal/Large).
//   - LOGIC: `ThemeProvider` updates root `font-size` (14px/16px/18px). Since Tailwind uses `rem`,
//     the entire UI scales proportionally.
//   - FIXES: Session log overflow handled via `break-words`.
//
// STRATEGY:
// - STYLE INJECTION: The `ThemeProvider` injects the `dark` class, `data-color` attribute, and root `font-size`.
// - DYNAMIC CALCULATION: `themeUtils.ts` converts user Hex selection to HSL and generates variants
//   (primary, hover, light background, text) to maintain contrast and consistency automatically.
// - COMPONENT USAGE: Components (like this page) use semantic classes (e.g., `bg-background`, `text-text-primary`)
//   instead of hardcoded colors. This allows them to automatically adapt when the class changes.
// - INTERACTION: The `SettingsModal` calls `setTheme` from `useTheme` context to toggle the mode.
//
// KEY INVARIANTS:
// - All color-related classes must be semantic (e.g., `bg-surface` not `bg-white`) to support theming.
// - Layout dimensions and spacing remain handled by standard Tailwind utilities.
// =================================================================================================

import React from "react";
import { Plus } from "lucide-react";
import { ThreadCard } from "./components/ThreadCard"; // Import ThreadCard
import { motion, AnimatePresence } from "framer-motion";
import ProjectSidebar from "./components/ProjectSidebar";
import useWorkflowManager from "./hooks/useWorkflowManager";
import { countAllTasks, countAllCompletedTasks } from "./utils/taskUtils";
import SettingsModal from "./components/SettingsModal";
import HeaderActions from "./components/HeaderActions";

// ============================================================================
// COMPONENT CONTEXT: High-level overview of imported components for AI reference.
// ============================================================================
/*
  COMPONENT: ProjectSidebar (from ./components/ProjectSidebar.tsx)
  ----------------------------------------------------
  PURPOSE: Renders a sidebar that allows for creation and navigation of nested projects.
           It displays projects in a hierarchical view.

  COMPONENT: HeaderActions (from ./components/HeaderActions.tsx)
  ----------------------------------------------------
  PURPOSE: Consolidates secondary actions (Show/Hide Completed, Settings) into a non-intrusive
           dropdown menu to reduce UI clutter and user cognitive load.

  COMPONENT: TaskItem (from ./components/TaskItem.tsx)
  ----------------------------------------------------
  PURPOSE: Renders a single, potentially nested, task item. It handles displaying
           the task's text, completion status, and note. It also manages user
           interactions for editing a task, adding a sub-task, toggling
           its 'done' state, and cycling through priority levels.
  KEY PROPS:
    - task: The task object to render.
    - threadId: The ID of the parent thread.
    - expandedTasks: A Set<string> to determine if the task's children are visible.
    - setTaskPriority: A handler to set the priority of a task.
    - ... (and many state handlers from the parent to modify the application state).

  COMPONENT: ThreadCard (from ./components/ThreadCard.tsx)
  ------------------------------------------------------
  PURPOSE: Renders a full "thread" card, which is a top-level container for a
           group of tasks. It displays thread metadata (title, status, last worked on),
           and contains the list of root-level TaskItems for that thread. It also
           handles thread-specific actions like logging a new work session, editing
           the thread title, and changing its status. The tasks within the card are
           automatically sorted first by priority (descending), and then by
           completion status. A task is only considered "completed" for sorting
           if it and all of its sub-tasks are also marked as done.
  KEY PROPS:
    - thread: The thread object to render.
    - isThreadExpanded: A boolean to control the visibility of the thread's content.
    - onUpdateTitle, onDelete, onUpdateStatus: Handlers for modifying the thread.
    - taskItemProps: A collection of props that are passed down to all child TaskItem components.
    - showCompleted: A boolean to control the visibility of completed tasks.

  COMPONENT: SettingsModal (from ./components/SettingsModal.tsx)
  ----------------------------------------------------
  PURPOSE: Renders a modal dialog for viewing and modifying application-wide settings.
           It is displayed as an overlay and contains controls for theme and other preferences.
*/

// =================================================================================================
// CONTEXT ANCHOR: DUAL-VISIBILITY SYSTEM FOR COMPLETED TASKS
// =================================================================================================
// PURPOSE: To explain the two-tiered system for controlling the visibility of completed tasks,
//          providing both a global override and a per-thread toggle for fine-grained control.
//
// OVERVIEW:
// The application employs a dual-state system for managing task visibility:
//
// 1. GLOBAL `showCompleted` (Boolean):
//    - SOURCE: `useWorkflowManager` -> `HeaderActions.tsx`
//    - EFFECT: Acts as a master switch. When `true`, all completed tasks in all threads are
//      visible, and the per-thread toggles are hidden to prevent conflicting states.
//    - AI-NOTE: This is the primary, high-level control for task visibility.
//
// 2. LOCAL `localShowCompleted` (Record<string, boolean>):
//    - SOURCE: `useWorkflowManager` -> `page.tsx` -> `ThreadCard.tsx`
//    - EFFECT: A dictionary where each key is a `thread.id` and the value is a boolean. It allows
//      a user to show/hide completed tasks for a *specific thread*.
//    - CONSTRAINT: This toggle is only visible and functional when the global `showCompleted`
//      is `false`. This creates a clear hierarchy of control.
//
// DATA FLOW:
// - `useWorkflowManager` manages both `showCompleted` and `localShowCompleted` states.
// - This component (`page.tsx`) retrieves both states from the hook.
// - It passes the global `showCompleted` state to `HeaderActions` for the master toggle.
// - It passes the global `showCompleted`, the specific `localShowCompleted[thread.id]` value,
//   and the `toggleThreadShowCompleted` handler down to each `ThreadCard`.
// - `ThreadCard` then uses these props to determine the final visibility of its tasks and to
//   render the local toggle switch.
// =================================================================================================

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
    showCompleted,
    setShowCompleted,
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
    renameProject,
    deleteProject,
    localShowCompleted,
    toggleThreadShowCompleted,
  } = useWorkflowManager();

  // STRATEGY: The visibility of the sidebar is managed at this top-level component
  // to allow other parts of the UI (like a main header button, if we had one) to control it.
  // This state is passed down to the ProjectSidebar, making it a controlled component.
  const [isSidebarVisible, setSidebarVisible] = React.useState(false);

  // STRATEGY: State to control the visibility of the application settings modal.
  // This is managed at the top-level page to allow the header button to control it,
  // while the modal itself is rendered at the root of the component.
  const [isSettingsModalOpen, setSettingsModalOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background font-sans">
      <ProjectSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onAddProject={addProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={deleteProject}
        onRenameProject={renameProject}
        // STRATEGY: Pass state and a toggle handler to the sidebar.
        // This makes the main page the source of truth for the sidebar's visibility state.
        isSidebarVisible={isSidebarVisible}
        onToggle={() => setSidebarVisible(!isSidebarVisible)}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-surface border-b border-border shadow-xs z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
               <div className="min-w-0">
                <h1 className="text-lg font-semibold text-text-primary">
                  Thread Notes
                </h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  Nested task tracking &bull; {globalTotalThreads} Threads
                  &bull; {globalCompletedTasks}/{globalTotalTasks} Tasks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsAddingThread(true)}
                    className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    // CONSTRAINT: New thread button is disabled if no project is selected to ensure threads are always associated with a project.
                    disabled={!selectedProjectId}
                    title={
                    !selectedProjectId
                        ? "Select a project to add a thread"
                        : "Add new thread"
                    }
                >
                    <Plus className="w-3.5 h-3.5" /> New Thread
                </button>
                {/* UX STRATEGY: To minimize cognitive load, secondary actions ('Show Completed', 'Settings') are consolidated into a dropdown menu.
                    This elevates the 'New Thread' button as the sole, unambiguous primary action in this area, directly addressing user feedback about a cluttered interface. */}
                <HeaderActions
                    showCompleted={showCompleted}
                    onToggleShowCompleted={setShowCompleted}
                    onOpenSettings={() => setSettingsModalOpen(true)}
                />
            </div>
          </div>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 py-4 w-full overflow-y-auto">
          <div className="md:col-span-2">
            {/* STRATEGY: Conditionally render the "Add New Thread" input form based on the `isAddingThread` state. */}
            {isAddingThread && (
              <div className="mb-3 p-4 bg-surface rounded-lg border border-border shadow-sm">
                <h3 className="text-sm font-medium text-text-primary mb-2">
                  New thread
                </h3>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Title..."
                  className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text-primary"
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && addThread()}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addThread}
                    className="px-3 py-1.5 bg-primary text-white rounded text-xs hover:bg-primary-hover transition-colors font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingThread(false);
                      setNewThreadTitle("");
                    }}
                    className="px-3 py-1.5 bg-background text-text-secondary border border-border rounded text-xs hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* STRATEGY: Use AnimatePresence for smooth entry/exit animations of thread cards. */}
              <AnimatePresence>
                {/* STRATEGY: Map over `filteredThreadOrder` to render ThreadCard components. This ensures UI updates reflect filtering/sorting logic from useWorkflowManager. */}
                {filteredThreadOrder.map((threadId, index) => {
                  const thread = threads[threadId];
                  // CONSTRAINT: Ensure 'thread' object exists before rendering; a null check prevents rendering issues if a thread is unexpectedly missing.
                  if (!thread) return null;
                  const totalTasks = countAllTasks(thread.tasks);
                  const completedTasks = countAllCompletedTasks(thread.tasks);
                  return (
                    // STRATEGY: Use Framer Motion for layout animations on thread cards, providing a dynamic user experience.
                    <motion.div
                      key={thread.id}
                      layout
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <ThreadCard
                        thread={thread}
                        threadNumber={index + 1}
                        totalTaskCount={totalTasks}
                        completedTaskCount={completedTasks}
                        // STRATEGY: Highlight the currently selected thread for visual feedback.
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
                        // STRATEGY: Pass down the global `showCompleted` state. This acts as a master override for all threads.
                        showCompleted={showCompleted}
                        // STRATEGY: Pass down the thread-specific visibility state from the `localShowCompleted` dictionary.
                        // The nullish coalescing operator `??` ensures a default of `false` if the thread has no entry yet.
                        localShowCompleted={localShowCompleted[thread.id] ?? false}
                        // STRATEGY: Pass down the handler to toggle the local visibility state for this specific thread.
                        onToggleLocalShowCompleted={() => toggleThreadShowCompleted(thread.id)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          <div className="md:col-span-1">
            {/* CONSTRAINT: The session log sidebar is sticky to remain visible during scrolling. */}
            <div className="sticky top-6">
              {/* STRATEGY: Conditionally render session log details or a placeholder message based on whether a thread is selected. */}
              {selectedThread ? (
                <div className={`bg-surface rounded-lg border mb-4 shadow-sm transition-all ${selectedThreadId === selectedThread.id ? 'border-primary/60 shadow-md' : 'border-border'}`}>
                  <div className="p-4 border-b border-border">
                    <h2 className="text-base font-medium text-text-primary">
                      Session Log
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {selectedThread.title}
                    </p>
                  </div>
                  <div className="p-4 space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto">
                    {/* STRATEGY: Display individual session notes or a message if no sessions are logged for the selected thread. */}
                    {selectedThread.sessions.length > 0 ? (
                      selectedThread.sessions.map((session, idx) => (
                        <div
                          key={`${selectedThread.id}-session-${idx}`}
                          className="bg-background rounded p-3 text-xs border border-border break-words"
                        >
                          <div className="text-text-secondary mb-1.5 font-medium">
                            {session.date} at {session.time}
                          </div>
                          <div className="text-text-primary leading-relaxed whitespace-pre-wrap">
                            {session.notes}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-xs text-text-secondary">
                        <p>No sessions logged for this thread.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-sm text-text-secondary">
                  <p>Select a thread to view its session log.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};

export default NestedWorkflow;
