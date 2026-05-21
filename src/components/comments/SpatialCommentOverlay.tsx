
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, X, MessageSquare, Eye, EyeOff, Paperclip, Image as ImageIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { linkifyText } from '@/lib/linkify'
import type { Comment, DropPinCoordinates } from '@/types'

interface SpatialCommentOverlayProps {
  comments: Comment[]
  isDropPinMode?: boolean
  dropPinCoordinates?: DropPinCoordinates | null
  setDropPinCoordinates?: (coords: DropPinCoordinates | null) => void
  onPinClick?: (comment: Comment) => void
}

/** Shared expanded card component for both pins and regions */
const SpatialCommentCard = ({ 
  c, 
  showAllContent,
  setActiveCommentId,
  setLightbox
}: { 
  c: Comment; 
  showAllContent: boolean;
  setActiveCommentId: (id: string | null) => void;
  setLightbox: (l: { images: string[]; index: number } | null) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0,
    marginTop: '4px',
    marginBottom: 'auto'
  })

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const newStyle: React.CSSProperties = {
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 1,
        marginTop: '4px',
        marginBottom: 'auto'
      }

      // Vertical boundary check
      if (rect.bottom > window.innerHeight - 10) {
        // Flip to top
        newStyle.top = 'auto'
        newStyle.bottom = '100%'
        newStyle.marginTop = 'auto'
        newStyle.marginBottom = '4px'
      }

      // Horizontal boundary check (after horizontal transform)
      // If we set left: auto, right: 0, it aligns with parent's right edge
      if (rect.right > window.innerWidth - 10) {
        newStyle.left = 'auto'
        newStyle.right = '0'
        newStyle.transform = 'none'
      } else if (rect.left < 10) {
        newStyle.left = '0'
        newStyle.transform = 'none'
      }

      setStyle(newStyle)
    }
  }, [c.id, showAllContent])

  const imgs = c.imageUrls && c.imageUrls.length > 0
    ? c.imageUrls
    : (c.attachments?.filter(att => att.type === 'image').map(att => att.url) || [])
  const files = c.attachments?.filter(att => att.type !== 'image') || []

  return (
    <div 
      ref={cardRef}
      className="absolute w-56 bg-background/95 backdrop-blur-sm border border-border shadow-xl rounded-lg p-2.5 z-[100] animate-in fade-in zoom-in duration-200 transition-opacity"
      style={style}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-border/50">
        <span className="text-xs font-semibold truncate">{c.userName || 'Guest'}</span>
        {!showAllContent && (
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveCommentId(null); }} 
            className="hover:bg-muted rounded-full p-0.5 text-muted-foreground flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content with linkify */}
      <div className="text-xs text-foreground line-clamp-4 whitespace-pre-wrap break-words leading-relaxed">
        {linkifyText(c.content)}
      </div>

      {/* Image thumbnails */}
      {imgs.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {imgs.slice(0, 4).map((url: string, i: number) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox({ images: imgs, index: i }); }}
              className="block w-12 h-12 rounded overflow-hidden border border-border hover:border-primary transition-colors relative group/img cursor-pointer"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
          {imgs.length > 4 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox({ images: imgs, index: 4 }); }}
              className="w-12 h-12 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium hover:bg-muted/80 cursor-pointer"
            >
              +{imgs.length - 4}
            </button>
          )}
        </div>
      )}

      {/* File attachments */}
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.slice(0, 3).map(att => (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors truncate"
            >
              <Paperclip className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{att.name}</span>
            </a>
          ))}
          {files.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{files.length - 3} files</span>
          )}
        </div>
      )}
    </div>
  )
}

