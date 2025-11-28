import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUploader } from './FileUploader'
import { Upload, Plus } from 'lucide-react'

interface UploadDialogProps {
  projectId: string
  existingFileId?: string
  trigger?: React.ReactNode
}

export function UploadDialog({ projectId, existingFileId, trigger }: UploadDialogProps) {
  const [open, setOpen] = useState(false)

  const handleUploadComplete = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            {existingFileId ? (
              <>
                <Plus className="w-4 h-4" />
                Thêm phiên bản
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Tải tài liệu lên
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {existingFileId ? 'Tải phiên bản mới' : 'Tải tài liệu lên'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FileUploader 
            projectId={projectId} 
            existingFileId={existingFileId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}