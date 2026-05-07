import { useState } from 'react'
import type { File as FileType } from '@/types'
import { format } from 'date-fns'
import { formatFileSize } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FileImage, Video, Box, MessageSquare, Clock, ShieldAlert, MoreHorizontal, Share2, Play } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ProjectShareDialog } from '@/components/dashboard/ProjectShareDialog'
import { parseDriveUrl } from '@/utils/googleDrive'
import { CardColorPicker } from '../shared/CardColorPicker'
import { useFileStore } from '@/stores/files'
import { cn } from '@/lib/utils'

interface Props {
  file: FileType
  resolvedUrl?: string
  commentCount: number
  onClick: () => void
}

const getFileTypeIcon = (type: string, size: string = 'w-8 h-8') => {
  if (type === 'image') return <FileImage className={`${size} text-green-500`} />
  if (type === 'video') return <Video className={`${size} text-blue-500`} />
  if (type === 'model') return <Box className={`${size} text-purple-500`} />
  return <FileImage className={`${size} text-gray-500`} />
}

const getFileTypeLabel = (type: string) => {
  if (type === 'image') return 'Hình ảnh'
  if (type === 'video') return 'Video'
  if (type === 'model') return 'Mô hình 3D'
  return 'Tệp tin'
}

export function FileCard({ file, resolvedUrl, commentCount, onClick }: Props) {
  const current = file.versions.find(v => v.version === file.currentVersion) || file.versions[0]
  const effectiveUrl = resolvedUrl || current?.url
  const uploadDate = current?.uploadedAt?.toDate ? current.uploadedAt.toDate() : new Date()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { updateFileBackgroundColor } = useFileStore()

  const renderThumbnail = () => {
    if (current?.validationStatus === 'infected') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-destructive/10">
          <ShieldAlert className="w-16 h-16 text-destructive/50" />
        </div>
      )
    }

    if (file.type === 'image' && effectiveUrl && !imageError) {
      return (
        <img
          src={effectiveUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )
    }

    if (file.type === 'video' && effectiveUrl) {
      const isDrive = !!parseDriveUrl(effectiveUrl)
      if (isDrive) {
        return (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <img
              src={effectiveUrl}
              alt={file.name}
              className={cn("w-full h-full object-cover", imageError && "hidden")}
              onError={() => setImageError(true)}
            />
            {imageError && <Video className="w-12 h-12 text-muted-foreground opacity-20" />}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Play className="w-6 h-6 text-white fill-current ml-1" />
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="absolute inset-0 bg-muted">
          <video
            src={effectiveUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
            autoPlay={isHovered}
            loop
          />
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Play className="w-6 h-6 text-white fill-current ml-1" />
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center opacity-40">
        {getFileTypeIcon(file.type, 'w-16 h-16')}
      </div>
    )
  }

  // Adaptive styles
  const cardStyle = file.cardBackgroundColor ? {
    backgroundColor: `color-mix(in srgb, ${file.cardBackgroundColor}, transparent 90%)`,
    borderColor: `color-mix(in srgb, ${file.cardBackgroundColor}, transparent 60%)`,
  } : {};

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden transition-all duration-300 cursor-pointer flex flex-col hover:shadow-2xl hover:-translate-y-1",
        file.cardBackgroundColor ? "border-opacity-50" : "hover:border-primary/50"
      )}
      style={cardStyle}
    >
      {/* Accent Bar */}
      {file.cardBackgroundColor && (
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 z-30 transition-all group-hover:h-2" 
          style={{ backgroundColor: file.cardBackgroundColor }} 
        />
      )}

      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden bg-muted/10">
        {renderThumbnail()}
        
        {file.type === 'video' && (
          <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300", isHovered ? 'opacity-0' : 'opacity-100')}>
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm shadow-xl">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="text-[10px] font-bold backdrop-blur-md bg-black/40 text-white border-0 px-2">
            {getFileTypeLabel(file.type)}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-bold backdrop-blur-md bg-white/90 text-black border-0 px-2">
            v{current?.version}
          </Badge>
        </div>

        {commentCount > 0 && (
          <div className="absolute bottom-3 right-3 text-[10px] font-bold backdrop-blur-md bg-primary/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg border-0">
            <MessageSquare className="w-3 h-3" />
            {commentCount}
          </div>
        )}

        {/* Validation Status Overlay */}
        {current?.validationStatus === 'infected' && (
          <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center backdrop-blur-sm z-20">
            <div className="text-center text-white">
              <ShieldAlert className="w-8 h-8 mx-auto mb-1" />
              <div className="text-xs font-bold uppercase">Nguy hiểm</div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
        <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors mb-2">{file.name}</h3>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-medium">
          <span>{formatFileSize(current?.metadata?.size || 0)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(uploadDate, 'dd/MM/yy')}</span>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 flex flex-col gap-1.5 p-1 backdrop-blur-md bg-black/10 rounded-full border border-white/10" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors shadow-xl">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <ProjectShareDialog
              projectId={file.projectId}
              resourceType="file"
              resourceId={file.id}
              resourceName={file.name}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
        
        <CardColorPicker
          currentColor={file.cardBackgroundColor}
          onColorChange={(color) => updateFileBackgroundColor(file.projectId, file.id, color)}
        />
      </div>
    </div>
  )
}
