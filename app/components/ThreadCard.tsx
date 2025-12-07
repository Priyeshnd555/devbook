/**
 * =================================================================================================
 * CONTEXT ANCHOR: ThreadCard Component (ThreadCard.tsx)
 * =================================================================================================
 *
 * @purpose
 * Renders a full "thread" card, which acts as a top-level container for a group of tasks. It's
 * a major UI component that displays thread metadata, progress, and actions, and contains the
 * list of root-level tasks for that thread.
 *
 * @dependencies
 * - REACT: `useState`, `useEffect` for internal UI state management.
 * - LUCIDE-REACT: For all iconography.
 * - COMPONENT: `TaskItem`: Renders each individual task within the card.
 * - TYPES: `Thread`, `ThreadStatus`, and other related types from `../types`.
 *
 * @invariants
 * 1. CONTROLLED COMPONENT: This component is fully controlled by its parent. It receives the `thread`
 *    object and all necessary event handlers (e.g., `onUpdateTitle`, `onDelete`) as props.
 * 2. PROP DRILLING SOLUTION: It receives a `taskItemProps` object, which is a collection of all
 *    props needed by the child `TaskItem` components. This strategy avoids manually passing a
 *    long list of props through this component (prop drilling).
 *
 * @state_management
 * - Manages its own transient UI state, such as `isStatusMenuOpen` for the status dropdown and
 *   `sessionNotes` for the "Log Session" input.
 * - The `title` is also managed in local state to allow for inline editing, but it's synchronized
 *   with the parent's `thread.title` prop via a `useEffect`.
 *
 * @ai_note
 * This is a key presentational component. The main areas of logic to understand are:
 * - The header section, which includes inline title editing and a status dropdown menu.
 * - The conditional rendering of the "Log Session" form (`isAddingSession`).
 * - The conditional rendering of the task list when the thread is expanded (`isThreadExpanded`).
 * - How it passes the `taskItemProps` object down to each `TaskItem`.
 * =================================================================================================
 */
import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Pencil,
  Trash2,
} from "lucide-react";
import { TaskItem, TaskItemProps } from "./TaskItem"; // Import TaskItem and its props
import { Thread, THREAD_STATE_TRANSITIONS, ThreadStatus } from "../types";
import { isTaskFullyCompleted } from "../utils/taskUtils";

