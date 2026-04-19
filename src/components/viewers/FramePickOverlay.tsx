import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FramePickOverlayProps {
  isPicked: boolean
  onToggle: (e: React.MouseEvent) => void
  isAdminView?: boolean
}

export function FramePickOverlay({ isPicked, onToggle, isAdminView = false }: FramePickOverlayProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 transition-all duration-300 ${
        isPicked 
          ? 'text-rose-500 hover:text-rose-600 scale-110' 
          : 'text-gray-400 hover:text-rose-400 scale-100'
      } ${isAdminView && !isPicked ? 'opacity-20 group-hover:opacity-100' : 'opacity-100'}`}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(e)
      }}
      title={isPicked ? "Bỏ chọn" : "Chọn ảnh này"}
    >
      <Heart className={`h-4.5 w-4.5 ${isPicked ? 'fill-current' : ''}`} />
    </Button>
  )
}
