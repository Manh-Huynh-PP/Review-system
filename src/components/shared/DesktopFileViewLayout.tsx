import React from 'react'
import type { DropPinCoordinates } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { FileViewHeader } from './FileViewHeader'
import { DesktopCommentsSidebar } from './DesktopCommentsSidebar'
import { FloatingCommentCard } from '@/components/comments/FloatingCommentCard'
import { useTranslation } from 'react-i18next'
interface DesktopFileViewLayoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: any
  current: any
  _projectId: string
  currentVersion: number
  uniqueVersions: any[]
  isAdmin: boolean
  onRenameFile?: (fileId: string, newName: string) => Promise<void>
  onSwitchVersion?: (fileId: string, version: number) => void
  deleteVersion: (projectId: string, fileId: string, version: number) => Promise<void>
  onUploadNewVersion?: (file: File, existingFileId: string) => Promise<void> | void
  setShowUploadDialog: (show: boolean) => void
  handleDownload: (e: React.MouseEvent, manualUrl?: string, manualVersion?: any) => Promise<void> | void
  getFileTypeIcon: (type: string) => React.ReactNode
  getFileTypeLabel: (type: string) => string
  formatFileSize: (size: number) => string
  ensureFileExtension: (filename: string, url: string, mimeType?: string, fileType?: string) => string
  uploadDate: Date
  sequenceContext: any
  latestUrl?: string
  latestVersion: any
  handleStartTour: () => void
  videoComparison: any
  showComments: boolean
  setShowComments: (show: boolean) => void
  compareMode: boolean
  setCompareMode: (compare: boolean) => void
  getShareLink: () => string
  copyShareLink: () => Promise<void>
  copied: boolean
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  renderFilePreview: () => React.ReactNode
  isAnnotating: boolean
  isReadOnly: boolean
  handleStartAnnotating: () => void
  handleDoneAnnotating: () => void
  showOnlyCurrentTimeComments: boolean
  setShowOnlyCurrentTimeComments: (show: boolean) => void
  isVideoFullscreen: boolean
  handleResizeStart: (e: React.MouseEvent) => void
  project: any
  isArchived: boolean
  viewAllVersions: boolean
  setViewAllVersions: (view: boolean) => void
  fileComments: any[]
  currentUserName: string
  onUserNameChange: (name: string) => void
  onResolveToggle?: (commentId: string, isResolved?: boolean) => void
  handleTimestampClick: (timestamp: number) => void
  handleViewAnnotation: (dataStr: string, comment?: any) => void
  onAddComment: any
  onEditComment?: (commentId: string, newContent: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  annotationData: any
  glbViewerRef: any
  setAnnotationData: (data: any) => void
  setIsAnnotating: (annotating: boolean) => void
  currentTime: number
  currentTimeRef: any
  currentFrame: number
  commentWidth: number
  annotationTool: any
  setAnnotationTool: (tool: any) => void
  annotationColor: string
  setAnnotationColor: (color: string) => void
  annotationStrokeWidth: number
  setAnnotationStrokeWidth: (width: number) => void
  handleAnnotationUndo: () => void
  handleAnnotationRedo: () => void
  handleClearAnnotations: () => void
  annotationHistoryIndex: number
  annotationHistory: any[]
  portalContainer?: HTMLElement | null
  fullscreenPortalTarget?: HTMLElement | null
  isDropPinMode?: boolean
  setIsDropPinMode?: (isDropPinMode: boolean) => void
  dropPinCoordinates?: DropPinCoordinates | null
  setDropPinCoordinates?: (coords: DropPinCoordinates | null) => void
}

