import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useFileStore } from '@/stores/files'
import {
  Link2, CheckCircle, AlertCircle, FileImage, Video, FileText, FolderOpen, Loader2, ExternalLink
} from 'lucide-react'
import { detectUrlType, parseDriveUrl } from '@/utils/googleDrive'
import type { FileType } from '@/types'

interface ExternalLinkUploaderProps {
  projectId: string
  onUploadComplete?: () => void
}

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  image: { label: 'Hình ảnh', icon: <FileImage className="w-4 h-4" />, color: 'text-green-500' },
  video: { label: 'Video', icon: <Video className="w-4 h-4" />, color: 'text-blue-500' },
  pdf: { label: 'PDF', icon: <FileText className="w-4 h-4" />, color: 'text-red-500' },
  google_drive_file: { label: 'Google Drive File', icon: <ExternalLink className="w-4 h-4" />, color: 'text-yellow-500' },
  google_drive_folder: { label: 'Google Drive Folder', icon: <FolderOpen className="w-4 h-4" />, color: 'text-purple-500' },
  unknown: { label: 'Không xác định', icon: <Link2 className="w-4 h-4" />, color: 'text-muted-foreground' },
}

export function ExternalLinkUploader({ projectId, onUploadComplete }: ExternalLinkUploaderProps) {
  const { addExternalLink, addDriveFolderAsSequence, uploading, uploadProgress } = useFileStore()

  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [detectedType, setDetectedType] = useState<string>('unknown')
  const [manualType, setManualType] = useState<FileType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Auto-detect type when URL changes
  useEffect(() => {
    if (!url.trim()) {
      setDetectedType('unknown')
      return
    }

    const type = detectUrlType(url.trim())
    setDetectedType(type)

    // Auto-fill name from URL if empty
    if (!name.trim()) {
      try {
        if (type === 'google_drive_folder') {
          setName('Drive Folder')
        } else if (type === 'google_drive_file') {
          setName('Drive File')
        } else {
          const u = new URL(url.trim())
          const segments = u.pathname.split('/').filter(Boolean)
          const lastSegment = segments[segments.length - 1] || ''
          // Remove extension for display
          const baseName = decodeURIComponent(lastSegment).replace(/\.[^/.]+$/, '')
          if (baseName) setName(baseName)
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }, [url])

  const getEffectiveType = (): FileType => {
    if (manualType) return manualType
    
    // For standard URLs already detected as image/video/pdf
    if (detectedType === 'image') return 'image'
    if (detectedType === 'video') return 'video'
    if (detectedType === 'pdf') return 'pdf'
    
    // Fallback for google drive files
    // Try to guess from URL common video extensions
    const lowerUrl = url.toLowerCase()
    if (/\.(mp4|webm|mov|avi|mkv|m4v)/i.test(lowerUrl)) return 'video'
    if (/\.(pdf)/i.test(lowerUrl)) return 'pdf'
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(lowerUrl)) return 'image'
    
    // If we're not sure, and it's a Drive file, default to video/file to trigger the switcher
    return 'video'
  }

  const handleSubmit = async () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      setError('Vui lòng nhập URL')
      return
    }

    if (!name.trim()) {
      setError('Vui lòng nhập tên hiển thị')
      return
    }

    // Validate URL
    try {
      new URL(trimmedUrl)
    } catch {
      setError('URL không hợp lệ')
      return
    }

    setError(null)

    try {
      if (detectedType === 'google_drive_folder') {
        const driveInfo = parseDriveUrl(trimmedUrl)
        if (!driveInfo || driveInfo.type !== 'folder') {
          setError('Không thể nhận diện folder ID từ URL')
          return
        }
        await addDriveFolderAsSequence(projectId, driveInfo.id, name.trim())
      } else {
        await addExternalLink(projectId, trimmedUrl, name.trim(), getEffectiveType())
      }

      setSuccess(true)
      setTimeout(() => {
        onUploadComplete?.()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Thêm link thất bại')
    }
  }

  const typeInfo = typeLabels[detectedType] || typeLabels.unknown

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
          Thêm link thành công!
        </div>
        <div className="text-sm text-muted-foreground">
          File sẽ xuất hiện trong danh sách
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="external-url">URL</Label>
        <div className="relative">
          <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="external-url"
            placeholder="Dán link ảnh, video, PDF, hoặc Google Drive folder..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={uploading}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Auto-detected type indicator */}
        {url.trim() && detectedType !== 'unknown' && (
          <div className={`flex items-center gap-2 text-sm ${typeInfo.color}`}>
            {typeInfo.icon}
            <span>Phát hiện: <strong>{typeInfo.label}</strong></span>
          </div>
        )}
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="external-name">Tên hiển thị</Label>
        <Input
          id="external-name"
          placeholder="VD: Banner Design, Product Video..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={uploading}
        />
      </div>

      {/* Type override for ambiguous or Drive URLs */}
      {(detectedType === 'unknown' || detectedType === 'google_drive_file') && url.trim() && (
        <div className="space-y-2">
          <Label>Loại file</Label>
          <div className="flex gap-2">
            {(['image', 'video', 'pdf'] as FileType[]).map((t) => {
              const info = typeLabels[t]
              const isActive = (manualType || 'image') === t
              return (
                <Button
                  key={t}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setManualType(t)}
                  className="gap-1"
                  disabled={uploading}
                >
                  {info.icon}
                  {info.label}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Google Drive folder info */}
      {detectedType === 'google_drive_folder' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <FolderOpen className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
          <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
            <div className="font-medium">Google Drive Folder</div>
            <ul className="list-disc list-inside space-y-0.5 text-purple-600 dark:text-purple-400">
              <li>Tất cả ảnh trong folder sẽ hiển thị dưới dạng Image Sequence Grid</li>
              <li>Folder phải được chia sẻ công khai ("Anyone with the link")</li>
              <li>Chỉ hỗ trợ file ảnh (JPG, PNG, WebP, GIF)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {detectedType === 'google_drive_folder'
                ? 'Đang tải danh sách ảnh từ Google Drive...'
                : 'Đang thêm link...'}
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Submit Button */}
      {!uploading && (
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || !name.trim()}
          className="w-full"
          size="lg"
        >
          <Link2 className="w-4 h-4 mr-2" />
          {detectedType === 'google_drive_folder'
            ? 'Nhập folder từ Google Drive'
            : 'Thêm link vào project'}
        </Button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {/* Supported formats info */}
      <div className="text-center text-xs text-muted-foreground">
        Hỗ trợ: Link ảnh (JPG, PNG, WebP), Video (MP4, WebM), PDF, Google Drive file/folder
      </div>
    </div>
  )
}
