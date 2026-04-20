import { Columns, ChevronDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'

interface Props {
  uniqueVersions: any[]
  currentVersion: number
  resolvedUrl?: string
  sequenceContext: any

  leftVersion: number | null
  rightVersion: number | null
  setLeftVersion: (v: number) => void
  setRightVersion: (v: number) => void

  compareDisplayMode: 'side-by-side' | 'slider'
  setCompareDisplayMode: (mode: 'side-by-side' | 'slider') => void
  
  comparePosition: number
  setComparePosition: (pos: number) => void

  zoomPanBind: any
  zoom: number
  panOffset: { x: number, y: number }
  handleZoomIn: () => void
  handleZoomOut: () => void
  resetZoomPan: () => void
}

export function ImageCompareMode({
  uniqueVersions,
  currentVersion,
  resolvedUrl,
  sequenceContext,
  leftVersion,
  rightVersion,
  setLeftVersion,
  setRightVersion,
  compareDisplayMode,
  setCompareDisplayMode,
  comparePosition,
  setComparePosition,
  zoomPanBind,
  zoom,
  panOffset,
  handleZoomIn,
  handleZoomOut,
  resetZoomPan
}: Props) {
  const lv = leftVersion || currentVersion
  const rv = rightVersion || (uniqueVersions.length > 1 ? uniqueVersions[1].version : currentVersion)

  const findUrl = (vnum: number | null) => {
    if (!vnum) return undefined
    // Special handling for sequence frames
    if (sequenceContext) {
      const vv = uniqueVersions.find((v: any) => v.version === vnum)
      return vv?.sequenceUrls?.[sequenceContext.currentFrameIndex]
    }
    if (vnum === currentVersion && resolvedUrl) return resolvedUrl
    const vv = uniqueVersions.find((v: any) => v.version === vnum)
    return vv?.url
  }

  const leftUrl = findUrl(lv)
  const rightUrl = findUrl(rv)

  return (
    <div
      className="p-2 w-full h-full overflow-hidden relative"
      {...zoomPanBind}
    >
      {/* Mode switch */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs text-muted-foreground mr-2">Chế độ:</div>
        <Button variant={compareDisplayMode === 'side-by-side' ? 'secondary' : 'outline'} size="sm" onClick={() => setCompareDisplayMode('side-by-side')}>
          <Columns className="w-4 h-4 mr-1" /> Side-by-side
        </Button>
        <Button variant={compareDisplayMode === 'slider' ? 'secondary' : 'outline'} size="sm" onClick={() => setCompareDisplayMode('slider')}>
          <Columns className="w-4 h-4 mr-1" /> Slider
        </Button>

        {/* Frame Counter in Toolbar */}
        {sequenceContext && (
          <div className="ml-auto bg-muted px-3 py-1.5 rounded-md text-sm font-mono border">
            Frame {sequenceContext.currentFrameIndex + 1} / {sequenceContext.totalFrames}
          </div>
        )}
      </div>

      {compareDisplayMode === 'side-by-side' ? (
        <div className="flex gap-2">
          {/* Left column */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">So sánh - Bên trái</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">v{lv}<ChevronDown className="w-3 h-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {uniqueVersions
                    .map((v: any) => (
                      <DropdownMenuItem key={v.version} onClick={() => setLeftVersion(v.version)}>
                        v{v.version}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 bg-muted/20 flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  pointerEvents: zoom > 1 ? 'auto' : 'none'
                }}
              >
                {leftUrl ? (
                  <img
                    src={leftUrl}
                    alt={`v${lv}`}
                    className="w-full h-full object-contain select-none shadow-none"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Không có ảnh</div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">Bên phải</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">v{rv}<ChevronDown className="w-3 h-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {uniqueVersions
                    .map((v: any) => (
                      <DropdownMenuItem key={v.version} onClick={() => setRightVersion(v.version)}>
                        v{v.version}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 bg-muted/20 flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  pointerEvents: zoom > 1 ? 'auto' : 'none'
                }}
              >
                {rightUrl ? (
                  <img
                    src={rightUrl}
                    alt={`v${rv}`}
                    className="w-full h-full object-contain select-none shadow-none"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Không có ảnh</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Slider overlay mode using react-compare-slider
        <div className="p-2">
          <div
            className="max-h-[70vh] origin-center cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              pointerEvents: zoom > 1 ? 'auto' : 'none'
            }}
          >
            {leftUrl && rightUrl ? (
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={leftUrl} alt={`v${lv}`} draggable={false} className="select-none" onDragStart={(e: any) => e.preventDefault()} />}
                itemTwo={<ReactCompareSliderImage src={rightUrl} alt={`v${rv}`} draggable={false} className="select-none" onDragStart={(e: any) => e.preventDefault()} />}
                position={comparePosition}
                onPositionChange={(p: number) => setComparePosition(p)}
              />
            ) : (
              <div className="flex items-center justify-center h-[62vh] bg-muted/20">
                <div className="text-sm text-muted-foreground">Không có ảnh để so sánh</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom Controls for Compare Mode */}
      <div className="absolute top-12 right-2 z-20 bg-background/80 backdrop-blur-sm border border-border/50 rounded-md shadow-sm flex items-center gap-1 p-1 pointer-events-auto">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <div className="text-xs font-medium w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetZoomPan} disabled={zoom === 1 && panOffset.x === 0 && panOffset.y === 0}>
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
