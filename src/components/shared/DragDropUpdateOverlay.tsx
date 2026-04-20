import { Upload } from 'lucide-react'

interface DragDropUpdateOverlayProps {
  isDragOver: boolean
}

/**
 * Overlay component displayed when a user drags a file over the dialog to upload a new version.
 * Separated for performance and code clarity.
 */
export function DragDropUpdateOverlay({ isDragOver }: DragDropUpdateOverlayProps) {
  if (!isDragOver) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-primary border-dashed rounded-lg m-4 pointer-events-none">
      <div className="bg-primary/10 p-8 rounded-full mb-6 animate-bounce">
        <Upload className="w-16 h-16 text-primary" />
      </div>
      <h3 className="text-3xl font-bold text-primary mb-2">
        Thả file để cập nhật phiên bản mới
      </h3>
      <p className="text-lg text-muted-foreground">
        Phiên bản mới sẽ được thêm vào lịch sử phiên bản của file này
      </p>
    </div>
  )
}