export interface ThreadCardProps {
  thread: Thread;
  threadNumber: number;
  totalTaskCount: number;
  completedTaskCount: number;
  isThreadExpanded: boolean;
  isSelected: boolean;
  onSelect: () => void;
  toggleThread: (threadId: string) => void;
  onUpdateTitle: (threadId: string, newTitle: string) => void;
  onDelete: (threadId: string) => void;
  onAddRootTask: (threadId: string) => void;
  onUpdateStatus: (threadId: string, status: ThreadStatus) => void;
  addingSessionTo: string | null;
  setAddingSessionTo: (id: string | null) => void;
  onAddSession: (threadId: string, notes: string) => void;
  editingThreadId: string | null;
  setEditingThreadId: (id: string | null) => void;
  taskItemProps: Omit<TaskItemProps, 'task' | 'threadId' | 'level'>;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  threadNumber,
  totalTaskCount,
  completedTaskCount,
  isThreadExpanded,
  isSelected,
  onSelect,
  toggleThread,
  onUpdateTitle,
  onDelete,
  onAddRootTask,
  onUpdateStatus,
  addingSessionTo,
  setAddingSessionTo,
  onAddSession,
  editingThreadId,
  setEditingThreadId,
  taskItemProps,
}) => {
  const isAddingSession = addingSessionTo === thread.id;
  const [title, setTitle] = useState<string>(thread.title);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState<string>("");

  const handleUpdate = () => {
    if (title.trim()) onUpdateTitle(thread.id, title);
  };

  const handleAddTask = () => {
      onAddRootTask(thread.id);
  }

  // STRATEGY: A configuration object maps thread statuses to specific Tailwind CSS classes.
  // This centralizes styling logic, making it easy to update the visual representation of statuses.
  const statusConfig: Record<ThreadStatus, { bg: string, text: string, dot: string }> = {
    active: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
    blocked: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
    completed: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
  };
  const statusStyle = statusConfig[thread.status];

  // STRATEGY: Synchronize the local `title` state with the `thread.title` prop.
  // This ensures that if the title is updated from the parent, the local state reflects the change.
  useEffect(() => {
    setTitle(thread.title);
  }, [thread.title]);

  // STRATEGY: This handler prevents clicks on interactive elements (buttons, inputs) within the card
  // from triggering the `onSelect` action for the entire card.
  const handleCardClick = (e: React.MouseEvent) => {
    // CONSTRAINT: Only trigger `onSelect` if the click target is not an interactive element.
    if (e.target instanceof HTMLElement) {
      if (e.target.closest('button, input')) {
        return;
      }
    }
    onSelect();
  }

  return (
    <div 
      className={`bg-white rounded-lg border mb-4 shadow-sm transition-all ${isSelected ? 'border-orange-400 shadow-md' : 'border-gray-200'}`}
      key={thread.id}
    >
      <div 
        className="p-4 border-b border-gray-100 cursor-pointer" 
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 group mb-3">
              <span className="flex-shrink-0 w-6 text-center text-xs font-mono text-gray-400" title={`Thread ${threadNumber}`}>
                {threadNumber}.
              </span>
              <button onClick={(e) => { e.stopPropagation(); toggleThread(thread.id); }} className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                {isThreadExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              {/* STRATEGY: Implement inline editing for the thread title. When `editingThreadId` matches this thread,
                  render an input field; otherwise, render the title text. */}
              {editingThreadId === thread.id ? (
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleUpdate} onKeyPress={(e) => e.key === "Enter" && handleUpdate()} className="text-base font-medium text-gray-900 flex-1 px-2 py-1 border-b-2 border-orange-500 focus:outline-none bg-transparent" autoFocus onClick={(e) => e.stopPropagation()}/>
              ) : (
                <h3 className="text-base font-medium text-gray-900" onClick={(e) => { e.stopPropagation(); setEditingThreadId(thread.id);}}>{thread.title}</h3>
              )}
              {/* STRATEGY: Action buttons (edit, delete) are hidden until the user hovers over the title area. */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setEditingThreadId(thread.id);}} className="p-1 text-gray-400 hover:text-orange-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(thread.id);}} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 ml-12">
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> <span className="truncate">{thread.lastWorked}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">{completedTaskCount}/{totalTaskCount}</span>
                {/* STRATEGY: The progress bar width is dynamically calculated based on task completion percentage. */}
                <div className="bg-gray-200 rounded-full h-1 w-16"><div className="bg-orange-500 h-1 rounded-full transition-all" style={{ width: `${totalTaskCount > 0 ? (completedTaskCount / totalTaskCount) * 100 : 0}%` }}></div></div>
              </div>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setIsStatusMenuOpen(!isStatusMenuOpen);}} onBlur={() => setIsStatusMenuOpen(false)} className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${statusStyle.bg} flex-shrink-0`}>
                  <div className={`w-1 h-1 rounded-full ${statusStyle.dot}`}></div>
                  <span className={`text-xs font-medium ${statusStyle.text}`}>{thread.status}</span>
                </button>
                {/* STRATEGY: The status menu is rendered conditionally and positioned absolutely relative to its button. */}
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

          <button onClick={(e) => { e.stopPropagation(); setAddingSessionTo(thread.id); }} className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Log
          </button>
        </div>
      </div>

      {/* STRATEGY: The "Log Session" form is conditionally rendered below the header when `isAddingSession` is true for this specific thread. */}
      {isAddingSession && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Work session</h4>
          <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="What did you work on?" className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" rows={2} autoFocus/>
          <div className="flex gap-2 mt-2">
            <button onClick={() => {onAddSession(thread.id, sessionNotes); setSessionNotes('')}} className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors font-medium">Save</button>
            <button onClick={() => { setAddingSessionTo(null); setSessionNotes(""); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* STRATEGY: The entire task list section is conditionally rendered based on whether the thread is expanded. */}
      {isThreadExpanded && (
        <>
          <div className="p-4">
            <button onClick={() => taskItemProps.setAddingChildTo(`${thread.id}-root`)} className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-xs font-medium mb-3 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>

            {/* STRATEGY: The input for adding a new root task is shown only when the user has clicked the "Add task" button. */}
            {taskItemProps.addingChildTo === `${thread.id}-root` && (
              <div className="mb-3 flex gap-2">
                <input type="text" value={taskItemProps.newChildText} onChange={(e) => taskItemProps.setNewChildText(e.target.value)} placeholder="New task..." className="flex-1 px-3 py-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" autoFocus onKeyPress={(e) => e.key === "Enter" && handleAddTask()} />
                <button onClick={handleAddTask} className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors font-medium">Add</button>
              </div>
            )}

            {thread.tasks.length > 0 ? (
              <div className="space-y-0.5">{
                [...thread.tasks].sort((a, b) => {
                  if ((b.priority || 0) !== (a.priority || 0)) {
                    return (b.priority || 0) - (a.priority || 0);
                  }
                  const aDone = isTaskFullyCompleted(a);
                  const bDone = isTaskFullyCompleted(b);
                  if (aDone !== bDone) {
                    return aDone ? 1 : -1;
                  }
                  return 0;
                }).map((task) => <TaskItem key={`${thread.id}-${task.id}`} {...taskItemProps} task={task} threadId={thread.id} />)
              }</div>
            ) : (
              // STRATEGY: Display a helpful empty state message if there are no tasks.
              <div className="py-6 text-center text-xs text-gray-400"><p>No tasks. Add one to begin.</p></div>
            )}
          </div>
        </>
      )}
    </div>
  );
};