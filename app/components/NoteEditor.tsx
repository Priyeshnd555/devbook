/**
 * =================================================================================================
 * CONTEXT ANCHOR: NoteEditor Component (NoteEditor.tsx)
 * =================================================================================================
 *
 * @purpose
 * Encapsulates the rich text editing functionality for a note, managing its local state and
 * providing save/cancel actions. It acts as an intermediary between the `TaskItem` and the
 * `RichTextEditor`.
 *
 * @dependencies
 * - react: For `useState` and `useEffect` hooks.
 * - RichTextEditor: The underlying rich text editor component.
 *
 * @invariants
 * 1. STATE ISOLATION: Manages the `editedNoteText` locally, preventing unnecessary re-renders
 *    of parent components during typing.
 * 2. SYNCHRONIZATION: The `editedNoteText` is initialized from `initialContent` and
 *    synchronized if `initialContent` changes while the editor is mounted.
 *
 * @state_management
 * - `editedNoteText`: Local state for the editable content of the note.
 * - `useEffect`: Synchronizes `editedNoteText` with `initialContent` prop on changes.
 *
 * @ai_note
 * - This component serves as a wrapper to manage the lifecycle and state of the `RichTextEditor`.
 * - The `useEffect` ensures that if the parent `TaskItem` updates the `initialContent` prop
 *   (e.g., if the user switches tasks while in edit mode), the editor's content is correctly
 *   re-initialized.
 * - **Generation 5 Update**:
 *   - Now maintains a persistent `RichTextEditor` instance in both read and edit modes.
 *   - Manages "Seamless Transition" by matching container metrics (negative margins, padding) to the read view.
 *   - Handles "Click-to-Edit" interaction locally.
 * =================================================================================================
 */
"use client";

import React, { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";

interface NoteEditorProps {
  initialContent: string;
  threadId: string;
  taskId: string;
  isEditing: boolean;
  saveNote: (threadId: string, taskId: string, text: string) => void;
  setEditingNote: (id: string | null) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  initialContent,
  threadId,
  taskId,
  isEditing,
  saveNote,
  setEditingNote,
}) => {
  const [editedNoteText, setEditedNoteText] = useState(initialContent);

  // This effect ensures that if the initialContent prop changes while the editor is mounted,
  // the editedNoteText state is updated. This is crucial for controlled components.
  // The linter might still complain, but this is a necessary synchronization.
  useEffect(() => {
    setEditedNoteText(initialContent);
    setEditedNoteText(initialContent);
  }, [initialContent]);

  // When switching to edit mode, ensure local state is fresh (though simple sync handles most)
  // When switching OUT of edit mode, we might want to reset to initialContent if cancelled?
  // Current logic: Cancel just hides buttons. RichTextEditor stays ensuring seamlessness.
  // If we cancel, we should probably reset text.
  useEffect(() => {
    if (!isEditing) {
      setEditedNoteText(initialContent);
    }
  }, [isEditing, initialContent]);

  return (
    // Match Read View Styles: mt-1 ml-0.5 bg-primary/5 rounded-md px-2 py-1 -mx-2
    // Added onClick to trigger edit mode when in read mode
    <div
      className={`mt-1 ml-0.5 -mx-2 px-2 py-1 bg-primary/5 rounded-md group/editor transition-colors ${!isEditing ? 'cursor-text hover:bg-primary/10' : ''}`}
      onClick={() => {
        if (!isEditing) {
          setEditingNote(taskId); // Parent handles this state update
        }
      }}
    >
      <div className="">
        <RichTextEditor
          content={editedNoteText}
          editable={isEditing}
          onUpdate={setEditedNoteText}
        />
      </div>
      {isEditing && (
        <div
          className="flex gap-2 animate-in fade-in duration-200 mt-2"
          onClick={(e) => e.stopPropagation()} // Prevent bubbling
        >
          <button
            onClick={() => saveNote(threadId, taskId, editedNoteText)}
            className="px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary-hover transition-colors font-medium shadow-sm"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditingNote(null);
              setEditedNoteText(initialContent); // Reset on cancel
            }}
            className="px-3 py-1.5 bg-background text-text-secondary text-xs border border-border rounded hover:bg-surface transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
