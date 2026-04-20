import { Badge } from '@/components/ui/badge'
import { FileImage, Video, Box, FileText, MessageSquare, Lock, Play, Trash2 } from 'lucide-react'
import type { File as FileType } from '@/types'
import { cn } from '@/lib/utils'
import { CardColorPicker } from './CardColorPicker'
import { Button } from '@/components/ui/button'
import { useFileStore } from '@/stores/files'

interface FileCardSharedProps {
  file: FileType
  resolvedUrl?: string
  commentCount: number
  onClick: () => void
  onDelete?: () => void
  onToggleLock?: () => void
  isLocked?: boolean
  isAdmin?: boolean
  compact?: boolean
}

const getFileTypeIcon = (type: string, size: string = 'w-8 h-8') => {
  if (type === 'image') return <FileImage className={`${size} text-green-500`} />
  if (type === 'video') return <Video className={`${size} text-blue-500`} />
  if (type === 'model') return <Box className={`${size} text-purple-500`} />
  if (type === 'pdf') return <FileText className={`${size} text-red-500`} />
  return <FileImage className={`${size} text-gray-500`} />
}

const getFileTypeLabel = (type: string) => {
  if (type === 'image') return 'Hình ảnh'
  if (type === 'video') return 'Video'
  if (type === 'model') return 'Mô hình 3D'
  if (type === 'sequence') return 'Image Sequence'
  if (type === 'pdf') return 'PDF'
  return 'Tệp tin'
}

export function FileCardShared({
  file,
  resolvedUrl,
  commentCount,
  onClick,
  onDelete,
  onToggleLock,
  isLocked,
  isAdmin,
  compact = false
}: FileCardSharedProps) {
  const current = file.versions.find(v => v.version === file.currentVersion) || file.versions[0]
  const effectiveUrl = resolvedUrl || current?.url
  const { updateFileBackgroundColor } = useFileStore()

  const renderThumbnail = () => {
    // Sequence files - show first frame with badge
    if (file.type === 'sequence' && effectiveUrl) {
      return (
        <div className="absolute inset-0">
          <img
            src={effectiveUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0 h-5 backdrop-blur-sm bg-black/60 text-white border-0"
          >
            {current?.frameCount || 0}f
          </Badge>
        </div>
      )
    }

    // Image files
    if (file.type === 'image' && effectiveUrl) {
      return (
        <img
          src={effectiveUrl}
          alt={file.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )
    }

    // Video files - show as static thumbnail with play icon overlay
    if (file.type === 'video' && effectiveUrl) {
      return (
        <div className="absolute inset-0 bg-muted">
          <img
            src={effectiveUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-transform group-hover:scale-110">
              <Play className="w-6 h-6 text-white fill-current ml-1" />
            </div>
          </div>
        </div>
      )
    }

    // Model files - show thumbnail if available, otherwise icon
    if (file.type === 'model' && current?.thumbnailUrl) {
      return (
        <img
          src={current.thumbnailUrl}
          alt={file.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )
    }

    // PDF files - show thumbnail if available, otherwise icon
    if (file.type === 'pdf' && current?.thumbnailUrl) {
      return (
        <img
          src={current.thumbnailUrl}
          alt={file.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )
    }

    // Fallback icon
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {getFileTypeIcon(file.type, 'w-16 h-16 opacity-50')}
      </div>
    )
  }

  // Calculate dynamic styles for adaptive background
  const cardStyle = file.cardBackgroundColor ? {
    backgroundColor: `color-mix(in srgb, ${file.cardBackgroundColor}, transparent 90%)`,
    borderColor: `color-mix(in srgb, ${file.cardBackgroundColor}, transparent 60%)`,
  } : {};

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden transition-all duration-300 cursor-pointer flex flex-col",
        file.cardBackgroundColor ? "border-opacity-50" : "hover:border-primary/50"
      )}
      style={cardStyle}
    >

      {/* Thumbnail Container */}
      <div 
        className={cn(
          compact ? 'aspect-square' : 'aspect-video',
          "relative overflow-hidden transition-colors duration-500",
          !file.cardBackgroundColor && "bg-muted/10"
        )}
      >
        {renderThumbnail()}
        
        {/* Hover info overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Badge variant="secondary" className="bg-white/90 text-black border-none px-3 py-1 text-xs font-semibold shadow-xl">
              Nhấn để xem
            </Badge>
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {!compact && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold backdrop-blur-md bg-black/40 text-white border-0 border-white/10 px-2 py-0.5">
              {getFileTypeLabel(file.type)}
            </Badge>
          )}
          {isLocked && (
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full backdrop-blur-md bg-red-500/80 border-0">
              <Lock className="w-3 h-3" />
            </Badge>
          )}
        </div>

        {/* Comment count badge */}
        {commentCount > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="default" className="text-[10px] font-bold backdrop-blur-md bg-primary/90 gap-1 border-0 shadow-lg px-2 py-0.5">
              <MessageSquare className="w-3 h-3" />
              {commentCount}
            </Badge>
          </div>
        )}

        {/* Admin Controls Overlay */}
        {isAdmin && (
          <div 
            className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5 p-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl">
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="h-7 w-7 rounded-full bg-white/10 hover:bg-red-500 hover:text-white text-white transition-colors"
                  title="Xóa file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onToggleLock && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLock()
                  }}
                  className={cn(
                    "h-7 w-7 rounded-full transition-colors backdrop-blur-sm",
                    isLocked 
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : "bg-white/10 hover:bg-white/30 text-white"
                  )}
                  title={isLocked ? "Mở khóa bình luận" : "Khóa bình luận"}
                >
                  <Lock className="h-3.5 w-3.5" />
                </Button>
              )}
              <CardColorPicker
                currentColor={file.cardBackgroundColor}
                onColorChange={(color) => updateFileBackgroundColor(file.projectId, file.id, color)}
                align="end"
              />
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
        <h3 className={cn(
          "font-bold truncate group-hover:text-primary transition-colors",
          compact ? "text-xs" : "text-sm",
          file.cardBackgroundColor && "dark:text-white text-slate-900"
        )}>
          {file.name}
        </h3>
        {!compact && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "h-5 px-2 text-[10px] font-bold border-primary/20 bg-primary/5",
                file.cardBackgroundColor && "border-opacity-30"
              )}>
                v{file.currentVersion}
              </Badge>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/60">
              {file.updatedAt?.toDate().toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
