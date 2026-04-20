import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Film,
  Grid3x3,
  Images,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Edit2,
  GripVertical,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Repeat,
  Trash2,
  Settings,
  Loader2,
  Minimize2
} from 'lucide-react'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { linkifyText } from '@/lib/linkify'
import { useZoomPan } from '@/hooks/useZoomPan'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useSequenceScrubber } from '@/hooks/useSequenceScrubber'
import { AnnotationCanvasKonva } from '@/components/annotations/AnnotationCanvasKonva'
import { AnnotationToolbar } from '@/components/annotations/AnnotationToolbar'
import type { AnnotationObject } from '@/types'
import { normalizeDriveUrl } from '@/utils/googleDrive'

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ImageSequenceViewerProps {
  urls: string[]
  fps?: number
  onFrameChange?: (frame: number) => void
  defaultViewMode?: 'video' | 'carousel' | 'grid'
  isAdmin?: boolean
  onViewModeChange?: (mode: 'video' | 'carousel' | 'grid') => void
  currentFrame?: number
  className?: string
  frameCaptions?: Record<number, string>
  onCaptionChange?: (fileId: string, version: number, frame: number, caption: string) => void
  file: { id: string; currentVersion: number }
  // Annotation props
  isAnnotating?: boolean
  annotationData?: AnnotationObject[] | null
  annotationTool?: 'pen' | 'rect' | 'arrow' | 'select' | 'eraser'
  annotationColor?: string
  annotationStrokeWidth?: number
  isAnnotationReadOnly?: boolean
  onAnnotationChange?: (data: AnnotationObject[] | null) => void
  onAnnotationUndo?: () => void
  onAnnotationRedo?: () => void
  onClearAnnotations?: () => void
  onDoneAnnotating?: () => void
  canUndoAnnotation?: boolean
  canRedoAnnotation?: boolean
  onStartAnnotating?: (frame: number) => void
  // Grid frame detail view
  onFrameDetailView?: (frameIndex: number) => void
  // Grid edit mode callbacks (admin only)
  onReorderFrames?: (newOrder: number[]) => void
  onDeleteFrames?: (indices: number[]) => void
  onAddFrames?: (files: File[]) => void
  isUploading?: boolean
  renderFrameOverlay?: (frameIndex: number) => React.ReactNode
  externalIsFullscreen?: boolean
  onToggleFullscreen?: () => void
  externalFullscreenRef?: React.RefObject<HTMLDivElement | null>
}

type ViewMode = 'video' | 'carousel' | 'grid'

