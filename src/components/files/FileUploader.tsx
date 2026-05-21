import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useFileStore } from '@/stores/files'
import { useUploadProgressStore } from '@/stores/uploadProgress'
import { formatFileSize, generateId } from '@/lib/utils'
import { Upload, X, CheckCircle, AlertCircle, FileImage, Video, Box, File as FileIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface FileUploaderProps {
  projectId: string
  existingFileId?: string
  onUploadComplete?: () => void
  onUploadingChange?: (isUploading: boolean) => void
  initialFiles?: File[]
}

interface FileUploadStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const MAX_SIZE = 200 * 1024 * 1024 // 200MB for GLB files
const ALLOWED_TYPES = {
  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  // Videos
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  // 3D Models
  'model/gltf-binary': '.glb',
  'model/gltf+json': '.gltf',
  // Handle GLB files that might be detected as application/octet-stream
  'application/octet-stream': '.glb',
  // Documents
  'application/pdf': '.pdf'
}



export function FileUploader({ projectId, existingFileId, onUploadComplete, onUploadingChange, initialFiles }: FileUploaderProps) {
  const { uploadFile } = useFileStore()
  const { addTask, updateTask } = useUploadProgressStore()
  const uploadTaskIdRef = useRef<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize queue with initialFiles if provided
  const [uploadQueue, setUploadQueue] = useState<FileUploadStatus[]>(() => {
    if (!initialFiles || initialFiles.length === 0) return []
    return initialFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }))
  })

  const [isUploading, setIsUploading] = useState(false)
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_SIZE) {
      return `File quá lớn (${formatFileSize(file.size)}). Tối đa ${formatFileSize(MAX_SIZE)}.`
    }

    // Special handling for GLB files (might be detected as application/octet-stream)
    const isGLB = file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')
    const hasValidType = Object.keys(ALLOWED_TYPES).includes(file.type)

    if (!hasValidType && !isGLB) {
      const allowedExts = Object.values(ALLOWED_TYPES).join(', ')
      return `Định dạng không hỗ trợ. Chỉ chấp nhận: ${allowedExts}`
    }

    // Additional validation for GLB files
    if (isGLB && file.size < 100) {
      return 'File GLB có vẻ không hợp lệ (quá nhỏ)'
    }

    return null
  }

  // Guard to prevent StrictMode double-invocation from uploading twice
  const hasAutoProcessed = useRef(false)
  const prevInitialFilesRef = useRef<File[] | undefined>(initialFiles)

  // Reset guard when initialFiles reference changes (new drag-drop)
  if (initialFiles !== prevInitialFilesRef.current) {
    prevInitialFilesRef.current = initialFiles
    hasAutoProcessed.current = false
  }

  // Auto-process initial files + sync queue when initialFiles changes
  useEffect(() => {
    if (hasAutoProcessed.current) return
    if (initialFiles && initialFiles.length > 0 && !isUploading && currentUploadIndex === -1) {
      // Sync uploadQueue to reflect new files in UI (useState initializer only runs once)
      setUploadQueue(initialFiles.map(file => ({ file, status: 'pending' as const, progress: 0 })))
      hasAutoProcessed.current = true
      processFiles(initialFiles)
    }
  }, [initialFiles]) // Re-run when initialFiles changes

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return
    setError(null)
    const validFiles: FileUploadStatus[] = []
    const errors: string[] = []

    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        validFiles.push({
          file,
          status: 'pending',
          progress: 0
        })
      }
    }

    if (errors.length > 0 && validFiles.length === 0) {
      setError(errors.join('\n'))
      return
    }

    if (errors.length > 0) {
      console.warn('⚠️ Some files failed validation:', errors)
      toast.error(`${errors.length} file bị bỏ qua:\n${errors.join('\n')}`, { duration: 5000 })
    }

    setUploadQueue(validFiles)
    setIsUploading(true)
    onUploadingChange?.(true)

    // Register upload task in global store for popup tracking
    const taskId = generateId()
    uploadTaskIdRef.current = taskId
    addTask({
      id: taskId,
      projectId,
      fileName: validFiles[0]?.file.name || 'Unknown',
      fileType: 'single',
      existingFileId,
      status: 'uploading',
      progress: 0,
      totalFiles: validFiles.length,
      completedFiles: 0,
      startedAt: Date.now()
    })

    // Upload files sequentially — track results with local counters (not stale state)
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < validFiles.length; i++) {
      setCurrentUploadIndex(i)
      let item = validFiles[i]

      try {
        let fileToUpload = item.file

        // Update status to uploading (network)
        setUploadQueue(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading' } : f
        ))

        console.log(`🎯 Uploading file ${i + 1}/${validFiles.length}: ${fileToUpload.name}`)
        await uploadFile(projectId, fileToUpload, existingFileId, (fileProgress) => {
          // Calculate smooth overall progress
          const overallProgress = Math.round(((i * 100) + fileProgress) / validFiles.length)
          updateTask(uploadTaskIdRef.current, { progress: Math.min(overallProgress, 99) })
          
          // Also update the individual file progress in the queue
          setUploadQueue(prev => prev.map((f, idx) =>
            idx === i ? { ...f, progress: fileProgress } : f
          ))
        })

        // Update status to success
        successCount++
        setUploadQueue(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ))
        console.log(`✅ File ${i + 1}/${validFiles.length} uploaded successfully`)
        updateTask(uploadTaskIdRef.current, {
          completedFiles: i + 1,
          progress: Math.round(((i + 1) / validFiles.length) * 100),
          fileName: i + 1 < validFiles.length ? validFiles[i + 1]?.file.name || '' : validFiles[i].file.name
        })
      } catch (err: any) {
        errorCount++
        console.error(`💥 Upload error for ${item.file.name}:`, err)
        setUploadQueue(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: err.message || 'Upload thất bại' } : f
        ))
      }
    }

    setIsUploading(false)
    setCurrentUploadIndex(-1)
    onUploadingChange?.(false)

    // Update global task status using local counters (not stale closure state)
    updateTask(uploadTaskIdRef.current, {
      status: errorCount > 0 ? 'error' : 'success',
      progress: 100
    })
    if (inputRef.current) inputRef.current.value = ''

    if (successCount === validFiles.length) {
      setTimeout(() => {
        onUploadComplete?.()
      }, 1000)
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFiles(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    await processFiles(files)
  }

  const clearQueue = () => {
    setUploadQueue([])
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => prev.filter((_, idx) => idx !== index))
  }

  const completedCount = uploadQueue.filter(f => f.status === 'success').length
  const errorCount = uploadQueue.filter(f => f.status === 'error').length
  const totalCount = uploadQueue.length

  return (
    <div className="space-y-4">
      {/* Main Upload Area */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200
          ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border'}
          ${isUploading ? 'opacity-90 pointer-events-none' : 'hover:border-primary/60 hover:bg-primary/[0.02]'}
          ${error ? 'border-destructive/50 bg-destructive/5' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false)
          }
        }}
        onDrop={onDrop}
      >
        {isUploading ? (
          <div className="px-8 py-8 text-center">
            {/* Progress UI */}
            <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>

            {/* Network Upload Progress */}
            <div className="text-lg font-medium mb-2">
              Đang tải lên {currentUploadIndex + 1}/{totalCount} file...
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {uploadQueue[currentUploadIndex]?.file.name}
            </div>
            <div className="max-w-xs mx-auto mb-2">
              <Progress value={uploadQueue[currentUploadIndex]?.progress ?? 0} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground">{uploadQueue[currentUploadIndex]?.progress ?? 0}%</div>

          </div>
        ) : uploadQueue.length > 0 ? (
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">
                {completedCount === totalCount ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Hoàn thành {completedCount} file
                  </span>
                ) : (
                  <span>
                    Đã tải: {completedCount}/{totalCount} file
                    {errorCount > 0 && <span className="text-destructive ml-2">({errorCount} lỗi)</span>}
                  </span>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={clearQueue} className="h-8">
                <X className="w-4 h-4 mr-1" />
                Xóa tất cả
              </Button>
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadQueue.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${item.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30' :
                    item.status === 'error' ? 'bg-destructive/10 border-destructive/20' :
                      item.status === 'uploading' ? 'bg-primary/5 border-primary/20' :
                        'bg-muted/30 border-border'
                    }`}
                >
                  {item.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : item.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  ) : item.status === 'uploading' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full flex-shrink-0" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(item.file.size)}
                      {item.error && <span className="text-destructive ml-2">{item.error}</span>}
                      {/* Show Optimized badge if it was optimized? we don't track that easily here without more state, but that's fine */}
                    </div>
                  </div>

                  {item.status !== 'uploading' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromQueue(idx)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload More Button */}
            {completedCount === totalCount && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Tải thêm file
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => onUploadComplete?.()}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Hoàn tất
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-8 py-12 text-center">
            <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-all ${dragOver ? 'bg-primary/20 scale-110' : 'bg-muted/50'
              }`}>
              <Upload className={`w-8 h-8 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground'
                }`} />
            </div>

            <div className="mb-6">
              <div className={`text-lg font-medium mb-2 transition-colors ${dragOver ? 'text-primary' : 'text-foreground'
                }`}>
                {existingFileId ? 'Tải phiên bản mới' : 'Kéo thả tệp tin vào đây'}
              </div>
              <div className="text-sm text-muted-foreground">
                {existingFileId ? 'hoặc nhấn vào nút bên dưới để chọn file' : 'hoặc nhấn vào nút bên dưới để chọn nhiều file'}
              </div>
            </div>

            {/* File Type Hints */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileImage className="w-4 h-4 text-green-500" />
                <span>Hình ảnh</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Video className="w-4 h-4 text-blue-500" />
                <span>Video</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Box className="w-4 h-4 text-purple-500" />
                <span>3D GLB</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-4 flex items-center justify-center font-bold text-red-500 text-[10px] border border-red-500 rounded-[2px]">PDF</div>
                <span>PDF</span>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple={!existingFileId}
              accept="image/*,video/*,.glb,.gltf,.pdf"
              className="hidden"
              aria-label={existingFileId ? 'Chọn file phiên bản mới' : 'Chọn nhiều file để tải lên'}
              onChange={onInputChange}
            />

            <Button
              size="lg"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className={dragOver ? 'bg-primary' : ''}
            >
              <Upload className="w-4 h-4 mr-2" />
              {existingFileId ? 'Chọn phiên bản mới' : 'Chọn tệp tin'}
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-destructive mb-1">Lỗi tải file</div>
            <div className="text-xs text-destructive/80 whitespace-pre-wrap">{error}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setError(null)} className="p-1 h-auto hover:bg-destructive/20">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* File Info */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">
          Hỗ trợ: JPG, PNG, WebP, GIF, MP4, MOV, WebM, GLB, GLTF, PDF • Tối đa {formatFileSize(MAX_SIZE)}
        </div>
      </div>
    </div>
  )
}

