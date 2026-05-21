import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommentsList } from '@/components/comments/CommentsList'

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
  isDropPinMode
}: Props) {
  const { t } = useTranslation()
  const isLocked = file.isCommentsLocked || project?.isCommentsLocked || isArchived

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
    </div>
  )
}
