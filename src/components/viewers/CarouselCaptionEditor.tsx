import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2 } from 'lucide-react'
import { linkifyText } from '@/lib/linkify'

interface CarouselCaptionEditorProps {
  /** Current frame index */
  frameIndex: number
  /** Caption text from parent (may lag behind local edits until Firestore syncs) */
  caption?: string
  /** Whether the current user is an admin (can edit captions) */
  isAdmin: boolean
  /** Callback when caption is saved */
  onCaptionChange?: (caption: string) => void
}

/**
 * Caption display/editor for carousel view mode.
 * - Read-only for non-admin users (shows caption text if available)
 * - Inline editable for admins (click to edit, Enter to save, Esc to cancel)
 */
export function CarouselCaptionEditor({
  frameIndex,
  caption,
  isAdmin,
  onCaptionChange,
}: CarouselCaptionEditorProps) {
  const { t } = useTranslation(['fileView', 'common'])
  const [isEditing, setIsEditing] = useState(false)
  const [editedCaption, setEditedCaption] = useState(caption || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync local state when caption prop changes (e.g. Firestore update or frame switch)
  useEffect(() => {
    setEditedCaption(caption || '')
  }, [caption, frameIndex])

  // Reset editing state when switching frames
  useEffect(() => {
    setIsEditing(false)
  }, [frameIndex])

  // Auto-focus & auto-size textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  const handleSave = () => {
    if (editedCaption !== caption) {
      onCaptionChange?.(editedCaption)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedCaption(caption || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayCaption = caption || editedCaption
  const hasContent = !!(caption || editedCaption || isEditing)

  // Nothing to show for non-admin users without caption
  if (!hasContent && !isAdmin) return null

  return (
    <div className="flex-shrink-0 mt-1 mb-1">
      <div className="rounded-lg border bg-muted/30 overflow-hidden">
        {isEditing ? (
          /* Editing Mode */
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={editedCaption}
              onChange={(e) => {
                setEditedCaption(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              placeholder={t('fileView:toolbar.addCaption') + '...'}
              className="w-full text-sm p-2 bg-muted/50 text-foreground placeholder:text-muted-foreground/50 border border-transparent rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
              rows={2}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1.5 px-1">
              <span className="text-[10px] text-muted-foreground">
                {t('fileView:toolbar.enterToSave')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {editedCaption.length}/500
              </span>
            </div>
          </div>
        ) : displayCaption ? (
          /* Read-only Mode — has caption */
          <div
            className="relative group/caption p-3 cursor-default"
            onClick={() => isAdmin && setIsEditing(true)}
            style={isAdmin ? { cursor: 'text' } : undefined}
          >
            <div className="text-sm text-foreground/90 break-words whitespace-pre-wrap leading-relaxed">
              {linkifyText(displayCaption)}
            </div>
            {isAdmin && (
              <div className="absolute top-2 right-2 opacity-0 group-hover/caption:opacity-100 transition-opacity">
                <div className="bg-muted/80 backdrop-blur-sm p-1 rounded">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
              </div>
            )}
          </div>
        ) : isAdmin ? (
          /* Empty State — admin can add */
          <button
            onClick={() => setIsEditing(true)}
            className="w-full p-3 flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 transition-colors text-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="italic">{t('fileView:toolbar.addCaption')}...</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
