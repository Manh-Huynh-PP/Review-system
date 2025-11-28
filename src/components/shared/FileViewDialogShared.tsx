import { useState, useRef, lazy, Suspense, useEffect } from 'react'
import type { File as FileType } from '@/types'
import { format } from 'date-fns'
import { formatFileSize } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Clock, 
  FileImage, 
  Video, 
  Box,
  ChevronDown,
  MessageSquare,
  Upload
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddComment } from '@/components/comments/AddComment'
import { CommentsList } from '@/components/comments/CommentsList'

const GLBViewer = lazy(() => import('@/components/viewers/GLBViewer').then(m => ({ default: m.GLBViewer })))

interface Props {
  file: FileType | null
  projectId: string
  resolvedUrl?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchVersion?: (fileId: string, version: number) => void
  onUploadNewVersion?: (file: File, existingFileId: string) => Promise<void>
  comments: any[]
  currentUserName: string
  onUserNameChange: (name: string) => void
  onAddComment: (userName: string, content: string, timestamp?: number, parentCommentId?: string) => Promise<void>
  onResolveToggle?: (commentId: string, isResolved: boolean) => void
}

const getFileTypeIcon = (type: string) => {
  if (type === 'image') return <FileImage className="w-5 h-5 text-green-500" />
  if (type === 'video') return <Video className="w-5 h-5 text-blue-500" />
  if (type === 'model') return <Box className="w-5 h-5 text-purple-500" />
  return <FileImage className="w-5 h-5 text-gray-500" />
}

const getFileTypeLabel = (type: string) => {
  if (type === 'image') return 'Hình ảnh'
  if (type === 'video') return 'Video'
  if (type === 'model') return 'Mô hình 3D'
  return 'Tệp tin'
}

export function FileViewDialogShared({ 
  file, 
  projectId: _projectId, 
  resolvedUrl, 
  open, 
  onOpenChange, 
  onSwitchVersion,
  onUploadNewVersion,
  comments,
  currentUserName,
  onUserNameChange,
  onAddComment,
  onResolveToggle
}: Props) {
  const [showComments, setShowComments] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentVersion, setCurrentVersion] = useState(file?.currentVersion || 1)

  // Update current version when file changes
  useEffect(() => {
    if (file) {
      setCurrentVersion(file.currentVersion)
      // Reset video time when switching versions
      if (videoRef.current) {
        videoRef.current.currentTime = 0
      }
    }
  }, [file?.currentVersion, file?.id])

  if (!file) return null

  const current = file.versions.find(v => v.version === currentVersion) || file.versions[0]
  const effectiveUrl = resolvedUrl || current?.url
  const uploadDate = current?.uploadedAt?.toDate ? current.uploadedAt.toDate() : new Date()
  
  const fileComments = comments.filter(c => c.fileId === file.id && c.version === currentVersion)

  const handleTimestampClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      videoRef.current.play()
    }
  }

  const renderFilePreview = () => {
    if (!effectiveUrl) {
      return (
        <div className="aspect-video bg-muted/20 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">📄</div>
            <div>Không thể tải file</div>
          </div>
        </div>
      )
    }

    if (file.type === 'image') {
      return (
        <div className="relative bg-muted/20">
          <img
            src={effectiveUrl}
            alt={file.name}
            className="w-full h-auto max-h-[70vh] object-contain mx-auto"
          />
        </div>
      )
    }

    if (file.type === 'video') {
      return (
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={effectiveUrl}
            controls
            className="w-full h-auto max-h-[70vh] mx-auto"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
        </div>
      )
    }

    if (file.type === 'model') {
      return (
        <div className="h-[70vh] bg-muted/20">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Đang tải mô hình 3D...</p>
              </div>
            </div>
          }>
            <GLBViewer url={effectiveUrl} />
          </Suspense>
        </div>
      )
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {getFileTypeIcon(file.type)}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base truncate">{file.name}</DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getFileTypeLabel(file.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(current?.metadata?.size || 0)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(uploadDate, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Version selector */}
              {file.versions.length > 0 && onSwitchVersion && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Clock className="w-3 h-3" />
                      v{currentVersion}
                      {file.versions.length > 1 && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                          {file.versions.length}
                        </Badge>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Lịch sử phiên bản
                    </div>
                    {file.versions
                      .sort((a, b) => b.version - a.version)
                      .map(v => {
                        const vDate = v.uploadedAt?.toDate ? v.uploadedAt.toDate() : new Date()
                        return (
                          <DropdownMenuItem
                            key={v.version}
                            onClick={() => onSwitchVersion(file.id, v.version)}
                            className={v.version === currentVersion ? 'bg-accent' : ''}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">v{v.version}</span>
                                {v.version === currentVersion && (
                                  <Badge variant="secondary" className="text-xs h-4 px-1">Hiện tại</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(vDate, 'dd/MM HH:mm')}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Upload new version button */}
              {onUploadNewVersion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Phiên bản mới
                </Button>
              )}

              {/* Hidden file input for new version upload */}
              {onUploadNewVersion && (
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={file.type === 'image' ? 'image/*' : file.type === 'video' ? 'video/*' : '.glb,.gltf'}
                  onChange={(e) => {
                    const newFile = e.target.files?.[0]
                    if (newFile && file) {
                      onUploadNewVersion(newFile, file.id)
                      e.target.value = '' // Reset input
                    }
                  }}
                  aria-label="Upload new version"
                />
              )}

              {/* Download button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  effectiveUrl && window.open(effectiveUrl, '_blank')
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Tải xuống
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content - Split view */}
        <div className="flex h-[calc(95vh-100px)] min-h-0">
          {/* File Preview - Left side */}
          <div className="flex-1 overflow-auto">
            {renderFilePreview()}
          </div>

          {/* Comments - Right sidebar */}
          <div className="w-96 border-l flex flex-col bg-muted/10 min-h-0">
            {/* Comments header */}
            <div className="p-4 border-b bg-background shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Góp ý ({fileComments.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? 'Ẩn' : 'Hiện'}
                </Button>
              </div>
            </div>

            {showComments && (
              <>
                {/* Comments list */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  {fileComments.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Chưa có góp ý nào. Hãy là người đầu tiên!
                    </div>
                  ) : (
                    <CommentsList
                      comments={fileComments}
                      onTimestampClick={file.type === 'video' ? handleTimestampClick : undefined}
                      onResolveToggle={onResolveToggle}
                      onReply={async (parentId, userName, content) => {
                        await onAddComment(userName, content, file.type === 'video' ? currentTime : undefined, parentId)
                      }}
                      currentUserName={currentUserName}
                    />
                  )}
                </div>

                {/* Add comment form */}
                <div className="p-4 border-t bg-background shrink-0">
                  <AddComment
                    userName={currentUserName}
                    onUserNameChange={onUserNameChange}
                    onSubmit={onAddComment}
                    currentTimestamp={file.type === 'video' ? currentTime : undefined}
                    showTimestamp={file.type === 'video'}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
