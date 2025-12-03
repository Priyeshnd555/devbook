import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  MessageSquare,
  StickyNote,
  Pencil,
} from "lucide-react";
import { Task } from "../page"; // Assuming Task type is exported from page.tsx

// CONTEXT ANCHOR
// PURPOSE: Renders a single task item and recursively renders its children. This component handles displaying task status, notes, and actions like adding a sub-task.
// DEPENDENCIES: React hooks, Lucide icons, Task type from parent.
// INVARIANTS: It must be provided a valid 'task' and 'threadId'.
export interface TaskItemProps {
  task: Task;
  threadId: string;
  level?: number;
  expandedTasks: Set<string>;
  editingNote: string | null;
  addingChildTo: string | null;
  editingTaskId: string | null;
  editedTaskText: string;
  toggleTask: (taskId: string) => void;
  toggleTaskDone: (threadId: string, taskId: string) => void;
  setEditingNote: (id: string | null) => void;
  saveNote: (threadId: string, taskId: string, text: string) => void;
  setAddingChildTo: (id: string | null) => void;
  newChildText: string;
  setNewChildText: (text: string) => void;
  addChild: (threadId: string, parentId: string) => void;
  setEditingTaskId: (id: string | null) => void;
  setEditedTaskText: (text: string) => void;
  updateTaskText: (threadId: string, taskId: string, text: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  threadId,
  level = 0,
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
}) => {
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
            <button onClick={() => { setAddingChildTo(task.id); setNewChildText(''); }} className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Add subtask">
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
            <TaskItem key={`${threadId}-${child.id}`} {...{...{
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
            }, task: child, threadId, level: level + 1 }} />
          ))}
        </div>
      )}
    </div>
  );
};