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
import { TaskItem, TaskItemProps } from "./TaskItem"; // Import TaskItem and its props
import { Thread, ThreadStatus, THREAD_STATE_TRANSITIONS } from "../page"; // Import necessary types from page.tsx

// CONTEXT ANCHOR
// PURPOSE: Renders a card for a single thread, including its metadata, tasks, and session history. It handles thread-level actions like editing the title, deleting, and logging work sessions.
// DEPENDENCIES: React hooks, Lucide icons, TaskItem component, Thread and related types from parent.
// INVARIANTS: Must be provided a 'thread' object and all required handler functions.
export interface ThreadCardProps {
  thread: Thread;
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
  const completedCount = thread.tasks.filter((t) => t.done).length;
  const totalCount = thread.tasks.length;
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

  // STATUS CONFIG: Maps status values to visual styles for clarity.
  const statusConfig: Record<ThreadStatus, { bg: string, text: string, dot: string }> = {
    active: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
    blocked: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
    completed: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
  };
  const statusStyle = statusConfig[thread.status];

  useEffect(() => {
    setTitle(thread.title);
  }, [thread.title]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent clicks on buttons and inputs from selecting the thread
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
              <button onClick={(e) => { e.stopPropagation(); toggleThread(thread.id); }} className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                {isThreadExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              {editingThreadId === thread.id ? (
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleUpdate} onKeyPress={(e) => e.key === "Enter" && handleUpdate()} className="text-base font-medium text-gray-900 flex-1 px-2 py-1 border-b-2 border-orange-500 focus:outline-none bg-transparent" autoFocus onClick={(e) => e.stopPropagation()}/>
              ) : (
                <h3 className="text-base font-medium text-gray-900" onClick={(e) => { e.stopPropagation(); setEditingThreadId(thread.id);}}>{thread.title}</h3>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setEditingThreadId(thread.id);}} className="p-1 text-gray-400 hover:text-orange-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(thread.id);}} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 ml-7">
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> <span className="truncate">{thread.lastWorked}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">{completedCount}/{totalCount}</span>
                <div className="bg-gray-200 rounded-full h-1 w-16"><div className="bg-orange-500 h-1 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}></div></div>
              </div>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setIsStatusMenuOpen(!isStatusMenuOpen);}} onBlur={() => setIsStatusMenuOpen(false)} className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${statusStyle.bg} flex-shrink-0`}>
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

          <button onClick={(e) => { e.stopPropagation(); setAddingSessionTo(thread.id); }} className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Log
          </button>
        </div>
      </div>

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

      {isThreadExpanded && (
        <>
          <div className="p-4">
            <button onClick={() => taskItemProps.setAddingChildTo(`${thread.id}-root`)} className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-xs font-medium mb-3 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>

            {taskItemProps.addingChildTo === `${thread.id}-root` && (
              <div className="mb-3 flex gap-2">
                <input type="text" value={taskItemProps.newChildText} onChange={(e) => taskItemProps.setNewChildText(e.target.value)} placeholder="New task..." className="flex-1 px-3 py-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white" autoFocus onKeyPress={(e) => e.key === "Enter" && handleAddTask()} />
                <button onClick={handleAddTask} className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors font-medium">Add</button>
              </div>
            )}

            {thread.tasks.length > 0 ? (
              <div className="space-y-0.5">{thread.tasks.map((task) => <TaskItem key={`${thread.id}-${task.id}`} {...taskItemProps} task={task} threadId={thread.id} />)}</div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-400"><p>No tasks. Add one to begin.</p></div>
            )}
          </div>
        </>
      )}
    </div>
  );
};