export const DesktopFileViewLayout: React.FC<DesktopFileViewLayoutProps> = (props) => {
  const {
    open, onOpenChange, file, current, _projectId, currentVersion, uniqueVersions,
    isAdmin, onRenameFile, onSwitchVersion, deleteVersion, onUploadNewVersion,
    setShowUploadDialog, handleDownload, getFileTypeIcon, getFileTypeLabel,
    formatFileSize, ensureFileExtension, uploadDate, sequenceContext, latestUrl,
    latestVersion, handleStartTour, videoComparison, showComments, setShowComments,
    compareMode, setCompareMode, getShareLink, copyShareLink, copied,
    handleDragOver, handleDragLeave, handleDrop, renderFilePreview,

    showOnlyCurrentTimeComments, setShowOnlyCurrentTimeComments,
    isVideoFullscreen, handleResizeStart, project, isArchived,
    viewAllVersions, setViewAllVersions, fileComments, currentUserName, onUserNameChange,
    onResolveToggle, handleTimestampClick, handleViewAnnotation, onAddComment,
    onEditComment, onDeleteComment,
    currentTime, currentTimeRef, currentFrame, commentWidth,
    portalContainer, fullscreenPortalTarget,
    isDropPinMode, dropPinCoordinates, setDropPinCoordinates
  } = props

  const { t } = useTranslation(['fileView', 'common'])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        container={portalContainer}
        className="max-w-[98vw] w-full h-[98vh] flex flex-col p-0 gap-0 outline-none" 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
      >
        <DialogTitle className="sr-only">{t('fileView:toolbar.fileDetails', { name: file?.name })}</DialogTitle>
        <FileViewHeader 
          file={file} current={current} projectId={_projectId} currentVersion={currentVersion} 
          uniqueVersions={uniqueVersions} isAdmin={isAdmin} onOpenChange={onOpenChange} 
          onRenameFile={onRenameFile} onSwitchVersion={onSwitchVersion} deleteVersion={deleteVersion} 
          onUploadNewVersion={onUploadNewVersion} setShowUploadDialog={setShowUploadDialog} 
          handleDownload={handleDownload} getFileTypeIcon={getFileTypeIcon} 
          getFileTypeLabel={getFileTypeLabel} formatFileSize={formatFileSize} 
          ensureFileExtension={ensureFileExtension} uploadDate={uploadDate} 
          sequenceContext={sequenceContext} latestUrl={latestUrl} latestVersion={latestVersion} 
          handleStartTour={handleStartTour} videoComparison={videoComparison} 
          showComments={showComments} setShowComments={setShowComments} 
          compareMode={compareMode} setCompareMode={setCompareMode} 
          getShareLink={getShareLink} copyShareLink={copyShareLink} copied={copied} 
        />
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto flex flex-col bg-background/50">
            <div className="p-2 border-b flex items-center justify-between sticky top-0 z-10 bg-background/95">
              <div className="flex items-center gap-2">
              </div>
              {file.type === 'video' && (
                <Button 
                  id="filter-time-toggle"
                  variant={showOnlyCurrentTimeComments ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setShowOnlyCurrentTimeComments(!showOnlyCurrentTimeComments)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showOnlyCurrentTimeComments ? t('fileView:toolbar.filtering') : t('fileView:toolbar.filterTime')}
                </Button>
              )}
            </div>
            <div 
              id="preview-container" 
              className={`flex-1 flex overflow-hidden relative ${isDropPinMode ? 'cursor-crosshair' : ''}`}
            >
              {renderFilePreview()}
              
              {isDropPinMode && dropPinCoordinates && dropPinCoordinates.screenX !== undefined && dropPinCoordinates.screenY !== undefined && (
                <FloatingCommentCard
                  x={dropPinCoordinates.screenX}
                  y={dropPinCoordinates.screenY}
                  spatialContext={{
                    viewerType: file.type as any,
                    x_pct: dropPinCoordinates.x,
                    y_pct: dropPinCoordinates.y,
                    w_pct: dropPinCoordinates.w,
                    h_pct: dropPinCoordinates.h,
                    timestamp: file.type === 'video' ? currentTime : undefined,
                    frameNumber: file.type === 'sequence' ? currentFrame : undefined
                  }}
                  onClose={() => { setDropPinCoordinates?.(null); /* Do not turn off isDropPinMode */ }}
                  onSubmit={async (content, attachments, color) => {
                    const spatialData = dropPinCoordinates.type === 'region'
                      ? JSON.stringify({ x: dropPinCoordinates.x, y: dropPinCoordinates.y, w: dropPinCoordinates.w, h: dropPinCoordinates.h, color: color || '#ef4444', type: 'region' })
                      : JSON.stringify({ x: dropPinCoordinates.x, y: dropPinCoordinates.y, color: color || '#ef4444' });
                    const ts = file.type === 'video' ? currentTimeRef.current : (file.type === 'sequence' ? currentFrame : undefined);
                    await onAddComment(currentUserName, content, ts, undefined, spatialData, attachments);
                    setDropPinCoordinates?.(null);
                  }}
                  userName={currentUserName}
                  onUserNameChange={onUserNameChange}
                />
              )}
            </div>
          </div>
          {showComments && !isVideoFullscreen && (
            <div className="contents">
              <div 
                id="comments-resize-handle"
                className="w-1 cursor-col-resize hover:bg-primary transition-colors flex-shrink-0" 
                onMouseDown={handleResizeStart} 
              />
              <DesktopCommentsSidebar 
                isFullscreen={false} file={file} project={project} isArchived={isArchived} 
                isAdmin={isAdmin} viewAllVersions={viewAllVersions} setViewAllVersions={setViewAllVersions} 
                showOnlyCurrentTimeComments={showOnlyCurrentTimeComments} fileComments={fileComments} 
                currentUserName={currentUserName}
                onResolveToggle={onResolveToggle} handleTimestampClick={handleTimestampClick} 
                handleViewAnnotation={handleViewAnnotation} onAddComment={onAddComment} 
                onEditComment={onEditComment} onDeleteComment={onDeleteComment} 
                commentWidth={commentWidth} 
              />
            </div>
          )}
        </div>
        {showComments && isVideoFullscreen && !fullscreenPortalTarget && (
          <DesktopCommentsSidebar 
            isFullscreen={true} file={file} project={project} isArchived={isArchived} 
            isAdmin={isAdmin} viewAllVersions={viewAllVersions} setViewAllVersions={setViewAllVersions} 
            showOnlyCurrentTimeComments={showOnlyCurrentTimeComments} fileComments={fileComments} 
            currentUserName={currentUserName}
            onResolveToggle={onResolveToggle} handleTimestampClick={handleTimestampClick} 
            handleViewAnnotation={handleViewAnnotation} onAddComment={onAddComment} 
            onEditComment={onEditComment} onDeleteComment={onDeleteComment} 
          />
        )}
        {/* Legacy AnnotationToolbar deprecated */}
      </DialogContent>
    </Dialog>
  )
}
