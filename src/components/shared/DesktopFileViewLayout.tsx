import React from 'react'
import { createPortal } from 'react-dom'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { FileViewHeader } from './FileViewHeader'
import { DesktopCommentsSidebar } from './DesktopCommentsSidebar'
import { AnnotationToolbar } from '@/components/annotations/AnnotationToolbar'

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
    isAnnotating, isReadOnly, handleStartAnnotating, handleDoneAnnotating,
    showOnlyCurrentTimeComments, setShowOnlyCurrentTimeComments,
    isVideoFullscreen, handleResizeStart, project, isArchived,
    viewAllVersions, setViewAllVersions, fileComments, currentUserName, onUserNameChange,
    onResolveToggle, handleTimestampClick, handleViewAnnotation, onAddComment,
    onEditComment, onDeleteComment, annotationData, glbViewerRef, setAnnotationData,
    setIsAnnotating, currentTime, currentTimeRef, currentFrame, commentWidth,
    annotationTool, setAnnotationTool, annotationColor, setAnnotationColor,
    annotationStrokeWidth, setAnnotationStrokeWidth, handleAnnotationUndo,
    handleAnnotationRedo, handleClearAnnotations, annotationHistoryIndex,
    annotationHistory, portalContainer, fullscreenPortalTarget
  } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        container={portalContainer}
        className="max-w-[98vw] w-full h-[98vh] flex flex-col p-0 gap-0 outline-none" 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
      >
        <DialogTitle className="sr-only">Chi tiết file: {file?.name}</DialogTitle>
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
                {!isAnnotating ? (
                  <Button onClick={handleStartAnnotating} variant="outline" size="sm">Thêm ghi chú</Button>
                ) : (
                  <Button onClick={handleDoneAnnotating} variant="ghost" size="sm">
                    {isReadOnly ? 'Đóng' : 'Đang vẽ...'}
                  </Button>
                )}
              </div>
              {(file.type === 'video' || file.type === 'sequence') && (
                <Button 
                  id="filter-time-toggle"
                  variant={showOnlyCurrentTimeComments ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setShowOnlyCurrentTimeComments(!showOnlyCurrentTimeComments)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showOnlyCurrentTimeComments ? 'Đang lọc' : 'Lọc thời gian'}
                </Button>
              )}
            </div>
            <div id="preview-container" className="flex-1 flex overflow-hidden">
              {renderFilePreview()}
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
                currentUserName={currentUserName} onUserNameChange={onUserNameChange} 
                onResolveToggle={onResolveToggle} handleTimestampClick={handleTimestampClick} 
                handleViewAnnotation={handleViewAnnotation} onAddComment={onAddComment} 
                onEditComment={onEditComment} onDeleteComment={onDeleteComment} 
                annotationData={annotationData} isReadOnly={isReadOnly} 
                getCameraState={() => glbViewerRef.current?.getCameraState()} 
                setAnnotationData={setAnnotationData} setIsAnnotating={setIsAnnotating} 
                currentTime={currentTime} currentTimeRef={currentTimeRef} 
                currentFrame={currentFrame} handleStartAnnotating={handleStartAnnotating} 
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
            currentUserName={currentUserName} onUserNameChange={onUserNameChange} 
            onResolveToggle={onResolveToggle} handleTimestampClick={handleTimestampClick} 
            handleViewAnnotation={handleViewAnnotation} onAddComment={onAddComment} 
            onEditComment={onEditComment} onDeleteComment={onDeleteComment} 
            annotationData={annotationData} isReadOnly={isReadOnly} 
            getCameraState={() => glbViewerRef.current?.getCameraState()} 
            setAnnotationData={setAnnotationData} setIsAnnotating={setIsAnnotating} 
            currentTime={currentTime} currentTimeRef={currentTimeRef} 
            currentFrame={currentFrame} handleStartAnnotating={handleStartAnnotating} 
          />
        )}
        {isAnnotating && !isReadOnly && (
          fullscreenPortalTarget ? createPortal(
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <AnnotationToolbar 
                tool={annotationTool} onToolChange={setAnnotationTool} color={annotationColor} 
                onColorChange={setAnnotationColor} strokeWidth={annotationStrokeWidth} 
                onStrokeWidthChange={setAnnotationStrokeWidth} onUndo={handleAnnotationUndo} 
                onRedo={handleAnnotationRedo} onClear={handleClearAnnotations} 
                onDone={handleDoneAnnotating} canUndo={annotationHistoryIndex > 0} 
                canRedo={annotationHistoryIndex < annotationHistory.length - 1} 
              />
            </div>,
            fullscreenPortalTarget
          ) : (
            <AnnotationToolbar 
              tool={annotationTool} onToolChange={setAnnotationTool} color={annotationColor} 
              onColorChange={setAnnotationColor} strokeWidth={annotationStrokeWidth} 
              onStrokeWidthChange={setAnnotationStrokeWidth} onUndo={handleAnnotationUndo} 
              onRedo={handleAnnotationRedo} onClear={handleClearAnnotations} 
              onDone={handleDoneAnnotating} canUndo={annotationHistoryIndex > 0} 
              canRedo={annotationHistoryIndex < annotationHistory.length - 1} 
            />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
