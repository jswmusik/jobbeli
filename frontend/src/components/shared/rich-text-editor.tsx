"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 border-b p-2 bg-muted/30">
      {/* Headings */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("heading", { level: 1 }) && "bg-muted"
        )}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("heading", { level: 2 }) && "bg-muted"
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("heading", { level: 3 }) && "bg-muted"
        )}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1 self-center" />

      {/* Text formatting */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("bold") && "bg-muted"
        )}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("italic") && "bg-muted"
        )}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1 self-center" />

      {/* Lists */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("bulletList") && "bg-muted"
        )}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("orderedList") && "bg-muted"
        )}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1 self-center" />

      {/* Link */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("link") && "bg-muted"
        )}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false, // Prevent SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[120px] p-3 focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
          "[&_p]:my-1 [&_li]:my-0.5",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2",
          "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1"
        ),
      },
    },
  });

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background overflow-hidden",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
