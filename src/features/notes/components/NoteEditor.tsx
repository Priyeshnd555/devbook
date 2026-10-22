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

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(initialContent);

  // Synchronize when initialContent updates externally
  useEffect(() => {
    setEditedNoteText(initialContent);
    lastSavedRef.current = initialContent;
  }, [initialContent]);

  // Clean up any pending auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced auto-save callback to prevent multiple re-renders while typing
  const handleUpdate = useCallback(
    (newText: string) => {
      setEditedNoteText(newText);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (newText !== lastSavedRef.current) {
          lastSavedRef.current = newText;
          saveNote(threadId, taskId, newText);
        }
      }, 500);
    },
    [saveNote, threadId, taskId]
  );

  // Immediate save on blur and finish editing mode
  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (editedNoteText !== lastSavedRef.current) {
      lastSavedRef.current = editedNoteText;
      saveNote(threadId, taskId, editedNoteText);
    }

    setEditingNote(null);
  }, [editedNoteText, saveNote, threadId, taskId, setEditingNote]);

  return (
    <div
      className={`mt-1.5 px-3 py-2 border rounded-lg transition-all min-h-[46px] w-full ${
        !isEditing
          ? "border-border/60 bg-background/50 hover:bg-background hover:border-border cursor-text"
          : "border-primary/40 bg-surface shadow-xs ring-1 ring-primary/20"
      }`}
      onClick={() => {
        if (!isEditing) {
          setEditingNote(taskId);
        }
      }}
    >
      <RichTextEditor
        content={editedNoteText}
        editable={isEditing}
        onUpdate={handleUpdate}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default NoteEditor;