export function ImageSequenceViewer({
  urls,
  fps = 24,
  onFrameChange,
  defaultViewMode = 'video',
  isAdmin = false,
  onViewModeChange,
  currentFrame: externalCurrentFrame,
  className,
  frameCaptions = {},
  onCaptionChange,
  file,
  // Annotation props with defaults
  isAnnotating = false,
  annotationData = null,
  annotationTool = 'pen',
  annotationColor = '#ffff00',
  annotationStrokeWidth = 2,
  isAnnotationReadOnly = false,
  onAnnotationChange,
  onAnnotationUndo,
  onAnnotationRedo,
  onClearAnnotations,
  onDoneAnnotating,
  canUndoAnnotation = false,
  canRedoAnnotation = false,
  onStartAnnotating: _onStartAnnotating,
  onFrameDetailView,
  // Grid edit mode callbacks
  onReorderFrames,
  onDeleteFrames,
  onAddFrames,
  isUploading = false,
  renderFrameOverlay,
  externalIsFullscreen,
  onToggleFullscreen,
  externalFullscreenRef
}: ImageSequenceViewerProps) {
  const { t } = useTranslation()
  const [currentFrame, setCurrentFrame] = useState(externalCurrentFrame !== undefined ? externalCurrentFrame : 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(true)
  const {
    zoom,
    panOffset,
    bind: zoomPanBind,
    reset: resetZoomPan,
    handleZoomIn,
    handleZoomOut
  } = useZoomPan({ maxZoom: 4 })

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode || 'video')
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  // Normalize URLs at the component level to handle legacy 'uc' links
  const normalizedUrls = useMemo(() => {
    return urls.map(url => normalizeDriveUrl(url))
  }, [urls])

  const frameCount = normalizedUrls.length

  // Ref to track viewMode for tick callback
  const viewModeRef = useRef(viewMode)
  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Grid edit mode state (admin only)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(new Set())
  const [frameOrder, setFrameOrder] = useState<number[]>(() => urls.map((_, i) => i))

  // Update frame order when urls change
  useEffect(() => {
    setFrameOrder(urls.map((_, i) => i))
    setSelectedForDelete(new Set())
  }, [urls])

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFrameOrder((items) => {
        const oldIndex = items.indexOf(active.id as number)
        const newIndex = items.indexOf(over.id as number)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        onReorderFrames?.(newOrder)
        return newOrder
      })
    }
  }, [onReorderFrames])

  // Handle delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedForDelete.size > 0) {
      onDeleteFrames?.(Array.from(selectedForDelete))
      setSelectedForDelete(new Set())
    }
  }, [selectedForDelete, onDeleteFrames])

  // Toggle frame selection for delete
  const toggleFrameSelection = useCallback((index: number) => {
    setSelectedForDelete(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  // Refs for fast-image-sequence
  const sequenceContainerRef = useRef<HTMLDivElement>(null)
  const sequenceRef = useRef<any>(null)
  const isSequenceReady = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddFramesClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onAddFrames?.(Array.from(files))
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Sync with external currentFrame if provided
  useEffect(() => {
    if (externalCurrentFrame !== undefined) {
      setCurrentFrame(externalCurrentFrame)
    }
  }, [externalCurrentFrame])

  // Preload images in small batches with retry to avoid Google Drive rate-limiting (429)
  useEffect(() => {
    setImagesLoaded(false)
    setLoadedCount(0)
    let cancelled = false

    /**
     * Load a single image with retry + exponential backoff.
     * Google Drive returns 429 when too many requests are sent simultaneously.
     */
    const loadImageWithRetry = (url: string, maxRetries = 3): Promise<void> => {
      return new Promise<void>((resolve) => {
        let attempt = 0

        const tryLoad = () => {
          if (cancelled) { resolve(); return }
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => {
            attempt++
            if (attempt < maxRetries && !cancelled) {
              // Exponential backoff: 1s, 2s, 4s
              const delay = Math.pow(2, attempt - 1) * 1000
              setTimeout(tryLoad, delay)
            } else {
              resolve() // Give up after max retries, don't block the rest
            }
          }
          img.src = url
        }

        tryLoad()
      })
    }

    /**
     * Process URLs in batches to avoid triggering Google rate limits.
     * BATCH_SIZE of 3 keeps us well under Google's threshold.
     */
    const BATCH_SIZE = 3
    const loadAllBatched = async () => {
      let loadCount = 0
      for (let i = 0; i < normalizedUrls.length; i += BATCH_SIZE) {
        if (cancelled) return
        const batch = normalizedUrls.slice(i, i + BATCH_SIZE)
        await Promise.all(batch.map(url => loadImageWithRetry(url)))
        loadCount += batch.length
        if (!cancelled) setLoadedCount(loadCount)
      }
      if (!cancelled) setImagesLoaded(true)
    }

    loadAllBatched()
    return () => { cancelled = true }
  }, [normalizedUrls])

  // Initialize fast-image-sequence
  useEffect(() => {
    if (viewMode !== 'video' || !sequenceContainerRef.current || frameCount === 0) {
      return
    }

    let active = true
    const container = sequenceContainerRef.current

    const initSequence = async () => {
      try {
        const { FastImageSequence } = await import('@mediamonks/fast-image-sequence')

        if (!active || !container) return

        // Pre-clear container - important for React re-renders
        container.innerHTML = ''

        const sequence = new FastImageSequence(container, {
          frames: frameCount,
          src: {
            imageURL: (index: number) => normalizedUrls[index] || normalizedUrls[0],
          },
          loop: isLooping,
          objectFit: 'contain',
          clearCanvas: true, // Crucial for transparent PNGs to prevent ghosting/accumulation
        })

        // Immediate check if we should stop before setting refs
        if (!active) {
          if (typeof sequence.destruct === 'function') {
            sequence.destruct()
          } else {
            sequence.stop()
          }
          container.innerHTML = ''
          return
        }

        // Assign to both local (for closure) and ref (for external access)
        sequenceRef.current = sequence
        isSequenceReady.current = true

        // Register tick callback
        sequence.tick(() => {
          if (!active || !sequenceRef.current) return
          // Use ref value to read current mode safely in closure
          if (viewModeRef.current !== 'video') return
          
          const progress = sequence.progress
          const frame = Math.round(progress * (frameCount - 1))
          setCurrentFrame(frame)
        })
      } catch (error) {
        console.error('Error initializing FastImageSequence:', error)
      }
    }

    initSequence()

    return () => {
      active = false
      if (sequenceRef.current) {
        try {
          if (typeof sequenceRef.current.destruct === 'function') {
            sequenceRef.current.destruct()
          } else {
            sequenceRef.current.stop()
          }
        } catch (e) {}
        sequenceRef.current = null
      }
      isSequenceReady.current = false
      
      // Force clear the DOM on unmount/re-run
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [viewMode, frameCount, normalizedUrls, isLooping])

  // Handle play/pause with library
  useEffect(() => {
    const sequence = sequenceRef.current
    if (!sequence || !isSequenceReady.current) return

    if (isPlaying && viewMode === 'video' && imagesLoaded) {
      sequence.play(fps)
    } else {
      sequence.stop()
    }
  }, [isPlaying, viewMode, imagesLoaded, fps])

  // Sync frame to library when changed externally (only in video mode)
  useEffect(() => {
    const sequence = sequenceRef.current
    if (!sequence || !isSequenceReady.current || isPlaying || viewMode !== 'video') return

    sequence.progress = currentFrame / (frameCount - 1)
  }, [currentFrame, frameCount, isPlaying, viewMode])

  // Notify parent of frame changes
  useEffect(() => {
    onFrameChange?.(currentFrame)
  }, [currentFrame, onFrameChange])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleFrameChange = (value: number[]) => {
    const newFrame = value[0]
    setCurrentFrame(newFrame)
    onFrameChange?.(newFrame)
  }

  const handleNextFrame = () => {
    const next = Math.min(currentFrame + 1, frameCount - 1)
    setCurrentFrame(next)
    onFrameChange?.(next)
  }

  const handlePrevFrame = () => {
    const prev = Math.max(currentFrame - 1, 0)
    setCurrentFrame(prev)
    onFrameChange?.(prev)
  }

  const handleFirstFrame = () => {
    setCurrentFrame(0)
    onFrameChange?.(0)
  }

  const handleLastFrame = () => {
    setCurrentFrame(frameCount - 1)
    onFrameChange?.(frameCount - 1)
  }

  const handleViewModeChange = (newMode: string) => {
    if (newMode) {
      const mode = newMode as ViewMode
      setViewMode(mode)
      onViewModeChange?.(mode)
    }
  }


  // Fullscreen & Scrubbing Hooks
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const viewerFullRefInternal = useRef<HTMLDivElement>(null)
  const viewerFullRef = externalFullscreenRef || viewerFullRefInternal
  const internalFullscreen = useFullscreen(viewerFullRef)

  // Use external fullscreen state/toggle if provided, otherwise fallback to internal
  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalFullscreen.isFullscreen
  const toggleFullscreen = onToggleFullscreen !== undefined ? onToggleFullscreen : internalFullscreen.toggle

  // Auto-exit fullscreen when switching to grid mode
  useEffect(() => {
    if (viewMode === 'grid' && isFullscreen) {
      toggleFullscreen()
    }
  }, [viewMode, isFullscreen, toggleFullscreen])

  const { isScrubbing, bind: bindScrub } = useSequenceScrubber({
    totalFrames: frameCount,
    currentFrame,
    containerRef: imageContainerRef,
    onFrameChange: (frame) => {
      setCurrentFrame(frame)
      onFrameChange?.(frame)
    },
    disabled: viewMode === 'grid' || zoom > 1
  })

  // Start scrubbing effect: pause playback
  useEffect(() => {
    if (isScrubbing && isPlaying) {
      setIsPlaying(false)
    }
  }, [isScrubbing, isPlaying])

  // Sync view mode if prop changes (e.g. from parent)
  useEffect(() => {
    if (defaultViewMode) {
      setViewMode(defaultViewMode)
    }
  }, [defaultViewMode])

  return (
    <div 
      ref={viewerFullRef}
      className={`flex flex-col h-full w-full relative overflow-hidden ${isFullscreen ? 'bg-background' : ''} ${className || ''}`}
    >
      {/* View Mode Toggle & Global Controls Header */}
      <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-30 border-b border-border/50">
        {isAdmin ? (
          <ToggleGroup id="grid-toggle" type="single" value={viewMode} onValueChange={handleViewModeChange}>
            <ToggleGroupItem value="video" aria-label={t('fileView:sequence.modes.video')} className="gap-2">
              <Film className="w-4 h-4" />
              <span className="text-xs">{t('fileView:sequence.modes.video')}</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="carousel" aria-label={t('fileView:sequence.modes.carousel')} className="gap-2">
              <Images className="w-4 h-4" />
              <span className="text-xs">{t('fileView:sequence.modes.carousel')}</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label={t('fileView:sequence.modes.grid')} className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              <span className="text-xs">{t('fileView:sequence.modes.grid')}</span>
            </ToggleGroupItem>
          </ToggleGroup>
        ) : (
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                {viewMode === 'video' ? (
                  <>
                    <Film className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('fileView:sequence.modes.video')}</span>
                  </>
                ) : viewMode === 'carousel' ? (
                  <>
                    <Images className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('fileView:sequence.modes.carousel')}</span>
                  </>
                ) : (
                  <>
                    <Grid3x3 className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('fileView:sequence.modes.grid')}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {viewMode === 'video' ? t('fileView:sequence.modeDesc.video') : viewMode === 'carousel' ? t('fileView:sequence.modeDesc.carousel') : t('fileView:sequence.modeDesc.grid')}
          </div>

          {/* Fullscreen Button in Header (Only when not fullscreen AND not in grid mode) */}
          {!isFullscreen && viewMode !== 'grid' && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 hover:bg-muted" 
              onClick={toggleFullscreen} 
              title={t('fileView:toolbar.fullscreen', 'Toàn màn hình')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Image Display - Hide in Grid Mode */}
      {viewMode !== 'grid' && (
        <div
          ref={imageContainerRef}
          className={`relative viewport flex-1 min-h-0 flex items-center justify-center ${isFullscreen ? 'max-h-none' : 'max-h-[calc(100dvh-16rem)] 2xl:max-h-[calc(100dvh-20rem)]'} ${zoom > 1 ? 'cursor-move' : isScrubbing ? 'cursor-grabbing' : 'cursor-grab'}`}
          id="sequence-image-container"
          {...bindScrub}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >

          {/* Zoomed Content Wrapper */}
          <div
            className="w-full h-full flex items-center justify-center origin-center"
            {...zoomPanBind}
            style={{
              ...zoomPanBind.style,
              transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              pointerEvents: zoom > 1 ? 'auto' : 'none'
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Fast Image Sequence Canvas - Video Mode Only */}
              {viewMode === 'video' && (
                <div
                  key={`sequence-video-${urls[0] || 'default'}-${frameCount}`}
                  ref={sequenceContainerRef}
                  className="w-full h-full max-h-[55dvh] xl:max-h-[50dvh] 2xl:max-h-[45dvh]"
                  style={{ position: 'relative' }}
                />
              )}

              {/* Regular Image - Carousel Mode */}
              {viewMode === 'carousel' && (
                <img
                  src={normalizedUrls[currentFrame]}
                  alt={`Frame ${currentFrame + 1}`}
                  className="w-full h-full object-contain max-h-[55dvh] xl:max-h-[50dvh] 2xl:max-h-[45dvh] select-none"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              )}
            </div>

            {/* Annotation overlay moved inside zoomed container */}
            {isAnnotating && (
              <AnnotationCanvasKonva
                mode={isAnnotationReadOnly ? 'read' : 'edit'}
                data={annotationData || []}
                tool={annotationTool}
                color={annotationColor}
                strokeWidth={annotationStrokeWidth}
                onChange={(data) => !isAnnotationReadOnly && onAnnotationChange?.(data)}
                onUndo={onAnnotationUndo}
                onRedo={onAnnotationRedo}
              />
            )}
          </div>

          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border border-border/50 px-3 py-1.5 rounded-md text-sm font-mono pointer-events-none z-10">
            {t('fileView:sequence.frame')} {currentFrame + 1} / {frameCount}
          </div>

          {/* Scrubbing indicator */}
          {isScrubbing && zoom === 1 && (
            <div className="absolute top-4 right-16 bg-primary/90 backdrop-blur-sm border border-primary px-3 py-1.5 rounded-md text-sm font-medium pointer-events-none z-10 text-primary-foreground">
              {t('fileView:sequence.scrubbing')}
            </div>
          )}

          {/* Annotation Toolbar - remains outside zoomed container */}
          {isAnnotating && !isAnnotationReadOnly && (
            <AnnotationToolbar
              tool={annotationTool}
              onToolChange={() => { }}
              color={annotationColor}
              onColorChange={() => { }}
              strokeWidth={annotationStrokeWidth}
              onStrokeWidthChange={() => { }}
              onUndo={onAnnotationUndo || (() => { })}
              onRedo={onAnnotationRedo || (() => { })}
              onClear={onClearAnnotations || (() => { })}
              onDone={onDoneAnnotating || (() => { })}
              canUndo={canUndoAnnotation}
              canRedo={canRedoAnnotation}
            />
          )}
        </div>
      )}

      {viewMode === 'video' ? (
        /* Video Mode Controls */
        <div className="space-y-3 px-4 flex-shrink-0 bg-background/95 backdrop-blur-sm border-t">
          {/* Loading indicator */}
          {!imagesLoaded && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
              <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              <span>{t('fileView:sequence.loading', { loaded: loadedCount, total: frameCount })}</span>
            </div>
          )}

          {/* Timeline Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono w-12 text-right">
              {String(currentFrame + 1).padStart(3, '0')}
            </span>
            <Slider
              value={[currentFrame]}
              min={0}
              max={frameCount - 1}
              step={1}
              onValueChange={handleFrameChange}
              className="flex-1"
              disabled={!imagesLoaded}
            />
            <span className="text-xs text-muted-foreground font-mono w-12">
              {String(frameCount).padStart(3, '0')}
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirstFrame}
              disabled={currentFrame === 0 || !imagesLoaded}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevFrame}
              disabled={currentFrame === 0 || !imagesLoaded}
            >
              <SkipBack className="w-3 h-3" />
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={handlePlayPause}
              className="px-6"
              disabled={!imagesLoaded}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextFrame}
              disabled={currentFrame === frameCount - 1 || !imagesLoaded}
            >
              <SkipForward className="w-3 h-3" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLastFrame}
              disabled={currentFrame === frameCount - 1 || !imagesLoaded}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-2" />

            <Button
              variant={isLooping ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLooping(!isLooping)}
              title={t('fileView:toolbar.loop', 'Loop')}
              disabled={!imagesLoaded}
            >
              <Repeat className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-muted-foreground">{t('fileView:video.speed')}:</span>
              <span className="text-sm font-mono font-medium">{fps}</span>
            </div>
          </div>
        </div>
      ) : viewMode === 'carousel' ? (
        /* Carousel Mode Controls */
        <div className="space-y-3 px-4 flex-shrink-0 bg-background/95 backdrop-blur-sm border-t">
          {/* Info Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
            <span>{t('fileView:sequence.totalFrames')}: {frameCount}</span>
            <span>{t('fileView:sequence.navigationHint')}</span>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-muted/20 rounded-lg">
            {urls.map((url, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentFrame(index)
                  onFrameChange?.(index)
                }}
                className={`relative aspect-square rounded overflow-hidden border-2 transition-all hover:scale-105 ${currentFrame === index
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-primary/50'
                  }`}
              >
                <img
                  src={url}
                  alt={`Thumb ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${currentFrame === index ? 'bg-background/60' : 'bg-background/80'
                  }`}>
                  <span className={`text-xs font-mono font-medium ${currentFrame === index ? 'text-primary' : 'text-foreground'
                    }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleFirstFrame}
              disabled={currentFrame === 0}
              className="flex-1"
            >
              <SkipBack className="w-4 h-4 mr-2" />
              {t('fileView:toolbar.first')}
            </Button>

            <Button
              variant="outline"
              onClick={handlePrevFrame}
              disabled={currentFrame === 0}
              className="flex-1"
            >
              <SkipBack className="w-3 h-3 mr-2" />
              {t('fileView:toolbar.previous')}
            </Button>

            <div className="px-4 py-2 bg-muted rounded-md font-mono text-sm min-w-[100px] text-center">
              {currentFrame + 1} / {frameCount}
            </div>

            <Button
              variant="outline"
              onClick={handleNextFrame}
              disabled={currentFrame === frameCount - 1}
              className="flex-1"
            >
              {t('fileView:toolbar.next')}
              <SkipForward className="w-3 h-3 ml-2" />
            </Button>

            <Button
              variant="outline"
              onClick={handleLastFrame}
              disabled={currentFrame === frameCount - 1}
              className="flex-1"
            >
              {t('fileView:toolbar.last')}
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        /* Grid Mode */
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 relative viewport">
          {/* Edit Mode Toggle (Admin only) - Sub-header */}
          {isAdmin && (
            <div className="flex items-center justify-between mb-4 sticky top-[3.5rem] bg-background/95 backdrop-blur-sm py-2 z-20">
              <div className="flex items-center gap-2">
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsEditMode(!isEditMode)
                    setSelectedForDelete(new Set())
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isEditMode ? t('fileView:toolbar.exitEdit') : t('fileView:toolbar.edit')}
                </Button>
                {isEditMode && (
                  <span className="text-xs text-muted-foreground">
                    {t('fileView:toolbar.reorderHint')} • {t('fileView:toolbar.deleteHint')}
                  </span>
                )}
              </div>
              {isEditMode && selectedForDelete.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('fileView:toolbar.deleteCount', { count: selectedForDelete.size })}
                </Button>
              )}
              {isEditMode && selectedForDelete.size === 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddFramesClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('fileView:toolbar.loading')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('fileView:toolbar.addFrames')}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />

          {/* Grid Layout with DnD */}
          {isEditMode && isAdmin ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={frameOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 w-full">
                  {frameOrder.map((originalIndex) => (
                    <SortableGridFrameCard
                      key={originalIndex}
                      id={originalIndex}
                      url={normalizedUrls[originalIndex]}
                      frameNumber={originalIndex}
                      frameCount={frameCount}
                      caption={frameCaptions[originalIndex]}
                      isSelected={currentFrame === originalIndex}
                      isSelectedForDelete={selectedForDelete.has(originalIndex)}
                      isAdmin={isAdmin}
                      isEditMode={true}
                      onSelect={() => {
                        setCurrentFrame(originalIndex)
                        onFrameChange?.(originalIndex)
                      }}
                      onViewDetail={() => {
                        onFrameDetailView?.(originalIndex)
                      }}
                      onCaptionChange={(caption) => onCaptionChange?.(file.id, file.currentVersion, originalIndex, caption)}
                      onToggleDelete={() => toggleFrameSelection(originalIndex)}
                      renderOverlay={renderFrameOverlay}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 w-full">
              {normalizedUrls.map((url, index) => (
                <GridFrameCard
                  key={index}
                  url={url}
                  frameNumber={index}
                  frameCount={frameCount}
                  caption={frameCaptions[index]}
                  isSelected={currentFrame === index}
                  isAdmin={isAdmin}
                  onSelect={() => {
                    setCurrentFrame(index)
                    onFrameChange?.(index)
                  }}
                  onViewDetail={() => {
                    onFrameDetailView?.(index)
                  }}
                  onCaptionChange={(caption) => onCaptionChange?.(file.id, file.currentVersion, index, caption)}
                  renderOverlay={renderFrameOverlay}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Controls (Only when fullscreen) */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-[70] bg-background/80 backdrop-blur-sm border border-border/50 rounded-md shadow-sm flex items-center gap-1 p-1">
          {viewMode !== 'grid' && (
            <>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomOut} title="Thu nhỏ">
                <Minus className="h-3 w-3" />
              </Button>
              <div className="text-xs text-muted-foreground w-10 text-center select-none">{Math.round(zoom * 100)}%</div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomIn} title="Phóng to">
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={resetZoomPan}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={toggleFullscreen} title="Thoát toàn màn hình">
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Grid Frame Card Component
function GridFrameCard({
  url,
  frameNumber,
  frameCount,
  caption,
  isSelected,
  isAdmin,
  onSelect,
  onViewDetail,
  onCaptionChange,
  renderOverlay
}: {
  url: string
  frameNumber: number
  frameCount: number
  caption?: string
  isSelected: boolean
  isAdmin: boolean
  onSelect: () => void
  onViewDetail: () => void
  onCaptionChange?: (caption: string) => void
  renderOverlay?: (frameIndex: number) => React.ReactNode
}) {
  const { t } = useTranslation()
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [editedCaption, setEditedCaption] = useState(caption || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditingCaption && textareaRef.current) {
      textareaRef.current.focus()
      // adjust height
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditingCaption])

  const handleSaveCaption = () => {
    if (editedCaption !== caption) {
      onCaptionChange?.(editedCaption)
    }
    setIsEditingCaption(false)
  }

  const handleCancelEdit = () => {
    setEditedCaption(caption || '')
    setIsEditingCaption(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveCaption()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  return (
    <div
      className={`group relative rounded-lg overflow-hidden border-2 transition-all bg-card w-full ${isSelected
        ? 'border-primary ring-2 ring-primary/20 shadow-lg'
        : 'border-border hover:border-primary/50 hover:shadow-md'
        }`}
    >
      {/* Image */}
      <div
        onClick={onSelect}
        className="w-full relative overflow-hidden bg-muted/30 group/image cursor-pointer"
      >
        <img
          src={url}
          alt={`Frame ${frameNumber + 1}`}
          className="w-full h-auto transition-transform group-hover/image:scale-105"
        />
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border/50 px-2 py-1 rounded text-xs font-mono">
          {String(frameNumber + 1).padStart(3, '0')} / {String(frameCount).padStart(3, '0')}
        </div>

        {/* Custom Overlay (Extension Point) */}
        {renderOverlay && (
          <div className="absolute top-2 right-2 z-10">
            {renderOverlay(frameNumber)}
          </div>
        )}

        {/* View Detail & Add Caption Overlay */}
        <div
          className="absolute inset-0 bg-background/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail()
          }}
        >
          <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 hover:bg-background transition-colors transform scale-90 group-hover/image:scale-100 transition-transform shadow-sm cursor-pointer pointer-events-auto">
            <Maximize2 className="w-3 h-3" />
            Xem chi tiết
          </div>
          {isAdmin && !caption && (
            <div 
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors transform scale-90 group-hover/image:scale-100 transition-transform shadow-sm cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingCaption(true)
              }}
            >
              <Edit2 className="w-3 h-3" />
              {t('fileView:toolbar.addCaption')}
            </div>
          )}
        </div>
      </div>

      {/* Caption Section */}
      {(caption || isEditingCaption) && (
        <div className="min-h-[60px] border-t bg-card">
          {isEditingCaption ? (
            <div className="p-2">
              <textarea
                ref={textareaRef}
                value={editedCaption}
                onChange={(e) => {
                  setEditedCaption(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveCaption}
                placeholder={t('fileView:toolbar.addCaption') + '...'}
                className="w-full text-xs p-2 bg-muted/50 text-foreground placeholder:text-muted-foreground/50 border border-transparent rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                rows={1}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1 px-1">
                <span className="text-[10px] text-muted-foreground">{t('fileView:toolbar.enterToSave')}</span>
                <span className="text-[10px] text-muted-foreground">{editedCaption.length}/500</span>
              </div>
            </div>
          ) : (
            <div
              className="relative group/caption p-2 h-full cursor-text"
              onClick={() => isAdmin && setIsEditingCaption(true)}
            >
              {caption ? (
                <div className="text-xs text-foreground/90 break-words whitespace-pre-wrap line-clamp-3">
                  {linkifyText(caption)}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-1">
                  {isAdmin ? t('fileView:toolbar.addCaption') + '...' : t('fileView:toolbar.noCaption')}
                </p>
              )}

              {isAdmin && (
                <div className="absolute top-1 right-1 opacity-0 group-hover/caption:opacity-100 transition-opacity">
                  <Edit2 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Sortable Grid Frame Card Component (with drag-and-drop support)
function SortableGridFrameCard({
  id,
  url,
  frameNumber,
  frameCount,
  caption,
  isSelected,
  isSelectedForDelete,
  isAdmin: _isAdmin,
  isEditMode: _isEditMode,
  onSelect,
  onViewDetail: _onViewDetail,
  onCaptionChange: _onCaptionChange,
  onToggleDelete,
  renderOverlay
}: {
  id: number
  url: string
  frameNumber: number
  frameCount: number
  caption?: string
  isSelected: boolean
  isSelectedForDelete: boolean
  isAdmin: boolean
  isEditMode: boolean
  onSelect: () => void
  onViewDetail: () => void
  onCaptionChange?: (caption: string) => void
  onToggleDelete: () => void
  renderOverlay?: (frameIndex: number) => React.ReactNode
}) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg overflow-hidden border-2 transition-all bg-card w-full ${isSelectedForDelete
        ? 'border-destructive ring-2 ring-destructive/20 shadow-lg'
        : isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
          : 'border-border hover:border-primary/50 hover:shadow-md'
        }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-12 z-20 bg-background/90 backdrop-blur-sm border border-border/50 p-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Custom Overlay (Extension Point) */}
      {renderOverlay && !isDragging && (
        <div className="absolute top-2 right-2 z-10">
          {renderOverlay(frameNumber)}
        </div>
      )}

      {/* Delete Selection Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleDelete()
        }}
        className={`absolute top-2 left-2 z-20 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelectedForDelete
          ? 'bg-destructive border-destructive text-destructive-foreground'
          : 'bg-background/90 border-border hover:border-primary opacity-0 group-hover:opacity-100'
          }`}
      >
        {isSelectedForDelete && <Check className="w-4 h-4" />}
      </button>

      {/* Image */}
      <div
        onClick={onSelect}
        className="w-full relative overflow-hidden bg-muted/30 group/image cursor-pointer"
      >
        <img
          src={url}
          alt={`Frame ${frameNumber + 1}`}
          className="w-full h-auto"
        />
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border border-border/50 px-2 py-1 rounded text-xs font-mono pointer-events-none">
          {String(frameNumber + 1).padStart(3, '0')} / {String(frameCount).padStart(3, '0')}
        </div>

        {/* View Detail & Add Caption Overlay */}
        <div
          className="absolute inset-0 bg-background/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10"
          onClick={(e) => {
            e.stopPropagation()
            _onViewDetail()
          }}
        >
          <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 hover:bg-background transition-colors transform scale-90 group-hover/image:scale-100 transition-transform shadow-sm cursor-pointer pointer-events-auto">
            <Maximize2 className="w-3 h-3" />
            Xem chi tiết
          </div>
          {_isAdmin && !caption && (
            <div 
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors transform scale-90 group-hover/image:scale-100 transition-transform shadow-sm cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
                // In sortable mode, we might not have direct editing, 
                // but we can at least show the view detail which allows editing?
                // Or just show the caption field if they want.
                // For consistency, I'll try to trigger editing if possible.
                // But SortableGridFrameCard doesn't have an internal editing state.
                // So I'll just make it navigate to detail or show a message.
                _onViewDetail()
              }}
            >
              <Edit2 className="w-3 h-3" />
              {t('fileView:toolbar.addCaption')}
            </div>
          )}
        </div>
      </div>

      {/* Compact Caption Preview */}
      {caption && (
        <div className="p-2 bg-card border-t min-h-[40px]">
          <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap line-clamp-2">
            {linkifyText(caption)}
          </div>
        </div>
      )}
    </div>
  )
}
