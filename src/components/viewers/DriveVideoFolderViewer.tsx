import { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Film, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Search,
  Copy,
  Check,
  FileVideo,
  Heart
} from 'lucide-react'
import { 
  getDriveEmbedUrl, 
  extractDriveFileId, 
  extractDriveVideoId, 
  isDriveVideoUrl, 
  getDriveVideoThumbnailUrl, 
  normalizeDriveUrl 
} from '@/utils/googleDrive'
import { useFileStore } from '@/stores/files'
import toast from 'react-hot-toast'

interface DriveVideoFolderViewerProps {
  urls: string[]
  fileNames?: string[]
  mediaTypes?: ('image' | 'video')[]
  currentFrame?: number
  onFrameChange?: (frame: number) => void
  file: { id: string; currentVersion: number; projectId?: string }
  allFileComments?: any[]
  fileComments?: any[]
  isDropPinMode?: boolean
  dropPinCoordinates?: any
  setDropPinCoordinates?: (coords: any) => void
  isAdmin?: boolean
  className?: string
  externalIsFullscreen?: boolean
  onToggleFullscreen?: () => void
  externalFullscreenRef?: React.RefObject<HTMLDivElement | null>
  lastModified?: string | number
  onAddComment?: (userName: string, content: string, timestamp?: number, parentCommentId?: string, annotationData?: string | null, attachments?: File[]) => Promise<void>
  currentUserName?: string
  onUserNameChange?: (name: string) => void
  isLocked?: boolean
}

