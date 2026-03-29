import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExternalLinkUploader } from './ExternalLinkUploader'
import { Link2 } from 'lucide-react'

interface ExternalLinkDialogProps {
  projectId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ExternalLinkDialog({ projectId, open, onOpenChange }: ExternalLinkDialogProps) {
  const handleComplete = () => {
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
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
