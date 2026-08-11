import { Layers, Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CommentsList } from '@/components/comments/CommentsList'
import toast from 'react-hot-toast'

import { useTranslation } from 'react-i18next'

interface Props {
  isFullscreen?: boolean
  file: any
  project: any
  isArchived: boolean
  isAdmin: boolean
  
  viewAllVersions: boolean
  setViewAllVersions: (val: boolean) => void
  showOnlyCurrentTimeComments: boolean
  
  fileComments: any[]
  currentUserName: string

  onResolveToggle?: (commentId: string, isResolved?: boolean) => void
  handleTimestampClick: (timestamp: number) => void
  handleViewAnnotation: (dataStr: string, comment?: any) => void
  onAddComment?: (userName: string, content: string, timestamp?: number, parentCommentId?: string, annotationDataToSave?: string | null, attachments?: any[]) => Promise<void>
  onEditComment?: (commentId: string, content: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  
  // Sidebar Resize
  commentWidth?: number

  setIsDropPinMode?: (val: boolean) => void
  isDropPinMode?: boolean

  // Current frame/time for inline comment
  currentTimestamp?: number
}

export function DesktopCommentsSidebar({
  isFullscreen = false,
  file,
  project,
  isArchived,
  isAdmin,
  viewAllVersions,
  setViewAllVersions,
  showOnlyCurrentTimeComments,
  fileComments,
  currentUserName,
  onResolveToggle,
  handleTimestampClick,
  handleViewAnnotation,
  onAddComment,
  onEditComment,
  onDeleteComment,
  commentWidth = 320,
  setIsDropPinMode,
  isDropPinMode,
  currentTimestamp
}: Props) {
  const { t } = useTranslation()
  const isLocked = file.isCommentsLocked || project?.isCommentsLocked || isArchived
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = commentText.trim()
    if (!content || submitting || !onAddComment) return
    if (content.length < 5) {
      toast.error('Bình luận phải có ít nhất 5 ký tự')
      return
    }
    setSubmitting(true)
    try {
      await onAddComment((currentUserName && currentUserName.trim()) || 'Khách', content, currentTimestamp)
      setCommentText('')
    } catch {
      // Error handled by store toast
    } finally {
      setSubmitting(false)
    }
  }

