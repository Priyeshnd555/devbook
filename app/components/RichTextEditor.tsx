/**
 * =================================================================================================
 * CONTEXT ANCHOR: RichTextEditor Component (RichTextEditor.tsx)
 * =================================================================================================
 *
 * @purpose
 * Provides a customizable rich text editor using Tiptap for creating and editing notes with
 * formatting options like bold, italic, and lists.
 *
 * @dependencies
 * - @tiptap/react: Core Tiptap editor functionality and React integration.
 * - @tiptap/starter-kit: A collection of common Tiptap extensions (bold, italic, lists).
 * - lucide-react: For icons used in the toolbar.
 * - react: For `useEffect` hook.
 *
 * @invariants
 * 1. CONTROLLED COMPONENT: The editor's content is fully controlled by the `content` prop and
 *    updates are communicated via the `onUpdate` callback.
 * 2. SSR COMPATIBILITY: Configured with `immediatelyRender: false` to prevent hydration mismatches
 *    during server-side rendering.
 *
 * @state_management
 * - Internal Tiptap editor state managed by `useEditor` hook.
 * - Synchronizes internal editor state with the external `content` prop via a `useEffect` hook.
 *
 * @ai_note
 * - The `MenuBar` component renders buttons to control text formatting. Styles for active buttons
 *   are applied using Tailwind CSS classes directly in the `className` prop.
 * - The `useEditor` hook is configured with `immediatelyRender: false` to ensure proper
 *   hydration in Next.js applications, avoiding potential SSR issues.
 * - A `useEffect` hook is used to update the Tiptap editor's content when the `content` prop
 *   from the parent component changes, ensuring the editor remains synchronized with external state.
 * =================================================================================================
 */
"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  content: string;
  editable?: boolean;
  onUpdate: (html: string) => void;
  onBlur?: () => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 p-1 bg-surface/50 border-b border-primary/5 rounded-t">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1 rounded transition-colors ${editor.isActive("bold") ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-primary/10 hover:text-primary"}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1 rounded transition-colors ${editor.isActive("italic") ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-primary/10 hover:text-primary"}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded transition-colors ${editor.isActive("bulletList") ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-primary/10 hover:text-primary"}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded transition-colors ${editor.isActive("orderedList") ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-primary/10 hover:text-primary"}`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, editable = true, onUpdate, onBlur }) => {
  const clickPosRef = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onBlur: () => {
       if (onBlur) onBlur();
    },
    immediatelyRender: false, // Added to prevent hydration mismatches during SSR
    editorProps: {
      attributes: {
        class:
          "w-full px-0 py-0 text-sm resize-none focus:outline-none bg-transparent text-text-primary leading-6 min-h-[auto] prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1 [&_li]:my-0 [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary-hover",
      },
    },
  });

  // This effect updates the editor content when the prop changes.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state dynamically
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
      
      // Restore cursor position if entering edit mode from a click
      if (editable) {
        if (clickPosRef.current !== null) {
           // We use setTextAreaSelection/focus to place the cursor exactly
           editor.commands.setTextSelection(clickPosRef.current);
           editor.commands.focus();
           clickPosRef.current = null;
        } else {
           // Fallback to end if no specific position tracked
           editor.commands.focus('end');
        }
      }
    }
  }, [editable, editor]);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only capture position if currently read-only (preparing to switch to edit)
    if (!editable && editor) {
      // Tiptap's posAtCoords returns { pos, inside }
      // We map the mouse coordinates to the document position
      const posInfo = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (posInfo) {
        clickPosRef.current = posInfo.pos;
      }
    }
  };

  return (
    <div onClick={handleContainerClick}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
