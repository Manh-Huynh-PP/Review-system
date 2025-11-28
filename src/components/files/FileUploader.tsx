import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useFileStore } from '@/stores/files'
import { formatFileSize } from '@/lib/utils'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploaderProps {
  projectId: string
  existingFileId?: string
}

const MAX_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png', 
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'model/gltf-binary': '.glb',
  'model/gltf+json': '.gltf'
}

export function FileUploader({ projectId, existingFileId }: FileUploaderProps) {
  const { uploadFile, uploading } = useFileStore()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_SIZE) {
      return `File quá lớn (${formatFileSize(file.size)}). Tối đa ${formatFileSize(MAX_SIZE)}.`
    }
    
    // Check file type
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      const allowedExts = Object.values(ALLOWED_TYPES).join(', ')
      return `Định dạng không hỗ trợ. Chỉ chấp nhận: ${allowedExts}`
    }
    
    return null
  }

  const onSelect = async (file?: File) => {
    if (!file) return
    
    console.log('📂 File selected:', { name: file.name, size: file.size, type: file.type })
    
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      console.warn('⚠️ Validation failed:', validationError)
      setError(validationError)
      return
    }
    
    setSelectedFile(file)
    
    try {
      console.log('🎯 Starting upload process...')
      await uploadFile(projectId, file, existingFileId)
      console.log('🎉 Upload completed successfully')
      setSelectedFile(null)
      setError(null)
      // Clear input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('💥 Upload error caught:', err)
      const errorMsg = err.message || 'Upload thất bại'
      setError(errorMsg)
      setSelectedFile(null)
      // Clear input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    await onSelect(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    await onSelect(file)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div
        className={`
          rounded-lg border-2 border-dashed p-4 transition-all
          ${dragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}
          ${uploading ? 'opacity-60 pointer-events-none' : 'hover:border-primary/50'}
          ${error ? 'border-destructive/50 bg-destructive/5' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => {
          // Only clear drag state if we're leaving the entire drop zone
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false)
          }
        }}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm">Đang tải lên {selectedFile?.name}...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Upload className={`w-4 h-4 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-sm">
                {existingFileId ? (
                  <span className={dragOver ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    Thả file để tải phiên bản mới
                  </span>
                ) : (
                  <span className={dragOver ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    Kéo thả file vào đây hoặc nhấn chọn
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*,.glb,.gltf"
                className="hidden"
                aria-label={existingFileId ? 'Chọn file phiên bản mới' : 'Chọn file để tải lên'}
                title={existingFileId ? 'Chọn file phiên bản mới' : 'Chọn file để tải lên'}
                onChange={onInputChange}
              />
              <Button 
                size="sm" 
                variant={dragOver ? 'default' : 'outline'}
                onClick={() => inputRef.current?.click()} 
                disabled={uploading}
              >
                {existingFileId ? 'Phiên bản mới' : 'Chọn file'}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="text-sm text-destructive">{error}</div>
          <Button size="sm" variant="ghost" onClick={clearSelection} className="ml-auto p-1 h-auto">
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      {/* Success state */}
      {!uploading && !error && selectedFile && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Tải lên thành công: {selectedFile.name}</span>
        </div>
      )}
      
      {/* File type hint */}
      <div className="text-xs text-muted-foreground">
        Hỗ trợ: JPG, PNG, WebP, MP4, MOV, GLB • Tối đa {formatFileSize(MAX_SIZE)}
      </div>
    </div>
  )
}
