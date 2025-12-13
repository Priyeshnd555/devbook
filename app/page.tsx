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
// PURPOSE: To provide AI context on the existing styling approach and outline a strategy for
//          implementing a user-configurable theming system (e.g., color modes, font sizes).
//
// CURRENT APPROACH:
// - STYLING FRAMEWORK: Tailwind CSS is used exclusively for styling.
// - METHODOLOGY: Utility classes (e.g., `bg-gray-50`, `text-lg`, `border-b`) are applied directly
//   within the JSX of the components. This approach is excellent for rapid prototyping and co-locating
//   styles with markup.
// - HARDCODED VALUES: Specific theme colors (e.g., `bg-orange-600`) and sizes are hardcoded
//   throughout the application, which makes global theme changes difficult.
//
// GOAL: Evolve the current system to support dynamic theming, allowing users to change the primary
//       color and increase/decrease the base font size.
//
// HIGH-LEVEL STRATEGY:
// The core strategy is to abstract design tokens (colors, fonts) into CSS variables and
// configure Tailwind to use them. This decouples the design from the component structure, enabling
// dynamic changes via JavaScript.
//
// LOW-LEVEL IMPLEMENTATION PLAN:
//
// 1. DEFINE THEME TOKENS WITH CSS VARIABLES:
//    - WHERE: `app/globals.css`
//    - WHAT: Define a base set of CSS custom properties within a `:root` selector. This creates
//      the default theme. For a dark mode, define overrides within a `[data-theme='dark']` selector.
//    - EXAMPLE (`globals.css`):
//      :root {
//        --color-primary: 24 99% 55%; /* hsl(24 99% 55%) -> orange-600 */
//        --color-background: 210 40% 98%; /* hsl(210 40% 98%) -> gray-50 */
//        --color-text-primary: 222 47% 11%; /* hsl(222 47% 11%) -> gray-900 */
//        --font-base-size: 16px;
//      }
//      [data-theme='dark'] {
//        --color-primary: 24 99% 55%;
//        --color-background: 222 47% 11%;
//        --color-text-primary: 210 40% 98%;
//      }
//
// 2. INTEGRATE TOKENS WITH TAILWIND CSS:
//    - WHERE: `tailwind.config.js`
//    - WHAT: Modify the `theme.extend` object to make Tailwind aware of the CSS variables.
//      Use the `hsl(var(--variable-name))` format to ensure colors are applied correctly.
//    - EXAMPLE (`tailwind.config.js`):
//      theme: {
//        extend: {
//          colors: {
//            primary: 'hsl(var(--color-primary))',
//            background: 'hsl(var(--color-background))',
//            'text-primary': 'hsl(var(--color-text-primary))',
//          },
//        },
//      },
//
// 3. REFACTOR COMPONENTS TO USE SEMANTIC CLASSES:
//    - WHERE: Throughout all `.tsx` components (e.g., this file, `ThreadCard.tsx`).
//    - WHAT: Replace hardcoded utility classes with the new, semantic theme classes.
//    - BEFORE: className="bg-orange-600 text-gray-900"
//    - AFTER:  className="bg-primary text-text-primary"
//
// 4. IMPLEMENT THEME & FONT SIZE CONTROLS:
//    - WHERE: A new settings component or a global state provider (e.g., `useWorkflowManager` or a new `useThemeManager` hook).
//    - WHAT:
//      - For Color Theme: Use React state to toggle a `data-theme` attribute on the `document.documentElement` (`<html>` tag).
//      - For Font Size: Use React state to dynamically set the `font-size` property on `document.documentElement`. Because Tailwind's `rem` units are relative to the root font size, all `rem`-based styles will scale automatically.
//    - EXAMPLE (JS/TSX):
//      React.useEffect(() => {
//        // For color theme
//        document.documentElement.setAttribute('data-theme', theme); // 'light' or 'dark'
//        // For font size
//        document.documentElement.style.fontSize = `${baseFontSize}px`; // e.g., 16, 18, etc.
//      }, [theme, baseFontSize]);
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
    <div className="flex h-screen bg-gray-50 font-sans">
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
        <header className="bg-white border-b border-gray-200 shadow-xs z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
               <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900">
                  Thread Notes
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nested task tracking &bull; {globalTotalThreads} Threads
                  &bull; {globalCompletedTasks}/{globalTotalTasks} Tasks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsAddingThread(true)}
                    className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors disabled:bg-gray-400"
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
              <div className="mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  New thread
                </h3>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && addThread()}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addThread}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingThread(false);
                      setNewThreadTitle("");
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
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
                        // STRATEGY: Pass down the showCompleted state to allow ThreadCard to filter tasks.
                        showCompleted={showCompleted}
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
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="text-base font-medium text-gray-900">
                      Session Log
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {selectedThread.title}
                    </p>
                  </div>
                  <div className="p-4 space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto">
                    {/* STRATEGY: Display individual session notes or a message if no sessions are logged for the selected thread. */}
                    {selectedThread.sessions.length > 0 ? (
                      selectedThread.sessions.map((session, idx) => (
                        <div
                          key={`${selectedThread.id}-session-${idx}`}
                          className="bg-gray-50 rounded p-3 text-xs border border-gray-200"
                        >
                          <div className="text-gray-500 mb-1.5 font-medium">
                            {session.date} at {session.time}
                          </div>
                          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {session.notes}
                          </div>
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
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};

export default NestedWorkflow;
