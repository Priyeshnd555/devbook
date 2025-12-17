/**
 * =================================================================================================
 * CONTEXT ANCHOR: TaskItem Component (TaskItem.tsx)
 * =================================================================================================
 *
 * @purpose
 * Renders a single, potentially nested, task item. This is a recursive component that serves as
 * the primary building block for the task list. It handles displaying task status, text, and
 * notes, as well as user interactions for editing, completion, and adding sub-tasks.
 *
 * @dependencies
 * - REACT: `useState`, `useMemo` for internal UI state management.
 * - LUCIDE-REACT: For all iconography (checkboxes, chevrons, etc.).
 * - NoteEditor: Component for rich text note editing.
 * - TYPES: `Task` from the main page (`../types`).
 *
 * @invariants
 * 1. RECURSIVE STRUCTURE: The component renders itself for each of its `task.children`, passing
 *    an incremented `level` prop to maintain visual indentation and hierarchy.
 * 2. FULLY CONTROLLED: This component is a "dumb" or "presentational" component. It holds no
 *    business logic and receives its entire state and all state-modification handlers via props
 *    from the `useWorkflowManager` hook (passed through `ThreadCard`).
 *
 * @state_management
 * - `isNoteExpanded`: Local state to control the expanded/collapsed state of the note accordion.
 * - `noteLineCount`: Memoized value for the number of lines in the note, used for accordion logic.
 * - `visibleChildren`: Memoized value that filters sub-tasks based on the `showCompleted` prop.
 *
 * @ai_note
 * - The note display now supports rich text rendering using `dangerouslySetInnerHTML`.
 * - Notes longer than 3 lines are collapsed by default, with a "Show more"/"Show less" toggle.
 * - Clicking the displayed note (excluding the "Show more/less" button) now correctly activates
 *   the note editing mode.
 * - Note editing is handled by the `NoteEditor` component, centralizing its state management.
 * - The filtering logic for `visibleChildren` based on the `showCompleted` prop ensures that
 *   the visibility of completed tasks is consistent throughout the task hierarchy.
 * - **Generation 5 Update**: Notes now support "Notion-like" interactions:
 *   - Seamless styling (text-sm, leading-6).
 *   - Auto-save on blur removed (explicit Save/Cancel restored).
 *   - List and URL formatting explicitly handled via CSS injections in `prose`.
 * =================================================================================================
 */
import NoteEditor from "./NoteEditor";
import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  MessageSquare,
  StickyNote,
  Star,
} from "lucide-react";
import { Task } from "../types";
import { isTaskFullyCompleted } from "../utils/taskUtils";

export interface TaskItemProps {
  task: Task;
  threadId: string;
  level?: number;
  expandedTasks: Set<string>;
  editingNote: string | null;
  addingChildTo: string | null;
  editingTaskId: string | null;
  editedTaskText: string;
  showCompleted: boolean;
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
  setTaskPriority: (threadId: string, taskId: string, priority: number) => void;
}

