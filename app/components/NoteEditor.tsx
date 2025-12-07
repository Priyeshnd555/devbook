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
 * =================================================================================================
 */
"use client";

import React, { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";

interface NoteEditorProps {
  initialContent: string;
  threadId: string;
  taskId: string;
  saveNote: (threadId: string, taskId: string, text: string) => void;
  setEditingNote: (id: string | null) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  initialContent,
  threadId,
  taskId,
  saveNote,
  setEditingNote,
}) => {
  const [editedNoteText, setEditedNoteText] = useState(initialContent);

  // This effect ensures that if the initialContent prop changes while the editor is mounted,
  // the editedNoteText state is updated. This is crucial for controlled components.
  // The linter might still complain, but this is a necessary synchronization.
  useEffect(() => {
    setEditedNoteText(initialContent);
  }, [initialContent]);


  return (
    <div className="mt-3 space-y-2">
      <RichTextEditor content={editedNoteText} onUpdate={setEditedNoteText} />
      <div className="flex gap-2">
        <button
          onClick={() => saveNote(threadId, taskId, editedNoteText)}
          className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors font-medium"
        >
          Save
        </button>
        <button
          onClick={() => setEditingNote(null)}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NoteEditor;