export function SpatialCommentOverlay({
  comments,
  isDropPinMode,
  dropPinCoordinates,
  setDropPinCoordinates,
  onPinClick
}: SpatialCommentOverlayProps) {
  const { t } = useTranslation()
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false })
  const pointerStartRef = useRef({ x: 0, y: 0, pctX: 0, pctY: 0 })
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  
  // Drag-to-draw state
  const [isDragging, setIsDragging] = useState(false)
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null)
      if (e.key === 'ArrowLeft') setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  useEffect(() => {
    if (!isDropPinMode || !setDropPinCoordinates) {
      setMousePos(prev => ({ ...prev, visible: false }))
      setIsDragging(false)
      setDragRect(null)
      return
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      
      const target = e.target as HTMLElement
      if (target.closest('.spatial-pin, button, input, textarea, a, [role="slider"], [role="button"], .video-controls, .timeline-wrapper, .floating-comment-card')) {
        return
      }
      
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      
      // Check if inside container
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return
      
      const pctX = ((e.clientX - rect.left) / rect.width) * 100
      const pctY = ((e.clientY - rect.top) / rect.height) * 100
      
      pointerStartRef.current = { x: e.clientX, y: e.clientY, pctX, pctY }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const target = e.target as HTMLElement

      // Always update mouse pos for tooltip
      if (target.closest('.spatial-pin, button, input, a, [role="slider"], [role="button"], .video-controls, .timeline-wrapper, .floating-comment-card')) {
        setMousePos(prev => ({ ...prev, visible: false }))
      } else if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        setMousePos({ x: e.clientX, y: e.clientY, visible: true })
      } else {
        setMousePos(prev => ({ ...prev, visible: false }))
      }

      // Check if we should start/continue dragging
      if (pointerStartRef.current.x === 0 && pointerStartRef.current.y === 0) return
      if ((e.buttons & 1) === 0) return // left button not held

      const dx = e.clientX - pointerStartRef.current.x
      const dy = e.clientY - pointerStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 15) {
        setIsDragging(true)
        // Clamp current position to container bounds
        const curPctX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
        const curPctY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
        
        const startX = pointerStartRef.current.pctX
        const startY = pointerStartRef.current.pctY
        
        // Normalize: rect always has positive w/h
        const x = Math.min(startX, curPctX)
        const y = Math.min(startY, curPctY)
        const w = Math.abs(curPctX - startX)
        const h = Math.abs(curPctY - startY)
        
        setDragRect({ x, y, w, h })
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.spatial-pin, button, input, textarea, a, [role="slider"], [role="button"], .video-controls, .timeline-wrapper, .floating-comment-card')) {
        setIsDragging(false)
        setDragRect(null)
        return
      }

      const container = containerRef.current
      if (!container) {
        setIsDragging(false)
        setDragRect(null)
        return
      }
      const rect = container.getBoundingClientRect()

      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        setIsDragging(false)
        setDragRect(null)
        return
      }

      // Close active comment when clicking on the background
      setActiveCommentId(null)

      const dx = e.clientX - pointerStartRef.current.x
      const dy = e.clientY - pointerStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= 5) {
        // Click → pin
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setDropPinCoordinates({ x, y, screenX: e.clientX, screenY: e.clientY, type: 'pin' })
      } else if (distance > 15 && dragRect && dragRect.w >= 2 && dragRect.h >= 2) {
        // Drag → region (minimum 2% width/height)
        setDropPinCoordinates({
          x: dragRect.x,
          y: dragRect.y,
          w: dragRect.w,
          h: dragRect.h,
          screenX: e.clientX,
          screenY: e.clientY,
          type: 'region'
        })
      }
      // 5 < distance <= 15: dead zone (ignore — could be orbit/pan)

      setIsDragging(false)
      setDragRect(null)
      pointerStartRef.current = { x: 0, y: 0, pctX: 0, pctY: 0 }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDropPinMode, setDropPinCoordinates, dragRect])

  const [showAllContent, setShowAllContent] = useState(false)

  // Check if there are any spatial comments
  const hasSpatialComments = comments.some(c => {
    try { const d = JSON.parse(c.annotationData || '{}'); return d.x !== undefined; } catch { return false; }
  })



  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-40 pointer-events-none ${isDropPinMode ? 'cursor-crosshair' : ''}`}
    >
      {/* Tooltip for drop pin — rendered via portal to escape DialogContent's transform context */}
      {isDropPinMode && mousePos.visible && !activeCommentId && !dropPinCoordinates && !isDragging && createPortal(
        <div 
          className="drop-pin-tooltip fixed z-[9999] pointer-events-none flex items-center gap-1.5 px-2 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-[11px] font-medium rounded-md shadow-lg border border-white/10"
          style={{ left: mousePos.x + 8, top: mousePos.y + 8 }}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>{t('fileView:comments.dropPinHint')}</span>
        </div>,
        document.body
      )}

      {/* Drag preview rectangle (rubber-band) */}
      {isDragging && dragRect && (
        <div
          className="absolute pointer-events-none z-30 border-2 border-dashed border-primary rounded"
          style={{
            left: `${dragRect.x}%`,
            top: `${dragRect.y}%`,
            width: `${dragRect.w}%`,
            height: `${dragRect.h}%`,
          }}
        />
      )}

      {/* Toggle button to show/hide all comment content */}
      {hasSpatialComments && (
        <button
          onClick={() => { setShowAllContent(prev => !prev); setActiveCommentId(null); }}
          className={`absolute top-2 left-2 z-30 pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium backdrop-blur-sm border shadow-sm transition-all duration-200 ${
            showAllContent 
              ? 'bg-primary/90 text-primary-foreground border-primary/50 hover:bg-primary' 
              : 'bg-background/80 text-foreground border-border hover:bg-muted'
          }`}
          title={showAllContent ? t('fileView:comments.hide') : t('fileView:comments.show')}
        >
          {showAllContent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showAllContent ? t('fileView:comments.hide') : t('fileView:comments.show')}</span>
        </button>
      )}

      {/* Existing spatial pins & regions */}
      {comments.map(c => {
        if (!c.annotationData) return null
        try {
          const data = JSON.parse(c.annotationData)
          if (data.x === undefined || data.y === undefined) return null

          const isExpanded = showAllContent || activeCommentId === c.id
          const pinColor = data.color || '#6b7280'

          // ── Region rendering ──
          if (data.type === 'region' && data.w !== undefined && data.h !== undefined) {
            return (
              <div
                key={c.id}
                className={`absolute z-10 spatial-pin group/region ${isExpanded ? 'pointer-events-auto' : 'pointer-events-none'}`}
                style={{
                  left: `${data.x}%`,
                  top: `${data.y}%`,
                  width: `${data.w}%`,
                  height: `${data.h}%`,
                }}
              >
                {/* Region rectangle outline + fill */}
                <div
                  className={`absolute inset-0 rounded transition-all ${isExpanded ? 'opacity-100 cursor-pointer' : 'opacity-0'}`}
                  style={{
                    border: `2px solid ${pinColor}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!showAllContent) {
                      setActiveCommentId(activeCommentId === c.id ? null : c.id)
                    }
                    setDropPinCoordinates?.(null)
                    onPinClick?.(c)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                />

                {/* Small pin icon at top-left corner */}
                <div
                  className="absolute -top-3 -left-3 cursor-pointer hover:scale-125 transition-transform pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!showAllContent) {
                      setActiveCommentId(activeCommentId === c.id ? null : c.id)
                    }
                    setDropPinCoordinates?.(null)
                    onPinClick?.(c)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                >
                  <MapPin 
                    className="w-5 h-5 drop-shadow-md" 
                    style={{ color: pinColor, fill: pinColor }} 
                  />
                </div>

                {/* Expanded comment card — positioned relative to the region */}
                {isExpanded && (
                  <SpatialCommentCard 
                    c={c} 
                    showAllContent={showAllContent} 
                    setActiveCommentId={setActiveCommentId}
                    setLightbox={setLightbox}
                  />
                )}
              </div>
            )
          }

          // ── Pin rendering (existing behavior, backward compatible) ──
          return (
            <div
              key={c.id}
              className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto z-10 spatial-pin"
              style={{ left: `${data.x}%`, top: `${data.y}%` }}
            >
              <div
                className="cursor-pointer hover:scale-125 transition-transform"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!showAllContent) {
                    setActiveCommentId(activeCommentId === c.id ? null : c.id)
                  }
                  setDropPinCoordinates?.(null)
                  onPinClick?.(c)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <MapPin 
                  className="w-6 h-6 drop-shadow-md" 
                  style={{ color: pinColor, fill: pinColor }} 
                />
              </div>
              
              {isExpanded && (
                <SpatialCommentCard 
                  c={c} 
                  showAllContent={showAllContent} 
                  setActiveCommentId={setActiveCommentId}
                  setLightbox={setLightbox}
                />
              )}
            </div>
          )
        } catch (e) {
          // JSON parse failed or no spatial data, ignore
        }
        return null
      })}

      {/* The current dropping pin (click mode) */}
      {isDropPinMode && dropPinCoordinates && dropPinCoordinates.type !== 'region' && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: `${dropPinCoordinates.x}%`, top: `${dropPinCoordinates.y}%` }}
        >
          <MapPin className="w-6 h-6 text-primary fill-primary animate-bounce drop-shadow-md" />
        </div>
      )}

      {/* The current dropping region (drag mode) */}
      {isDropPinMode && dropPinCoordinates && dropPinCoordinates.type === 'region' && dropPinCoordinates.w && dropPinCoordinates.h && (
        <div
          className="absolute pointer-events-none z-30 rounded"
          style={{
            left: `${dropPinCoordinates.x}%`,
            top: `${dropPinCoordinates.y}%`,
            width: `${dropPinCoordinates.w}%`,
            height: `${dropPinCoordinates.h}%`,
            border: '2px solid hsl(var(--primary))',
            backgroundColor: 'hsla(var(--primary) / 0.1)',
          }}
        >
          <div className="absolute -top-3 -left-3">
            <MapPin className="w-5 h-5 text-primary fill-primary animate-bounce drop-shadow-md" />
          </div>
        </div>
      )}

      {/* Lightbox — rendered via portal to escape transform context */}
      {lightbox && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-[100000] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Download */}
          <button
            className="absolute top-4 right-16 z-[100000] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              const a = document.createElement('a')
              a.href = lightbox.images[lightbox.index]
              a.download = `image-${lightbox.index + 1}.jpg`
              a.click()
            }}
            type="button"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Prev */}
          {lightbox.images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[100000] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null); }}
              type="button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Image */}
          <img
            src={lightbox.images[lightbox.index]}
            alt={`Image ${lightbox.index + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain select-none rounded-lg shadow-2xl"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightbox.images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[100000] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null); }}
              type="button"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Counter */}
          {lightbox.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/60 text-white text-sm backdrop-blur-sm">
              {lightbox.index + 1} / {lightbox.images.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