export function DriveVideoFolderViewer({
  urls = [],
  fileNames = [],
  mediaTypes = [],
  currentFrame: externalCurrentFrame = 0,
  onFrameChange,
  file,
  allFileComments = [],
  fileComments,
  className = '',
  externalIsFullscreen: _externalIsFullscreen,
  onToggleFullscreen: _onToggleFullscreen,
  externalFullscreenRef: _externalFullscreenRef,
  lastModified,
  onAddComment: _onAddComment,
  currentUserName: _currentUserName,
  isLocked: _isLocked = false
}: DriveVideoFolderViewerProps) {
  const [activeFrame, setActiveFrame] = useState(externalCurrentFrame)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)

  const files = useFileStore((state) => state.files)
  const togglePickedFrame = useFileStore((state) => state.togglePickedFrame)

  const currentFile = useMemo(() => files.find((f) => f.id === file.id), [files, file.id])
  const currentVersionData = useMemo(() => currentFile?.versions.find((v) => v.version === file.currentVersion), [currentFile, file.currentVersion])
  const pickedFrames = currentVersionData?.pickedFrames || {}

  const handleTogglePick = useCallback((index: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!file.projectId) return
    const nextPicked = !pickedFrames[index]
    togglePickedFrame(file.projectId, file.id, file.currentVersion, index, nextPicked)
    toast.success(nextPicked ? `Đã Pick Clip #${index + 1}` : `Đã bỏ chọn Clip #${index + 1}`)
  }, [file.projectId, file.id, file.currentVersion, pickedFrames, togglePickedFrame])

  useEffect(() => {
    if (externalCurrentFrame !== undefined && externalCurrentFrame !== activeFrame) {
      setActiveFrame(externalCurrentFrame)
    }
  }, [externalCurrentFrame])

  const handleSelectFrame = useCallback((index: number) => {
    setActiveFrame(index)
    onFrameChange?.(index)
  }, [onFrameChange])

  const handleNext = useCallback(() => {
    if (activeFrame < urls.length - 1) handleSelectFrame(activeFrame + 1)
  }, [activeFrame, urls.length, handleSelectFrame])

  const handlePrev = useCallback(() => {
    if (activeFrame > 0) handleSelectFrame(activeFrame - 1)
  }, [activeFrame, handleSelectFrame])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); handleNext() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); handlePrev() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleNext, handlePrev])

  const activeUrl = urls[activeFrame] || ''
  const videoId = extractDriveFileId(activeUrl)
  const isVideo = (mediaTypes[activeFrame] === 'video') || isDriveVideoUrl(activeUrl) || !!videoId
  const activeFileName = fileNames[activeFrame] || (isVideo ? `Video Clip ${activeFrame + 1}` : `Frame ${activeFrame + 1}`)

  // Google Drive Embed URL (Official preview link)
  const embedUrl = useMemo(() => {
    if (videoId) return getDriveEmbedUrl(videoId)
    return activeUrl
  }, [videoId, activeUrl])

  const commentsPerFrame = useMemo(() => {
    const counts: Record<number, number> = {}
    const list = allFileComments.length > 0 ? allFileComments : (fileComments || [])
    list.forEach(c => {
      if (typeof c.timestamp === 'number') counts[c.timestamp] = (counts[c.timestamp] || 0) + 1
    })
    return counts
  }, [allFileComments, fileComments])

  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) return urls.map((_, i) => i)
    const q = searchQuery.toLowerCase()
    return urls.map((_, i) => i).filter(i => (fileNames[i] || `Clip ${i + 1}`).toLowerCase().includes(q))
  }, [urls, fileNames, searchQuery])

  const handleCopyLink = () => {
    if (videoId) {
      navigator.clipboard.writeText(`https://drive.google.com/file/d/${videoId}/preview`)
      setCopied(true)
      toast.success('Đã sao chép link preview của clip!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Shared thumbnail item renderer
  const renderPlaylistItem = (index: number, compact = false) => {
    const url = urls[index]
    const isCurrent = activeFrame === index
    const isClipVideo = (mediaTypes[index] === 'video') || isDriveVideoUrl(url)
    const clipVideoId = isDriveVideoUrl(url) ? extractDriveVideoId(url) : null
    const name = fileNames[index] || (isClipVideo ? `Clip ${index + 1}` : `Frame ${index + 1}`)
    const commentCount = commentsPerFrame[index] || 0
    const isPicked = !!pickedFrames[index]
    const thumbUrl = clipVideoId
      ? getDriveVideoThumbnailUrl(clipVideoId, 400)
      : normalizeDriveUrl(url, 400, lastModified)

    const thumbSize = compact ? 'w-16' : 'w-20'
    const iconSize = compact ? 'w-3.5 h-3.5' : 'w-5 h-5'
    const playSize = compact ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'

    return (
      <div
        key={index}
        onClick={() => handleSelectFrame(index)}
        className={[
          'rounded-lg border text-left transition-all relative cursor-pointer',
          isCurrent
            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
            : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50',
          compact ? 'flex flex-row items-center gap-2 p-1.5' : 'flex flex-row items-center gap-3 p-2',
        ].join(' ')}
      >
        {/* Thumbnail */}
        <div className={`relative ${thumbSize} aspect-video rounded-md overflow-hidden bg-black shrink-0 border border-border/40`}>
          <img src={thumbUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            {isCurrent ? (
              <div className={`${iconSize} rounded-full bg-primary flex items-center justify-center animate-pulse`}>
                <Play className={`${playSize} fill-current text-primary-foreground ml-0.5`} />
              </div>
            ) : (
              <div className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-black/60 flex items-center justify-center`}>
                <Play className={`${compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} fill-current text-white ml-px`} />
              </div>
            )}
          </div>
          <span className={`absolute bottom-0.5 left-0.5 ${compact ? 'text-[8px] px-0.5' : 'text-[9px] px-1'} font-mono font-bold bg-black/80 text-white rounded pointer-events-none`}>
            #{index + 1}
          </span>
          {commentCount > 0 && (
            <span className={`absolute top-0.5 right-0.5 flex items-center gap-0.5 ${compact ? 'text-[8px] px-0.5' : 'text-[9px] px-1'} font-bold bg-primary text-primary-foreground rounded pointer-events-none`}>
              <MessageSquare className={compact ? 'w-1.5 h-1.5' : 'w-2 h-2'} />{commentCount}
            </span>
          )}
        </div>

        {/* Info & Pick */}
        <div className="flex items-center justify-between flex-1 min-w-0">
          <div className="flex flex-col min-w-0 flex-1 mr-1">
            <span className={`${compact ? 'text-[11px]' : 'text-xs'} font-medium truncate ${isCurrent ? 'text-primary font-bold' : 'text-foreground'}`}>
              {name}
            </span>
            {!compact && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                {isClipVideo ? 'Video' : 'Image'}
              </span>
            )}
          </div>
          <button type="button" onClick={(e) => handleTogglePick(index, e)}
            className={`${compact ? 'p-1' : 'p-1.5'} rounded-md transition-all border shrink-0 ${
              isPicked
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'bg-muted/40 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 border-border/40'
            }`}
            title={isPicked ? "Bỏ chọn clip" : "Pick clip này"}>
            <Heart className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${isPicked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full bg-background text-foreground border-t border-border ${className}`}>

      {/* ── MAIN STAGE ── */}
      {/* Mobile: overflow-y-auto so entire content (video + nav + thumbnails) scrolls naturally */}
      {/* Desktop: flex-1 with internal overflow handled by sidebar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto lg:overflow-hidden relative bg-background">

        {/* Stage Header — sticky on mobile scroll */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileVideo className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold truncate text-foreground max-w-[140px] sm:max-w-[280px] lg:max-w-sm" title={activeFileName}>
              {activeFileName}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-mono text-muted-foreground hidden sm:block mr-1">
              {activeFrame + 1} / {urls.length}
            </span>
            <button
              onClick={(e) => handleTogglePick(activeFrame, e)}
              className={`p-1.5 rounded transition-all border ${
                pickedFrames[activeFrame]
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
              }`}
              title={pickedFrames[activeFrame] ? "Đã Pick clip này" : "Pick clip này"}
            >
              <Heart className={`w-3.5 h-3.5 ${pickedFrames[activeFrame] ? 'fill-current' : ''}`} />
            </button>
            {videoId && (
              <button onClick={handleCopyLink}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy link preview">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Video Player Stage */}
        {/* Mobile: aspect-video keeps a sane size. Desktop: flex-1 fills remaining space */}
        <div className="w-full aspect-video lg:aspect-auto lg:flex-1 lg:min-h-0 relative bg-black flex items-center justify-center overflow-hidden shrink-0">
          {isVideo && embedUrl ? (
            <iframe
              key={`drive-embed-${videoId || activeFrame}`}
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title={activeFileName}
            />
          ) : (
            <img
              src={normalizeDriveUrl(activeUrl, 2000, lastModified)}
              alt={activeFileName}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border shrink-0 z-10">
          <button onClick={handlePrev} disabled={activeFrame === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-border/60">
            <ChevronLeft className="w-4 h-4" />
            <span>Clip Trước</span>
          </button>
          <span className="text-xs font-mono font-bold text-foreground tracking-wide">{activeFrame + 1} / {urls.length}</span>
          <button onClick={handleNext} disabled={activeFrame === urls.length - 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-border/60">
            <span>Clip Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Mobile Playlist (inline, scrolls with page) ── */}
        <div className="lg:hidden border-t border-border bg-card">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Film className="w-3.5 h-3.5 text-primary" />
              <span>Clips ({urls.length})</span>
            </div>
          </div>
          <div className="flex flex-col p-1.5 gap-1">
            {filteredIndices.map(index => renderPlaylistItem(index, true))}
          </div>
        </div>
      </div>

      {/* ── Desktop Playlist Sidebar ── */}
      <div className="hidden lg:flex w-80 h-full shrink-0 flex-col border-l border-border bg-card">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <Film className="w-4 h-4 text-primary" />
            <span>Danh sách Clips ({urls.length})</span>
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{urls.length} items</Badge>
        </div>
        {urls.length > 3 && (
          <div className="relative p-2 border-b border-border shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-4 top-[50%] -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm clip..." className="h-8 pl-8 text-xs bg-background" />
          </div>
        )}
        <div className="flex flex-col overflow-y-auto p-2 gap-2 h-full flex-1">
          {filteredIndices.map(index => renderPlaylistItem(index, false))}
        </div>
      </div>
    </div>
  )
}
