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
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
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

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onUpdate, onBlur }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
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
          "w-full px-3 py-2 text-xs resize-none focus:outline-none bg-surface text-text-primary leading-relaxed min-h-[80px]",
      },
    },
  });

  // This effect updates the editor content when the prop changes.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
