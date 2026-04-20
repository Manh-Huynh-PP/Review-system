import React from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommentsList } from '@/components/comments/CommentsList'
import { AddComment } from '@/components/comments/AddComment'
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
  onUserNameChange: (name: string) => void
  onResolveToggle?: (commentId: string, isResolved?: boolean) => void
  handleTimestampClick: (timestamp: number) => void
  handleViewAnnotation: (dataStr: string, comment?: any) => void
  onAddComment?: (userName: string, content: string, timestamp?: number, parentCommentId?: string, annotationDataToSave?: string | null, attachments?: any[]) => Promise<void>
  onEditComment?: (commentId: string, content: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  
  // Annotation & Time
  annotationData: any
  isReadOnly: boolean
  getCameraState: () => any
  setAnnotationData: (data: any) => void
  setIsAnnotating: (val: boolean) => void
  currentTime: number
  currentTimeRef: React.MutableRefObject<number>
  currentFrame: number
  handleStartAnnotating: () => void
  
  // Sidebar Resize
  commentWidth?: number
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
  onUserNameChange,
  onResolveToggle,
  handleTimestampClick,
  handleViewAnnotation,
  onAddComment,
  onEditComment,
  onDeleteComment,
  annotationData,
  isReadOnly,
  getCameraState,
  setAnnotationData,
  setIsAnnotating,
  currentTime,
  currentTimeRef,
  currentFrame,
  handleStartAnnotating,
  commentWidth = 350
}: Props) {
  const { t } = useTranslation()
  const isLocked = file.isCommentsLocked || project?.isCommentsLocked || isArchived

  const handleSubmitComment = async (
    userName: string, 
    content: string, 
    timestamp?: number, 
    parentCommentId?: string, 
    _ignoredAnnotationData?: any, 
    attachments?: any[]
  ) => {
    const hasData = annotationData && annotationData.length > 0
    const dataToSave = hasData && !isReadOnly ? JSON.stringify({
      konva: annotationData,
      camera: getCameraState()
    }) : null

    await onAddComment?.(userName, content, timestamp, parentCommentId, dataToSave, attachments)

    if (dataToSave) {
      setAnnotationData(null)
      setIsAnnotating(false)
    }
  }

  if (isFullscreen) {
    return (
      <div className="fixed top-0 right-0 left-[75vw] w-[25vw] h-screen flex flex-col bg-background border-l border-border z-50">
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
            <div className="text-center text-muted-foreground py-8">
              {t('fileView:comments.empty')}
              {showOnlyCurrentTimeComments && <div className="text-xs mt-1">{t('fileView:comments.filteringByTime')}</div>}
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-background">
          {isLocked ? (
            <div className="text-center text-muted-foreground py-4 px-2 bg-muted/30 rounded-md">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span>🔒</span>
                <span>
                  {isArchived
                    ? t('fileView:comments.archivedLocked')
                    : t('fileView:comments.featureLocked')}
                </span>
              </div>
            </div>
          ) : (
            <AddComment
              onSubmit={handleSubmitComment}
              userName={currentUserName}
              onUserNameChange={onUserNameChange}
              currentTimestamp={file.type === 'video' ? currentTime : (file.type === 'sequence' ? currentFrame : undefined)}
              currentTimestampRef={currentTimeRef}
              showTimestamp={file.type === 'video' || file.type === 'sequence'}
              annotationData={!isReadOnly ? annotationData : null}
              onAnnotationClick={handleStartAnnotating}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      id="comments-sidebar"
      className="w-full sm:w-[var(--comment-width)] flex-shrink-0 flex flex-col bg-background border-t sm:border-t-0 sm:border-l h-[38vh] sm:h-auto sm:max-h-none transition-[width] duration-0"
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
          <div className="text-center text-muted-foreground py-8">
            {t('fileView:comments.empty')}
            {showOnlyCurrentTimeComments && <div className="text-xs mt-1">{t('fileView:comments.filteringByTime')}</div>}
            {viewAllVersions && <div className="text-xs mt-1">{t('fileView:comments.allVersionsEnabled')}</div>}
          </div>
        )}
      </div>

      {/* Desktop: Always show comment input */}
      <div className="hidden sm:block p-4 border-t bg-background flex-shrink-0">
        {isLocked ? (
          <div className="text-center text-muted-foreground py-4 px-2 bg-muted/30 rounded-md">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span>🔒</span>
              <span>
                {isArchived
                  ? t('fileView:comments.archivedLocked')
                  : t('fileView:comments.featureLocked')}
              </span>
            </div>
          </div>
        ) : (
          <AddComment
            onSubmit={handleSubmitComment}
            userName={currentUserName}
            onUserNameChange={onUserNameChange}
            currentTimestamp={file.type === 'video' ? currentTime : (file.type === 'sequence' ? currentFrame : undefined)}
            currentTimestampRef={currentTimeRef}
            showTimestamp={file.type === 'video' || file.type === 'sequence'}
            annotationData={!isReadOnly ? annotationData : null}
            onAnnotationClick={handleStartAnnotating}
          />
        )}
      </div>

      {/* Mobile: Comment Input */}
      <div id="mobile-add-comment" className="sm:hidden border-t bg-background flex-shrink-0 p-2">
        {isLocked ? (
          <div className="text-center text-muted-foreground py-3 px-2 bg-muted/30 rounded-md">
            <div className="flex items-center justify-center gap-2 text-xs">
              <span>🔒</span>
              <span>
                {isArchived
                  ? t('fileView:comments.archivedLocked')
                  : t('fileView:comments.featureLocked')}
              </span>
            </div>
          </div>
        ) : (
          <AddComment
            isMobile={true}
            onSubmit={handleSubmitComment}
            userName={currentUserName}
            onUserNameChange={onUserNameChange}
            currentTimestamp={file.type === 'video' ? currentTime : (file.type === 'sequence' ? currentFrame : undefined)}
            currentTimestampRef={currentTimeRef}
            showTimestamp={file.type === 'video' || file.type === 'sequence'}
            annotationData={!isReadOnly ? annotationData : null}
            onAnnotationClick={handleStartAnnotating}
          />
        )}
      </div>
    </div>
  )
}
