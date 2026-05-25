import { useEffect, useRef } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface DragTooltipProps {
  isActive: boolean
  isOverCard: boolean
}

export function DragTooltip({ isActive, isOverCard }: DragTooltipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation('common')

  useEffect(() => {
    if (!isActive) return

    const handleDragOver = (e: DragEvent) => {
      if (ref.current) {
        // Offset tooltip by 15px down and right from cursor to not block pointer
        const x = e.clientX + 15
        const y = e.clientY + 15

        // Get viewport and tooltip dimensions to prevent overflow
        const tooltipWidth = ref.current.offsetWidth || 240
        const tooltipHeight = ref.current.offsetHeight || 60
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight

        const finalX = x + tooltipWidth > windowWidth ? windowWidth - tooltipWidth - 15 : x
        const finalY = y + tooltipHeight > windowHeight ? windowHeight - tooltipHeight - 15 : y

        ref.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`
      }
    }

    window.addEventListener('dragover', handleDragOver)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 z-[9999] pointer-events-none transition-transform duration-75 ease-out select-none"
      style={{ transform: 'translate3d(-999px, -999px, 0)' }}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200 border-primary/10",
          isOverCard
            ? "bg-emerald-500/90 text-white border-emerald-400/30"
            : "bg-card/90 text-card-foreground border-border/80"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            isOverCard
              ? "bg-white/20 text-white"
              : "bg-primary/10 text-primary"
          )}
        >
          {isOverCard ? (
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          ) : (
            <Upload className="w-4 h-4 animate-bounce" />
          )}
        </div>
        <div className="text-left pr-1">
          <h4 className="text-xs font-bold leading-tight">
            {isOverCard ? t('dragDrop.uploadNewVersion') : t('dragDrop.uploadNewFile')}
          </h4>
          <p
            className={cn(
              "text-[10px] mt-0.5",
              isOverCard ? "text-emerald-100" : "text-muted-foreground"
            )}
          >
            {isOverCard ? t('dragDrop.uploadNewVersionDesc') : t('dragDrop.uploadNewFileDesc')}
          </p>
        </div>
      </div>
    </div>
  )
}
