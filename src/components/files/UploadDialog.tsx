import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUploader } from './FileUploader'
import { SequenceUploader } from './SequenceUploader'
import { useUploadProgressStore } from '@/stores/uploadProgress'
import { Upload, Plus, Film, FileImage } from 'lucide-react'

interface UploadDialogProps {
  projectId: string
  existingFileId?: string
  trigger?: React.ReactNode
  existingFileType?: string
  initialFiles?: File[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTab?: 'single' | 'sequence'
}

export function UploadDialog({ projectId, existingFileId, existingFileType, trigger, initialFiles, open: controlledOpen, onOpenChange: setControlledOpen, defaultTab = 'single' }: UploadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isCurrentlyUploading, setIsCurrentlyUploading] = useState(false)

  const { minimize } = useUploadProgressStore()

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  // Track upload state locally — avoid global storeUploading to prevent cross-dialog race conditions
  const isUploading = isCurrentlyUploading

  // Sync activeTab when defaultTab changes (external control)
  // or reset when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab)
    }
  }, [open, defaultTab])

  const handleUploadComplete = () => {
    setIsCurrentlyUploading(false)
    setOpen(false)
    setActiveTab(defaultTab) // Reset to default
  }

  const handleUploadingChange = useCallback((uploading: boolean) => {
    setIsCurrentlyUploading(uploading)
  }, [])

  const handleMinimize = useCallback(() => {
    minimize({
      projectId,
      existingFileId,
      existingFileType,
      defaultTab: activeTab as 'single' | 'sequence'
    })
    setOpen(false)
  }, [minimize, projectId, existingFileId, existingFileType, activeTab, setOpen])

  // Intercept dialog close: if uploading, minimize instead of close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isUploading) {
      // User is trying to close while uploading → minimize
      handleMinimize()
      return
    }
    setOpen(newOpen)
  }, [isUploading, handleMinimize, setOpen])

  // Handle interact outside (click overlay / press Escape)
  const handleInteractOutside = useCallback((e: Event) => {
    if (isUploading) {
      e.preventDefault()
      handleMinimize()
    }
  }, [isUploading, handleMinimize])

  // Handle Escape key when uploading
  const handleEscapeKeyDown = useCallback((e: Event) => {
    if (isUploading) {
      e.preventDefault()
      handleMinimize()
    }
  }, [isUploading, handleMinimize])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {existingFileId ? 'Tải phiên bản mới' : 'Tải tài liệu lên'}
          </DialogTitle>
        </DialogHeader>

        {!existingFileId && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="gap-2">
                <FileImage className="w-4 h-4" />
                File đơn
              </TabsTrigger>
              <TabsTrigger value="sequence" className="gap-2">
                <Film className="w-4 h-4" />
                Image Sequence
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-4">
              <FileUploader
                projectId={projectId}
                existingFileId={existingFileId}
                onUploadComplete={handleUploadComplete}
                onUploadingChange={handleUploadingChange}
                initialFiles={initialFiles}
              />
            </TabsContent>

            <TabsContent value="sequence" className="mt-4">
              <SequenceUploader
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
                onUploadingChange={handleUploadingChange}
              />
            </TabsContent>
          </Tabs>
        )}

        {existingFileId && (
          <div className="space-y-4">
            {existingFileType === 'sequence' ? (
              <SequenceUploader
                projectId={projectId}
                existingFileId={existingFileId}
                onUploadComplete={handleUploadComplete}
                onUploadingChange={handleUploadingChange}
                initialFiles={initialFiles}
              />
            ) : (
              <FileUploader
                projectId={projectId}
                existingFileId={existingFileId}
                onUploadComplete={handleUploadComplete}
                onUploadingChange={handleUploadingChange}
                initialFiles={initialFiles}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}