import { useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExternalLinkUploader } from './ExternalLinkUploader'
import { Link2 } from 'lucide-react'
import { useFileStore } from '@/stores/files'
import { useUploadProgressStore } from '@/stores/uploadProgress'

interface ExternalLinkDialogProps {
  projectId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ExternalLinkDialog({ projectId, open, onOpenChange }: ExternalLinkDialogProps) {
  const { uploading } = useFileStore()
  const { minimize } = useUploadProgressStore()

  const handleMinimize = useCallback(() => {
    minimize({ projectId, defaultTab: 'single' })
    onOpenChange?.(false)
  }, [minimize, projectId, onOpenChange])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && uploading) {
      handleMinimize()
      return
    }
    onOpenChange?.(newOpen)
  }, [uploading, handleMinimize, onOpenChange])

  const handleInteractOutside = useCallback((e: Event) => {
    if (uploading) {
      e.preventDefault()
      handleMinimize()
    }
  }, [uploading, handleMinimize])

  const handleEscapeKeyDown = useCallback((e: Event) => {
    if (uploading) {
      e.preventDefault()
      handleMinimize()
    }
  }, [uploading, handleMinimize])

  const handleComplete = () => {
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-xl"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-500" />
            Thêm Link (Ảnh, Video, PDF, Google Drive)
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <ExternalLinkUploader 
            projectId={projectId} 
            onUploadComplete={handleComplete} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
