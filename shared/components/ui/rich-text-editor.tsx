"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon, 
  Image as ImageIcon,
  CheckSquare
} from 'lucide-react'
import { Button } from './button'
import { Separator } from './separator'
import { cn } from '@/shared/lib/utils'
import { Toggle } from '@/components/ui/toggle'
import { useCallback } from 'react'

interface RichTextEditorProps {
  content?: string | object
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  showToolbar?: boolean
  minimal?: boolean
  userRole?: 'admin' | 'team_member' | 'client'
}

const MenuBar = ({ editor, minimal = false, userRole = 'client' }: { editor: any; minimal?: boolean; userRole?: 'admin' | 'team_member' | 'client' }) => {
  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  const basicButtons = (
    <>
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
    </>
  )

  // Role-based feature permissions
  const canUseHeadings = userRole === 'admin' || userRole === 'team_member'
  const canUseAdvancedFormatting = userRole === 'admin' || userRole === 'team_member'
  const canUseMedia = userRole === 'admin' || userRole === 'team_member'
  const canUseTaskLists = userRole === 'admin' || userRole === 'team_member'

  const advancedButtons = (
    <>
      <Separator orientation="vertical" className="h-6" />
      {canUseHeadings && (
        <>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      {canUseTaskLists && (
        <Toggle
          size="sm"
          pressed={editor.isActive('taskList')}
          onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-4 w-4" />
        </Toggle>
      )}
      {canUseAdvancedFormatting && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Toggle>
        </>
      )}
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="sm"
        onClick={setLink}
        className={editor.isActive('link') ? 'bg-muted' : ''}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      {canUseMedia && (
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      )}
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-fit">
        {basicButtons}
      </div>
      {!minimal && (
        <div className="flex items-center gap-1 min-w-fit">
          {advancedButtons}
        </div>
      )}
    </div>
  )
}

export function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Start typing...', 
  editable = true,
  className,
  showToolbar = true,
  minimal = false,
  userRole = 'client'
}: RichTextEditorProps) {
  // Process content - handle both string and object
  const processedContent = typeof content === 'object' && content !== null ? content : content

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // Disable StarterKit's link to avoid duplicate
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: processedContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none focus:outline-none',
          'prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-p:leading-6 sm:prose-p:leading-7 prose-p:my-2 sm:prose-p:my-3',
          'prose-ul:my-2 sm:prose-ul:my-3 prose-ol:my-2 sm:prose-ol:my-3 prose-li:my-1',
          'prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4',
          'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs sm:prose-code:text-sm',
          'prose-pre:bg-muted prose-pre:p-2 sm:prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs sm:prose-pre:text-sm',
          'prose-img:rounded-lg prose-img:shadow-sm prose-img:max-w-full',
          'dark:prose-invert',
          'min-h-[100px] sm:min-h-[120px]',
          className
        ),
      },
    },
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && processedContent !== undefined) {
      const currentContent = editor.getJSON()
      const newContent = processedContent
      
      // Only update if content is different to avoid unnecessary re-renders
      if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent)
      }
    }
  }, [editor, processedContent])

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-background">
      {showToolbar && editable && <MenuBar editor={editor} minimal={minimal} userRole={userRole} />}
      <div className={cn(
        "min-h-[120px] sm:min-h-[150px] p-3 sm:p-4",
        !editable && "bg-muted/20"
      )}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}