  if (isFullscreen) {
    return (
      <div className="fixed top-0 right-0 left-[75vw] w-[25vw] h-screen flex flex-col bg-background border-l border-border z-50 group">
        <div className="p-3 border-b flex items-center justify-between bg-muted/10">
          <div className="text-sm font-medium">{t('fileView:comments.title')}</div>
          <Button
            variant={viewAllVersions ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewAllVersions(!viewAllVersions)}
            className={`h-7 px-2 text-xs gap-1.5 ${viewAllVersions ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('fileView:comments.allVersions')}</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <CommentsList
            comments={fileComments}
            currentUserName={currentUserName}
            onResolveToggle={onResolveToggle}
            onTimestampClick={handleTimestampClick}
            onViewAnnotation={(data: string, comment: any) => handleViewAnnotation(data, comment)}
            onReply={async (parentCommentId: string, userName: string, content: string) => {
              await onAddComment?.(userName, content, undefined, parentCommentId, null, undefined)
            }}
            isSequence={file.type === 'sequence'}
            isAdmin={isAdmin}
            onEdit={async (id, content) => await onEditComment?.(id, content)}
            onDelete={async (id) => await onDeleteComment?.(id)}
            isLocked={isLocked}
            showVersionBadge={viewAllVersions}
          />
          {fileComments.length === 0 && (
            <div className="text-center text-muted-foreground py-8 whitespace-pre-line px-4 leading-relaxed">
              {t('fileView:comments.empty')}
              {showOnlyCurrentTimeComments && <div className="text-xs mt-2">{t('fileView:comments.filteringByTime')}</div>}
            </div>
          )}
          
          {fileComments.length > 0 && !isDropPinMode && setIsDropPinMode && (
            <div className="sticky bottom-0 mt-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none pb-4 bg-gradient-to-t from-background via-background/80 to-transparent pt-8 z-10">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-dashed border-2 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground shadow-md gap-2 pointer-events-auto rounded-full px-6 backdrop-blur-sm"
                onClick={() => setIsDropPinMode(true)}
              >
                {t('fileView:toolbar.commentNow')}
              </Button>
            </div>
          )}
        </div>

        {/* Comment Input — fullscreen */}
        {onAddComment && !isLocked && (
          <form onSubmit={handleSubmitComment} className="p-3 border-t border-border bg-card/80 shrink-0">
            <div className="relative flex flex-col gap-2 rounded-xl border-2 border-primary/30 bg-background p-2.5 focus-within:border-primary transition-all">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment(e)
                  }
                }}
                placeholder={currentTimestamp !== undefined ? `Thêm bình luận cho Clip #${currentTimestamp + 1}...` : 'Nhập bình luận...'}
                className="min-h-[70px] h-20 text-xs bg-transparent border-0 focus-visible:ring-0 resize-none p-0 shadow-none"
                disabled={submitting}
              />
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || submitting}
                  className="h-7 px-3 text-xs font-semibold gap-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <span>Gửi</span>
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div
      id="comments-sidebar"
      className="w-full sm:w-[var(--comment-width)] flex-shrink-0 flex flex-col bg-background border-t sm:border-t-0 sm:border-l h-[38vh] sm:h-auto sm:max-h-none transition-[width] duration-0 group relative"
      ref={(el) => {
        if (!el) return
        el.style.setProperty('--comment-width', `${commentWidth}px`)
      }}
    >
      <div className="p-3 border-b flex items-center justify-between bg-muted/10">
        <div className="text-sm font-medium">{t('fileView:comments.title')}</div>
        <Button
          id="comments-version-toggle"
          variant="outline"
          size="sm"
          onClick={() => setViewAllVersions(!viewAllVersions)}
          className={`h-7 px-2 text-xs gap-1.5 transition-all ${viewAllVersions
            ? 'bg-primary/10 text-primary border-primary/50 hover:bg-primary/20'
            : 'text-muted-foreground hover:text-foreground border-dashed hover:border-solid'
            }`}
          title={viewAllVersions ? t('fileView:comments.allVersions') : t('fileView:comments.currentVersionOnly')}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{viewAllVersions ? t('fileView:comments.allVersions') : t('fileView:comments.currentVersionOnly')}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        <CommentsList
          comments={fileComments}
          currentUserName={currentUserName}
          onResolveToggle={onResolveToggle}
          onTimestampClick={handleTimestampClick}
          onViewAnnotation={(data: string, comment: any) => handleViewAnnotation(data, comment)}
          onReply={async (parentCommentId: string, userName: string, content: string) => {
            await onAddComment?.(userName, content, undefined, parentCommentId, null, undefined)
          }}
          isSequence={file.type === 'sequence'}
          isAdmin={isAdmin}
          onEdit={async (id, content) => await onEditComment?.(id, content)}
          onDelete={async (id) => await onDeleteComment?.(id)}
          isLocked={isLocked}
          showVersionBadge={viewAllVersions}
        />
        {fileComments.length === 0 && (
          <div className="text-center text-muted-foreground py-8 whitespace-pre-line px-4 leading-relaxed flex flex-col items-center">
            <div className="text-4xl mb-4 opacity-50">💬</div>
            <div>{t('fileView:comments.empty')}</div>
            {showOnlyCurrentTimeComments && <div className="text-xs mt-2">{t('fileView:comments.filteringByTime')}</div>}
            {viewAllVersions && <div className="text-xs mt-2">{t('fileView:comments.allVersionsEnabled')}</div>}
            
            {setIsDropPinMode && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-6 border-dashed border-2 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground gap-2 w-full max-w-[200px]"
                onClick={() => setIsDropPinMode(true)}
              >
                {t('fileView:toolbar.commentNow')}
              </Button>
            )}
          </div>
        )}
        
        {fileComments.length > 0 && !isDropPinMode && setIsDropPinMode && (
            <div className="sticky bottom-0 mt-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none pb-4 bg-gradient-to-t from-background via-background/80 to-transparent pt-8 z-10">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-dashed border-2 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground shadow-md gap-2 pointer-events-auto rounded-full px-6 backdrop-blur-sm"
              onClick={() => setIsDropPinMode(true)}
            >
              {t('fileView:toolbar.commentNow')}
            </Button>
          </div>
        )}
      </div>

      {/* Comment Input — prominent & twice as tall fixed at bottom */}
      {onAddComment && !isLocked && (
        <form onSubmit={handleSubmitComment} className="p-3 border-t border-border bg-card/80 shrink-0">
          <div className="relative flex flex-col gap-2 rounded-xl border-2 border-primary/30 bg-background p-2.5 focus-within:border-primary transition-all">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment(e)
                }
              }}
              placeholder={currentTimestamp !== undefined ? `Thêm bình luận cho Clip #${currentTimestamp + 1}...` : 'Nhập bình luận...'}
              className="min-h-[70px] h-20 text-xs bg-transparent border-0 focus-visible:ring-0 resize-none p-0 shadow-none"
              disabled={submitting}
            />
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || submitting}
                className="h-7 px-3 text-xs font-semibold gap-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>Gửi</span>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