export const TaskItem: React.FC<TaskItemProps> = (props) => {
    const {
        task,
        threadId,
        level = 0,
        showCompleted,
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
        setTaskPriority,
      } = props;
  const isExpanded = expandedTasks.has(task.id);
  const hasChildren = task.children.length > 0;
  const isEditing = editingNote === task.id;
  const isAddingChild = addingChildTo === task.id;
  const isEditingTask = editingTaskId === task.id;
  const [isNoteExpanded, setIsNoteExpanded] = useState(true);

  const noteLineCount = useMemo(() => {
    if (!task.note) return 0;
    // Simple line counting based on list items, which is a good proxy for lines in this rich text context.
    const matches = task.note.match(/<li>/g);
    return matches ? matches.length : 1;
  }, [task.note]);

  const handleSaveTaskText = () => {
    if (editedTaskText.trim()) {
      updateTaskText(threadId, task.id, editedTaskText);
    } else {
      setEditingTaskId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleCyclePriority = () => {
    const newPriority = ((task.priority || 0) + 1) % 4;
    setTaskPriority(threadId, task.id, newPriority);
  };

  const priorityStyles: Record<number, string> = {
    0: "text-text-secondary/60",
    1: "text-blue-400",
    2: "text-yellow-400",
    3: "text-red-500",
  };

  // STRATEGY: Recursively filter sub-tasks based on the `showCompleted` prop, ensuring that
  // the visibility of completed tasks is consistent throughout the task hierarchy.
  const visibleChildren = useMemo(() => {
    const sortedChildren = [...task.children].sort((a, b) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        const aDone = isTaskFullyCompleted(a);
        const bDone = isTaskFullyCompleted(b);
        if (aDone !== bDone) {
          return aDone ? 1 : -1;
        }
        return 0;
      });

    if (showCompleted) {
      return sortedChildren;
    }
    return sortedChildren.filter(child => !isTaskFullyCompleted(child));
  }, [task.children, showCompleted]);

  return (
    <div className={`${level > 0 ? "ml-7 border-l border-primary/20 pl-4 py-0.5" : ""}`} key={`${threadId}-${task.id}`}>
      <div className="mb-1">
        <div className="flex items-start gap-3 group hover:bg-primary-light/30 px-3 py-2 rounded transition-colors">
          {hasChildren ? (
            <button onClick={() => toggleTask(task.id)} className="mt-0.5 text-text-secondary hover:text-primary transition-colors flex-shrink-0">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-4 flex-shrink-0"></div>
          )}

          <button onClick={() => toggleTaskDone(threadId, task.id)} className="mt-0.5 flex-shrink-0 transition-colors">
            {task.done ? <CheckCircle2 className="w-5 h-5 text-primary/70" /> : <Circle className="w-5 h-5 text-text-secondary/40 hover:text-primary/50" />}
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
                className="w-full px-2 py-1 border border-primary/30 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text-primary"
                autoFocus
              />
            ) : (
              <span
                className={`text-sm leading-relaxed ${task.done ? "line-through text-text-secondary/80" : "text-text-primary"} cursor-text`}
                onClick={() => {
                  setEditingTaskId(task.id);
                  setEditedTaskText(task.text);
                }}
              >
                {task.text}
              </span>
            )}

            {task.note && !isEditing && !isEditingTask && (
              <div
                className="mt-1 ml-0.5 group/note bg-primary/5 rounded-md px-2 py-1 -mx-2"
                onClick={() => setEditingNote(task.id)}
              >
                <div className="flex items-start gap-2 cursor-text transition-colors">
                  {/* Icon stays subtle to not compete with text */}
                  <StickyNote className="w-3.5 h-3.5 mt-1 flex-shrink-0 text-text-secondary/70 group-hover/note:text-primary transition-colors" />
                  <div
                    className={`prose prose-sm max-w-none 
                      text-sm leading-6 text-text-primary break-words
                      [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 
                      [&_p]:my-1 [&_li]:my-0
                      [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary-hover
                      ${!isNoteExpanded && noteLineCount > 6 ? 'max-h-32 overflow-hidden mask-fade-bottom' : ''}`}
                    dangerouslySetInnerHTML={{ __html: task.note }}
                  />
                </div>
                {/* Show more button appears if helpful */}
                {noteLineCount > 6 && (
                  <button
                    className="text-xs font-medium text-text-secondary hover:text-primary mt-1 ml-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNoteExpanded(!isNoteExpanded);
                    }}
                  >
                    {isNoteExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}

            {isEditing && (
              <NoteEditor
                initialContent={task.note}
                threadId={threadId}
                taskId={task.id}
                saveNote={saveNote}
                setEditingNote={setEditingNote}
              />
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={handleCyclePriority} className={`p-1.5 rounded transition-colors ${priorityStyles[task.priority || 0]} hover:bg-primary-light`} title="Set priority">
              <Star className="w-3.5 h-3.5" fill={task.priority > 0 ? 'currentColor' : 'none'}/>
            </button>
            {!task.note && !isEditing && (
              <button onClick={() => setEditingNote(task.id)} className="p-1.5 text-text-secondary/60 hover:text-primary hover:bg-primary-light rounded transition-colors" title="Add note">
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => { setAddingChildTo(task.id); setNewChildText(''); }} className="p-1.5 text-text-secondary/60 hover:text-primary hover:bg-primary-light rounded transition-colors" title="Add subtask">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isAddingChild && (
          <div className="ml-10 mt-1 mb-2 flex items-center gap-2 animate-in fade-in duration-200">
             <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
            <input
              type="text"
              value={newChildText}
              onChange={(e) => setNewChildText(e.target.value)}
              placeholder="New subtask..."
              className="flex-1 py-1 bg-transparent text-sm border-b border-primary/20 focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                    addChild(threadId, task.id);
                }
                if (e.key === "Escape") {
                    setAddingChildTo(null);
                    setNewChildText("");
                }
              }}
              onBlur={() => {
                // Only close if empty. If user clicked away but had text, maybe save? 
                // For now, let's just close if empty to mimic Notion behavior (it cleans up empty blocks).
                if (!newChildText.trim()) {
                    setAddingChildTo(null);
                }
              }}
            />
          </div>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {visibleChildren.map((child) => (
            <TaskItem
              key={`${threadId}-${child.id}`}
              task={child}
              threadId={threadId}
              level={level + 1}
              showCompleted={showCompleted}
              expandedTasks={expandedTasks}
              editingNote={editingNote}
              addingChildTo={addingChildTo}
              editingTaskId={editingTaskId}
              editedTaskText={editedTaskText}
              toggleTask={toggleTask}
              toggleTaskDone={toggleTaskDone}
              setEditingNote={setEditingNote}
              saveNote={saveNote}
              setAddingChildTo={setAddingChildTo}
              newChildText={newChildText}
              setNewChildText={setNewChildText}
              addChild={addChild}
              setEditingTaskId={setEditingTaskId}
              setEditedTaskText={setEditedTaskText}
              updateTaskText={updateTaskText}
              setTaskPriority={setTaskPriority}
            />
          ))}
        </div>
      )}
    </div>
  );
};