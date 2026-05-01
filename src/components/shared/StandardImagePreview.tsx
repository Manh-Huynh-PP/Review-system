import React from 'react'
import { Minus, Plus, RotateCcw, Minimize2, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FramePickOverlay } from '@/components/viewers/FramePickOverlay'
import { useFileStore } from '@/stores/files'

interface Props {
  file: any
  current: any
  effectiveUrl: string
  zoom: number
  panOffset: { x: number; y: number }
  zoomPanBind: any
  renderAnnotationOverlay: () => React.ReactNode
  sequenceFullscreen: any
  sequenceFullscreenRef: React.RefObject<HTMLDivElement | null>
  frameDetailView: number | null
  sequenceContext: any
  reactivePickedFrames: Record<number, boolean>
  isAdmin: boolean
  projectId: string
  handleZoomIn: () => void
  handleZoomOut: () => void
  resetZoomPan: () => void
}

export function StandardImagePreview({
  file,
  current,
  effectiveUrl,
  zoom,
  panOffset,
  zoomPanBind,
  renderAnnotationOverlay,
  sequenceFullscreen,
  sequenceFullscreenRef,
  frameDetailView,
  sequenceContext,
  reactivePickedFrames,
  isAdmin,
  projectId,
  handleZoomIn,
  handleZoomOut,
  resetZoomPan
}: Props) {
  return (
    <div className={`flex flex-col w-full h-full bg-muted/20 relative overflow-hidden ${sequenceFullscreen.isFullscreen ? 'pointer-events-auto' : ''}`} ref={sequenceFullscreenRef as any}>
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
        {/* Unified Controls Toolbar */}
        <div className="absolute top-2 right-2 z-30 bg-background/80 backdrop-blur-sm border border-border/50 rounded-md shadow-sm flex items-center gap-1 p-1">
          {/* Zoom Group */}
          <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomOut} title="Thu nhỏ">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="text-[10px] font-medium text-muted-foreground w-10 text-center select-none">
              {Math.round(zoom * 100)}%
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomIn} title="Phóng to">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[11px]" onClick={resetZoomPan} title="Đặt lại">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>

          {/* Action Group */}
          <div className="flex items-center gap-1">
            {/* Fullscreen Toggle */}
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7" 
              onClick={sequenceFullscreen.toggle} 
              title={sequenceFullscreen.isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {sequenceFullscreen.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {/* Pick Button */}
            {sequenceContext && (
              <>
                <div className="w-px h-4 bg-border mx-0.5" />
                <FramePickOverlay
                  isPicked={!!(reactivePickedFrames[frameDetailView ?? sequenceContext.currentFrameIndex])}
                  onToggle={() => {
                    const targetFrame = frameDetailView ?? sequenceContext.currentFrameIndex
                    useFileStore.getState().togglePickedFrame(
                      projectId,
                      file.id,
                      current.version,
                      targetFrame,
                      !(reactivePickedFrames[targetFrame])
                    )
                  }}
                  isAdminView={isAdmin}
                />
              </>
            )}
          </div>
        </div>

        {/* Scaled content wrapper (image + annotations) */}
        <div
          className={`origin-center w-full h-full flex items-center justify-center ${zoom > 1 ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'}`}
          {...zoomPanBind}
          style={{
            ...zoomPanBind.style,
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            pointerEvents: 'auto'
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={effectiveUrl}
              alt={file.name}
              className="w-full h-full object-contain select-none"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              referrerPolicy="no-referrer"
            />
          </div>

          {renderAnnotationOverlay()}
        </div>

        {/* Sequence Navigation Controls */}
        {sequenceContext && (
          <>
            {/* Frame Counter */}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 rounded-md text-sm font-mono pointer-events-none z-10">
              Frame {sequenceContext.currentFrameIndex + 1} / {sequenceContext.totalFrames}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm border border-border/50 rounded-full"
              onClick={() => sequenceContext.onNavigateFrame?.(Math.max(0, sequenceContext.currentFrameIndex - 1))}
              disabled={sequenceContext.currentFrameIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm border border-border/50 rounded-full"
              onClick={() => sequenceContext.onNavigateFrame?.(Math.min(sequenceContext.totalFrames - 1, sequenceContext.currentFrameIndex + 1))}
              disabled={sequenceContext.currentFrameIndex === sequenceContext.totalFrames - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
