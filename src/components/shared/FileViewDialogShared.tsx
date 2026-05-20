import { useState, useRef, lazy, Suspense, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { File as FileType } from '@/types'
import { formatFileSize } from '@/lib/utils'
import { FileImage, Video, Box, Film, FileText, ShieldAlert } from 'lucide-react'
import { startFileTour, hasSeenTour } from '@/lib/fileTours'
import { UploadDialog } from '@/components/files/UploadDialog'
import { useZoomPan } from '@/hooks/useZoomPan'
import { PickableImageSequenceViewer } from '@/components/viewers/PickableImageSequenceViewer'
import { AnnotationCanvasKonva } from '@/components/annotations/AnnotationCanvasKonva'
import { useFileStore } from '@/stores/files'
import { useVideoComparison } from '@/hooks/useVideoComparison'
import { useFullscreen } from '@/hooks/useFullscreen'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MobileFileViewLayout } from './mobile/MobileFileViewLayout'
import { DragDropUpdateOverlay } from './DragDropUpdateOverlay'
import { PDFPreviewMode } from './PDFPreviewMode'
import { ImageCompareMode } from './ImageCompareMode'
import { VideoCompareMode } from './VideoCompareMode'
import { SpatialCommentOverlay } from '@/components/comments/SpatialCommentOverlay'
import { StandardImagePreview } from './StandardImagePreview'
import { StandardVideoPreview } from './StandardVideoPreview'
import { DesktopFileViewLayout } from './DesktopFileViewLayout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from './ConfirmDialog'
import { normalizeDriveUrl, extractDriveFileId } from '@/utils/googleDrive'

import type { AnnotationObject, DropPinCoordinates } from '@/types'
import type { GLBViewerRef } from '@/components/viewers/GLBViewer'

const GLBViewer = lazy(() => import('@/components/viewers/GLBViewer').then(m => ({ default: m.GLBViewer })))

interface Props {
  file: FileType | null
  projectId: string
  resolvedUrl?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchVersion?: (fileId: string, version: number) => void
  onUploadNewVersion?: (file: File, existingFileId: string) => Promise<void>
  onSequenceViewModeChange?: (fileId: string, mode: 'video' | 'carousel' | 'grid') => Promise<void>
  comments: any[]
  currentUserName: string
  onUserNameChange: (name: string) => void
  onAddComment: (userName: string, content: string, timestamp?: number, parentCommentId?: string, annotationData?: string | null, attachments?: File[]) => Promise<void>
  onResolveToggle?: (commentId: string, isResolved?: boolean) => void
  onEditComment?: (commentId: string, newContent: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  isAdmin?: boolean
  onCaptionChange?: (fileId: string, version: number, frame: number, caption: string) => Promise<void>
  onRenameFile?: (fileId: string, newName: string) => Promise<void>
  sequenceContext?: {
    totalFrames: number
    currentFrameIndex: number
    frameCaptions?: Record<number, string>
    onNavigateFrame?: (frameIndex: number) => void
  }
  project?: { isCommentsLocked?: boolean }
  isArchived?: boolean
  initialFullscreen?: boolean
  onFullscreenChange?: (f: boolean) => void
  portalContainer?: HTMLElement | null
}

const getFileTypeIcon = (type: string) => {
  if (type === 'image') return <FileImage className="w-5 h-5 text-green-500" />
  if (type === 'video') return <Video className="w-5 h-5 text-blue-500" />
  if (type === 'model') return <Box className="w-5 h-5 text-purple-500" />
  if (type === 'sequence') return <Film className="w-5 h-5 text-orange-500" />
  if (type === 'pdf' || type.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />
  return <FileImage className="w-5 h-5 text-gray-500" />
}

export function FileViewDialogShared(props: Props) {
  const { t } = useTranslation(['fileView', 'common'])
  
  const getFileTypeLabel = (type: string) => {
    if (type === 'image') return t('types.image')
    if (type === 'video') return t('types.video')
    if (type === 'model') return t('types.model')
    if (type === 'sequence') return t('types.sequence')
    if (type === 'pdf' || type.endsWith('.pdf')) return t('types.pdf')
    return t('types.file')
  }
  const { file, projectId: _projectId, resolvedUrl, open, onOpenChange, onSwitchVersion, onSequenceViewModeChange, comments, currentUserName, onUserNameChange, onAddComment, onResolveToggle, onEditComment, onDeleteComment, isAdmin = false, onCaptionChange, sequenceContext, project, isArchived = false, initialFullscreen = false, onFullscreenChange, portalContainer } = props

  const [showComments, setShowComments] = useState(true)
  const [showOnlyCurrentTimeComments, setShowOnlyCurrentTimeComments] = useState(false)
  const [viewAllVersions, setViewAllVersions] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [videoFps, setVideoFps] = useState(30)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentAnnotationCommentId, setCurrentAnnotationCommentId] = useState<string | null>(null)
  const currentTimeRef = useRef(0)
  const glbViewerRef = useRef<GLBViewerRef>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [leftVersion, setLeftVersion] = useState<number | null>(null)
  const [rightVersion, setRightVersion] = useState<number | null>(null)
  const [savingThumbnail, setSavingThumbnail] = useState(false)
  const [compareDisplayMode, setCompareDisplayMode] = useState<'side-by-side' | 'slider'>('side-by-side')
  const [comparePosition, setComparePosition] = useState<number>(50)
  const uniqueVersions = useMemo(() => {
    if (!file?.versions) return []
    const versionMap = new Map(); file.versions.forEach(v => versionMap.set(v.version, v))
    return Array.from(versionMap.values()).sort((a: any, b: any) => b.version - a.version)
  }, [file?.versions])

  const [currentVersion, setCurrentVersion] = useState(file?.currentVersion || 1)
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [annotationTool, setAnnotationTool] = useState<'pen' | 'rect' | 'arrow' | 'select' | 'eraser'>('pen')
  const [annotationColor, setAnnotationColor] = useState('#ffff00')
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(2)
  const [isDropPinMode, setIsDropPinMode] = useState(true)
  const [dropPinCoordinates, setDropPinCoordinates] = useState<DropPinCoordinates | null>(null)
  const [annotationData, setAnnotationData] = useState<AnnotationObject[] | null>(null)
  const [annotationHistory, setAnnotationHistory] = useState<AnnotationObject[][]>([])
  const [annotationHistoryIndex, setAnnotationHistoryIndex] = useState(0)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(initialFullscreen)
  const [sequenceViewMode, setSequenceViewMode] = useState<'video' | 'carousel' | 'grid'>('video')
  const [frameDetailView, setFrameDetailView] = useState<number | null>(null)
  const [navMode, setNavMode] = useState<'frame' | 'marker'>('frame')
  const [isPlaying, setIsPlaying] = useState(false)
  const sequenceFullscreenRef = useRef<HTMLDivElement>(null)
  const sequenceFullscreen = useFullscreen(sequenceFullscreenRef)
  const [pdfPage, setPdfPage] = useState(1)
  const [commentWidth, setCommentWidth] = useState(350)
  const [isResizing, setIsResizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const { zoom, setZoom, panOffset, setPanOffset, bind: zoomPanBind, reset: resetZoomPan, handleZoomIn, handleZoomOut } = useZoomPan({ maxZoom: 4, disabled: isDropPinMode })
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const isMobile = useIsMobile()
  const resizingState = useRef({ startX: 0, startWidth: 350 })
  const getShareLink = useCallback(() => `${window.location.origin}/share/p/${_projectId}/file/${file?.id}`, [_projectId, file?.id])
  const copyShareLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(getShareLink()); setCopied(true); toast.success(t('common:actions.copied')); setTimeout(() => setCopied(false), 2000) } 
    catch (err) { toast.error(t('common:status.error')) }
  }, [getShareLink, t])

  const filesFromStore = useFileStore(state => state.files)
  const currentVersionData = file ? filesFromStore.find(f => f.id === file.id)?.versions.find(v => v.version === currentVersion) : null
  const reactivePickedFrames = currentVersionData?.pickedFrames || {}

  const handleStartTour = () => { 
    if (file) {
      startFileTour({ 
        fileType: file.type as any, 
        isMobile, 
        isAdmin, 
        sequenceViewMode: sequenceViewMode || 'video',
        t
      }) 
    } 
  }
  useEffect(() => { if (open && file) { (async () => { if (!await hasSeenTour(file.type as any)) setTimeout(handleStartTour, 1000) })() } }, [open, file?.type])

  const { reorderSequenceFrames, deleteSequenceFrames, addSequenceFrames, deleteVersion, uploading } = useFileStore()
  const [optimisticSequenceData, setOptimisticSequenceData] = useState<{ urls: string[], captions?: Record<number, string> } | null>(null)

  const videoComparison = useVideoComparison({ primaryVersion: currentVersion, versions: file?.versions.map(v => ({ version: v.version, url: v.url })) || [], onSeek: (time) => setCurrentTime(time) })
  // Throttle timer ref for syncing video currentTime state when filter-by-time is active
  const timeUpdateThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleTimeUpdate = useCallback((time: number) => {
    currentTimeRef.current = time
    // When filter-by-time is active, also sync to state (throttled to avoid excessive re-renders)
    if (showOnlyCurrentTimeComments) {
      if (!timeUpdateThrottleRef.current) {
        timeUpdateThrottleRef.current = setTimeout(() => {
          setCurrentTime(currentTimeRef.current)
          timeUpdateThrottleRef.current = null
        }, 500)
      }
    }
  }, [showOnlyCurrentTimeComments])
  // When filter-by-time is toggled ON, immediately sync ref → state so filter updates right away
  useEffect(() => {
    if (showOnlyCurrentTimeComments && file?.type === 'video') {
      setCurrentTime(currentTimeRef.current)
    }
    return () => {
      if (timeUpdateThrottleRef.current) { clearTimeout(timeUpdateThrottleRef.current); timeUpdateThrottleRef.current = null }
    }
  }, [showOnlyCurrentTimeComments, file?.type])
  const handleFullscreenChange = useCallback((f: boolean) => { setIsVideoFullscreen(f); if (f) setShowOnlyCurrentTimeComments(true); onFullscreenChange?.(f) }, [onFullscreenChange])
  
  // Sync sequence-based fullscreen with UI layout fullscreen
  useEffect(() => {
    if (sequenceFullscreen.isFullscreen) {
      setIsVideoFullscreen(true);
      setShowOnlyCurrentTimeComments(true);
      onFullscreenChange?.(true);
    } else if (file?.type === 'image' || file?.type === 'sequence') {
      // Only sync back to false if the native fullscreen ended 
      // AND we weren't in a manually triggered video fullscreen state
      setIsVideoFullscreen(false);
      onFullscreenChange?.(false);
    }
  }, [sequenceFullscreen.isFullscreen, file?.type, onFullscreenChange])
  const handleLoadedMetadata = useCallback((d: number, fps: number) => { setVideoDuration(d); setVideoFps(fps) }, [])
  const handleVideoPlay = useCallback(() => setIsPlaying(true), [])
  const handleVideoPause = useCallback(() => setIsPlaying(false), [])

  useEffect(() => { 
    if (file) { 
      setCurrentVersion(file.currentVersion); setLeftVersion(null); setRightVersion(null); setZoom(1); setPanOffset({ x: 0, y: 0 }); setOptimisticSequenceData(null)
    } 
  }, [file?.currentVersion, file?.id])


  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); if (isAdmin && zoom <= 1) setIsDragOver(true) }, [isAdmin, zoom])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); if (isAdmin && zoom <= 1) { const d = Array.from(e.dataTransfer.files); if (d.length > 0) { setDroppedFiles(d); setShowUploadDialog(true) } } }, [isAdmin, zoom])

  if (!file) return null

  const current = file.versions.find(v => v.version === file.currentVersion) || file.versions[0]
  const latestVersion = file.versions.reduce((max, v) => (max.version > v.version ? max : v), file.versions[0])
  let effectiveUrl = (currentVersion === file.currentVersion && resolvedUrl) ? resolvedUrl : current?.url
  
  const driveFileId = (effectiveUrl?.includes('drive.google.com') || effectiveUrl?.includes('googleusercontent.com')) ? extractDriveFileId(effectiveUrl) : null

  // Normalize Google Drive URLs for high-quality preview (Images, PDF, Sequence)
  // For videos, we want to keep the original URL or use the direct stream URL
  if (driveFileId && file.type !== 'video') {
    effectiveUrl = normalizeDriveUrl(effectiveUrl!, 2000, current?.metadata?.lastModified)
  }
  const latestUrl = latestVersion?.url
  const uploadDate = current?.uploadedAt?.toDate ? current.uploadedAt.toDate() : new Date()

  const allFileComments = useMemo(() => viewAllVersions ? comments.filter(c => c.fileId === file.id) : comments.filter(c => c.fileId === file.id && c.version === currentVersion), [comments, file.id, currentVersion, viewAllVersions])

  const getFileExtension = (url: string, mimeType?: string, fileType?: string): string => {
    let m = url.match(/\.([^./?#]+)(?=[?#]|$)/) || (url.includes('%2F') && decodeURIComponent(url.split('?')[0]).match(/\.([^./?#]+)$/))
    if (m) { const e = m[1].toLowerCase(); return e === 'jpeg' ? '.jpg' : `.${e}` }
    const mimeMap: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'video/mp4': '.mp4', 'application/pdf': '.pdf', 'model/gltf-binary': '.glb' }
    if (mimeType && mimeMap[mimeType]) return mimeMap[mimeType]
    return { 'image': '.jpg', 'video': '.mp4', 'pdf': '.pdf', 'model': '.glb' }[fileType || ''] || ''
  }

  const ensureFileExtension = (fn: string, u: string, mt?: string, ft?: string) => { const e = getFileExtension(u, mt, ft); return e ? (/\.[a-zA-Z0-9]+$/.test(fn) ? fn.replace(/\.[^.]+$/, e) : `${fn}${e}`) : fn }

  const handleDownload = async (e: React.MouseEvent<any>, mu?: string, mv?: any) => {
    e.preventDefault(); const u = mu || latestUrl; const v = mv || latestVersion; if (!u) return
    const tid = toast.loading(`${t('common:status.loading')} 0%`)
    try {
      const xhr = new XMLHttpRequest(); xhr.open('GET', u, true); xhr.responseType = 'blob'
      xhr.onprogress = (ev) => { if (ev.lengthComputable) toast.loading(`${t('common:status.loading')} ${Math.round((ev.loaded / ev.total) * 100)}%`, { id: tid }) }
      xhr.onload = () => { if (xhr.status === 200) { const b = xhr.response; const url = window.URL.createObjectURL(b); const l = document.createElement('a'); l.href = url; l.download = ensureFileExtension(file.name, u, v?.metadata?.type, file.type); document.body.appendChild(l); l.click(); l.remove(); window.URL.revokeObjectURL(url); toast.success(t('common:status.success'), { id: tid }) } else { toast.error(t('common:status.error'), { id: tid }); window.open(u, '_blank') } }
      xhr.onerror = () => { toast.error(t('common:status.error'), { id: tid }); window.open(u, '_blank') }; xhr.send()
    } catch { toast.error(t('common:status.error'), { id: tid }); window.open(u, '_blank') }
  }

  const fileComments = (() => {
    if (!showOnlyCurrentTimeComments || !['video','sequence','pdf'].includes(file.type)) return allFileComments

    // Pass 1: find root/top-level comments that match current time
    const timeMatchIds = new Set<string>()
    const timeMatched = allFileComments.filter(c => {
      // Skip replies in first pass — they'll be handled in pass 2
      if (c.parentCommentId) return false

      // Comments without timestamp: check spatialContext for frame/time match
      if (c.timestamp === null || c.timestamp === undefined) {
        if (c.spatialContext) {
          if (file.type === 'sequence' && c.spatialContext.frameNumber !== undefined) {
            const match = c.spatialContext.frameNumber === currentFrame
            if (match) timeMatchIds.add(c.id)
            return match
          }
          if (file.type === 'video' && c.spatialContext.timestamp !== undefined) {
            const match = Math.abs(c.spatialContext.timestamp - currentTime) <= 2
            if (match) timeMatchIds.add(c.id)
            return match
          }
        }
        return false
      }
      let match = false
      if (file.type === 'video') match = Math.abs(c.timestamp - currentTime) <= 2
      else if (file.type === 'sequence') match = c.timestamp === currentFrame
      else if (file.type === 'pdf') match = c.timestamp === pdfPage
      else match = true
      if (match) timeMatchIds.add(c.id)
      return match
    })

    // Pass 2: include replies whose parent is in the matched set
    const replies = allFileComments.filter(c => c.parentCommentId && timeMatchIds.has(c.parentCommentId))

    return [...timeMatched, ...replies]
  })()

  const handleViewAnnotation = useCallback((ds: string, comment?: any) => {
    try {
      const p = JSON.parse(ds); const d = p.konva || p; const cam = p.camera
      setAnnotationData(d); setIsAnnotating(true); setIsReadOnly(true)
      if (comment) {
        setCurrentAnnotationCommentId(comment.id)
        if (comment.timestamp !== null) {
          if (file.type === 'video') { setCurrentTime(comment.timestamp); }
          else if (file.type === 'sequence') setCurrentFrame(Math.floor(comment.timestamp))
          else if (file.type === 'pdf') setPdfPage(Math.floor(comment.timestamp))
        }
      }
      if (file.type === 'model' && cam && glbViewerRef.current) requestAnimationFrame(() => glbViewerRef.current?.setCameraState(cam))
    } catch (e) {
      console.error('Failed to parse annotation data', e)
    }
  }, [file.type])

  const activeAnnotationComment = useMemo(() => {
    if (isAnnotating && !isReadOnly) return null
    return allFileComments.find(c => {
      if (!c.annotationData || c.timestamp === null) return false
      if (file.type === 'video') return Math.abs(c.timestamp - currentTime) <= Math.max(0.1, 1 / (videoFps || 30))
      if (file.type === 'sequence') return c.timestamp === currentFrame
      if (file.type === 'pdf') return c.timestamp === pdfPage
      return false
    })
  }, [currentTime, currentFrame, pdfPage, file.type, isAnnotating, isReadOnly, allFileComments, videoFps])

  useEffect(() => {
    if (activeAnnotationComment) {
      if (currentAnnotationCommentId !== activeAnnotationComment.id) {
        handleViewAnnotation(activeAnnotationComment.annotationData!, activeAnnotationComment)
      }
    } else if (isAnnotating && isReadOnly) {
      setIsAnnotating(false); setIsReadOnly(false); setAnnotationData(null); setCurrentAnnotationCommentId(null)
    }
  }, [activeAnnotationComment, isAnnotating, isReadOnly, currentAnnotationCommentId, handleViewAnnotation])

  const handleTimestampClick = (t: number) => { 
    if (file.type === 'video') { setCurrentTime(t); } 
    else if (file.type === 'sequence') setCurrentFrame(Math.floor(t))
    else if (file.type === 'pdf') setPdfPage(Math.floor(t))
  }

  const handleStartAnnotating = () => { setIsAnnotating(true); setIsReadOnly(false); setAnnotationData([]); setAnnotationHistory([[]]); setAnnotationHistoryIndex(0) }
  const handleDoneAnnotating = () => { setIsAnnotating(false); if (isReadOnly) { setIsReadOnly(false); setAnnotationData(null); setCurrentAnnotationCommentId(null) } }
  const saveToHistory = (nd: AnnotationObject[]) => { const h = annotationHistory.slice(0, annotationHistoryIndex + 1); h.push(nd); if (h.length > 50) h.shift(); setAnnotationHistory(h); setAnnotationHistoryIndex(h.length - 1) }
  const handleAnnotationChange = (nd: AnnotationObject[] | null) => { if (nd) { setAnnotationData(nd); saveToHistory(nd) } }
  const handleClearAnnotations = () => { setConfirmClearOpen(true) }
  const handleActualClearAnnotations = () => { setAnnotationData([]); saveToHistory([]); setConfirmClearOpen(false) }
  const handleAnnotationUndo = () => { if (annotationHistoryIndex > 0) { const i = annotationHistoryIndex - 1; setAnnotationHistoryIndex(i); setAnnotationData(annotationHistory[i]) } }
  const handleAnnotationRedo = () => { if (annotationHistoryIndex < annotationHistory.length - 1) { const i = annotationHistoryIndex + 1; setAnnotationHistoryIndex(i); setAnnotationData(annotationHistory[i]) } }

  const handleSaveRenderSettings = async (s: any) => { if (file) await useFileStore.getState().updateModelSettings(file.projectId, file.id, currentVersion, s) }

  useEffect(() => {
    if (!isResizing) return
    const mm = (e: MouseEvent) => setCommentWidth(Math.min(800, Math.max(280, resizingState.current.startWidth + (resizingState.current.startX - e.clientX))))
    const mu = () => { setIsResizing(false); document.body.style.cursor = ''; document.getElementById('resize-overlay-guard')?.remove() }
    if (!document.getElementById('resize-overlay-guard')) {
      const o = document.createElement('div'); o.id = 'resize-overlay-guard'; o.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;cursor:col-resize;'; document.body.appendChild(o)
    }
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu)
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); document.getElementById('resize-overlay-guard')?.remove() }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); resizingState.current = { startX: e.clientX, startWidth: commentWidth }; document.body.style.cursor = 'col-resize' }

  const [localFrameCaptions, setLocalFrameCaptions] = useState<Record<number, string> | undefined>()
  const effectiveFrameCaptions = localFrameCaptions || current?.frameCaptions
  useEffect(() => setLocalFrameCaptions(current?.frameCaptions), [current?.frameCaptions])

  const handleCaptionChangeWithLocalUpdate = async (fileId: string, version: number, frame: number, caption: string) => { setLocalFrameCaptions(prev => ({ ...prev, [frame]: caption })); await onCaptionChange?.(fileId, version, frame, caption) }
  const handleReorderFrames = async (no: number[]) => { if (file && current) { const nu = no.map(i => (current.sequenceUrls || [])[i]); const nc: Record<number, string> = {}; no.forEach((o, n) => { if (effectiveFrameCaptions?.[o]) nc[n] = effectiveFrameCaptions[o] }); setOptimisticSequenceData({ urls: nu, captions: nc }); await reorderSequenceFrames(file.projectId, file.id, current.version, no) } }

  const renderAnnotationOverlay = () => (!isAnnotating || sequenceViewMode === 'grid') ? null : <AnnotationCanvasKonva mode={isReadOnly ? 'read' : 'edit'} data={annotationData || []} tool={annotationTool} color={annotationColor} strokeWidth={annotationStrokeWidth} onChange={d => !isReadOnly && handleAnnotationChange(d)} />

  const renderFilePreview = () => {
    if (!effectiveUrl) return <div className="p-8 text-center text-muted-foreground">{t('errors.loadFailed')}</div>
    if (current?.validationStatus === 'infected') return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-destructive uppercase tracking-tight">{t('security.infected')}</h3>
        <p className="text-muted-foreground leading-relaxed">{t('security.infectedDesc')}</p>
      </div>
    )
    const isPdf = file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf') || current?.metadata?.type === 'application/pdf'
    if (isPdf) return <PDFPreviewMode url={effectiveUrl} currentPage={pdfPage} onPageChange={p => { setPdfPage(p); setCurrentFrame(p) }} annotationOverlay={renderAnnotationOverlay()} allFileComments={allFileComments} fileComments={fileComments} isDropPinMode={isDropPinMode} dropPinCoordinates={dropPinCoordinates} setDropPinCoordinates={setDropPinCoordinates} />
    if (file.type === 'image') {
      if (compareMode) return <ImageCompareMode uniqueVersions={uniqueVersions} currentVersion={currentVersion} resolvedUrl={resolvedUrl} sequenceContext={sequenceContext} leftVersion={leftVersion} rightVersion={rightVersion} setLeftVersion={setLeftVersion} setRightVersion={setRightVersion} compareDisplayMode={compareDisplayMode} setCompareDisplayMode={setCompareDisplayMode} comparePosition={comparePosition} setComparePosition={setComparePosition} zoomPanBind={zoomPanBind} zoom={zoom} panOffset={panOffset} handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} resetZoomPan={resetZoomPan} />
      return <StandardImagePreview file={file} current={current} effectiveUrl={effectiveUrl} zoom={zoom} panOffset={panOffset} zoomPanBind={zoomPanBind} renderAnnotationOverlay={renderAnnotationOverlay} sequenceFullscreen={sequenceFullscreen} sequenceFullscreenRef={sequenceFullscreenRef as any} frameDetailView={frameDetailView} sequenceContext={sequenceContext} reactivePickedFrames={reactivePickedFrames} isAdmin={isAdmin} projectId={_projectId} handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} resetZoomPan={resetZoomPan} fileComments={fileComments} isDropPinMode={isDropPinMode} setIsDropPinMode={setIsDropPinMode} dropPinCoordinates={dropPinCoordinates} setDropPinCoordinates={setDropPinCoordinates} />
    }
    if (file.type === 'sequence') {
      const u = optimisticSequenceData?.urls || current?.sequenceUrls || []
      return <PickableImageSequenceViewer urls={u} lastModified={current?.metadata?.lastModified} fps={current?.metadata?.duration && current?.frameCount ? Math.round(current.frameCount / current.metadata.duration) : 24} currentFrame={currentFrame} onFrameChange={setCurrentFrame} className="viewport" isAdmin={isAdmin} defaultViewMode={file.sequenceViewMode || 'video'} onViewModeChange={m => { setSequenceViewMode(m); onSequenceViewModeChange?.(file.id, m) }} frameCaptions={optimisticSequenceData?.captions || effectiveFrameCaptions} onCaptionChange={handleCaptionChangeWithLocalUpdate} file={{ id: file.id, currentVersion: current.version, projectId: _projectId }} isAnnotating={isAnnotating} annotationData={annotationData} annotationTool={annotationTool} annotationColor={annotationColor} annotationStrokeWidth={annotationStrokeWidth} isAnnotationReadOnly={isReadOnly} onAnnotationChange={handleAnnotationChange} onAnnotationUndo={handleAnnotationUndo} onAnnotationRedo={handleAnnotationRedo} onClearAnnotations={handleClearAnnotations} onDoneAnnotating={handleDoneAnnotating} canUndoAnnotation={annotationHistoryIndex > 0} canRedoAnnotation={annotationHistoryIndex < annotationHistory.length - 1} onStartAnnotating={f => { setCurrentFrame(f); setIsAnnotating(true); setIsReadOnly(false) }} onFrameDetailView={f => setFrameDetailView(f)} onReorderFrames={handleReorderFrames} onDeleteFrames={i => deleteSequenceFrames(file.projectId, file.id, current.version, i)} onAddFrames={fls => addSequenceFrames(file.projectId, file.id, current.version, fls)} isUploading={uploading} externalIsFullscreen={sequenceFullscreen.isFullscreen} onToggleFullscreen={sequenceFullscreen.toggle} externalFullscreenRef={sequenceFullscreenRef as any} allFileComments={allFileComments} fileComments={fileComments} isDropPinMode={isDropPinMode} dropPinCoordinates={dropPinCoordinates} setDropPinCoordinates={setDropPinCoordinates} showOnlyCurrentTimeComments={showOnlyCurrentTimeComments} setShowOnlyCurrentTimeComments={setShowOnlyCurrentTimeComments} />
    }
    if (file.type === 'video') {
      const m = allFileComments.filter(c => c.timestamp !== null).sort((a,b) => a.timestamp! - b.timestamp!)
      if (videoComparison.isComparing && videoComparison.secondaryUrl) return <VideoCompareMode videoComparison={videoComparison} currentVersion={currentVersion} uniqueVersions={uniqueVersions} effectiveUrl={effectiveUrl} handleTimeUpdate={handleTimeUpdate} />
      const driveInfo = driveFileId ? { id: driveFileId } : null
      return <StandardVideoPreview file={file} effectiveUrl={effectiveUrl} allFileComments={allFileComments} fileComments={fileComments} currentTime={currentTime} videoFps={videoFps} videoDuration={videoDuration} navMode={navMode} setNavMode={setNavMode} isPlaying={isPlaying} driveInfo={driveInfo} handleTimeUpdate={handleTimeUpdate} handleCommentMarkerClick={c => { setCurrentTime(c.timestamp || 0); if (c.annotationData) handleViewAnnotation(c.annotationData, c) }} handleFullscreenChange={handleFullscreenChange} handleLoadedMetadata={handleLoadedMetadata} handleVideoPlay={handleVideoPlay} handleVideoPause={handleVideoPause} renderAnnotationOverlay={renderAnnotationOverlay} handleNextFrame={() => setCurrentTime(p => Math.min(videoDuration, p + 1/videoFps))} handlePrevFrame={() => setCurrentTime(p => Math.max(0, p - 1/videoFps))} handleSkipForward={() => setCurrentTime(p => Math.min(videoDuration, p+5))} handleSkipBackward={() => setCurrentTime(p => Math.max(0, p-5))} handleNextMarker={() => { const n = m.find(x => x.timestamp! > currentTime); if (n) setCurrentTime(n.timestamp!) }} handlePrevMarker={() => { const p = [...m].reverse().find(x => x.timestamp! < currentTime); if (p) setCurrentTime(p.timestamp!) }} handleFirstMarker={() => m.length > 0 && setCurrentTime(m[0].timestamp!)} handleLastMarker={() => m.length > 0 && setCurrentTime(m[m.length-1].timestamp!)} isDropPinMode={isDropPinMode} dropPinCoordinates={dropPinCoordinates} setDropPinCoordinates={setDropPinCoordinates} />
    }
    if (file.type === 'model') return <div className="relative h-[70vh] w-full"><Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">{t('common:status.loading')}</div>}><GLBViewer ref={glbViewerRef} url={effectiveUrl} className="w-full h-full" initialCameraState={current?.cameraState} isAdmin={isAdmin} initialRenderSettings={current?.renderSettings} onSaveSettings={handleSaveRenderSettings} /></Suspense><SpatialCommentOverlay comments={fileComments} isDropPinMode={isDropPinMode} dropPinCoordinates={dropPinCoordinates} setDropPinCoordinates={setDropPinCoordinates} />{renderAnnotationOverlay()}{isAdmin && <div className="absolute top-4 right-4"><Button disabled={savingThumbnail} onClick={async () => { const cam = glbViewerRef.current?.getCameraState(); const snap = glbViewerRef.current?.captureScreenshot(); if (cam && snap) { setSavingThumbnail(true); try { await useFileStore.getState().setModelThumbnail(_projectId, file.id, currentVersion, snap, cam) } finally { setSavingThumbnail(false) } } }}>{savingThumbnail ? t('common:status.loading') : 'Set Thumbnail'}</Button></div>}</div>
    return <div className="p-8 text-center text-muted-foreground">Không hỗ trợ xem loại file này</div>
  }


  return (
    <>
      {isMobile && open && createPortal(
        <MobileFileViewLayout
          file={file} current={current} effectiveUrl={effectiveUrl} renderFilePreview={renderFilePreview} comments={fileComments} currentUserName={currentUserName} onUserNameChange={onUserNameChange}
          onAddComment={async (u, c, t, p, a, att) => {
            const dts = annotationData?.length && !isReadOnly ? JSON.stringify({ konva: annotationData, camera: glbViewerRef.current?.getCameraState() }) : a
            await onAddComment(u, c, t, p, dts, att)
            if (annotationData?.length && !isReadOnly) { setAnnotationData(null); setIsAnnotating(false); }
            if (isDropPinMode) { setDropPinCoordinates(null); }
          }}
          onResolveToggle={onResolveToggle} onEditComment={onEditComment} onDeleteComment={onDeleteComment} onTimestampClick={handleTimestampClick} onViewAnnotation={handleViewAnnotation} isAdmin={isAdmin} isLocked={file.isCommentsLocked || project?.isCommentsLocked || isArchived} viewAllVersions={viewAllVersions} onViewAllVersionsChange={setViewAllVersions} currentTimestamp={file.type === 'video' ? currentTime : (file.type === 'sequence' ? currentFrame : undefined)} currentTimeRef={currentTimeRef} onClose={() => onOpenChange(false)} onDownload={handleDownload} onShare={copyShareLink} uniqueVersions={uniqueVersions} currentVersion={currentVersion} onSwitchVersion={onSwitchVersion}
          isDropPinMode={isDropPinMode} setIsDropPinMode={setIsDropPinMode}
          dropPinCoordinates={dropPinCoordinates} setDropPinCoordinates={setDropPinCoordinates}
        />, portalContainer || document.body
      )}

      {!isMobile && (
        <DesktopFileViewLayout 
            {...props} 
            open={open} 
            onOpenChange={onOpenChange} 
            file={file} 
            current={current} 
            _projectId={_projectId} 
            currentVersion={currentVersion} 
            uniqueVersions={uniqueVersions} 
            isAdmin={isAdmin} 
            deleteVersion={deleteVersion} 
            setShowUploadDialog={setShowUploadDialog} 
            handleDownload={handleDownload} 
            getFileTypeIcon={getFileTypeIcon} 
            getFileTypeLabel={getFileTypeLabel} 
            formatFileSize={formatFileSize} 
            ensureFileExtension={ensureFileExtension} 
            uploadDate={uploadDate} 
            sequenceContext={sequenceContext} 
            latestUrl={latestUrl} 
            latestVersion={latestVersion} 
            handleStartTour={handleStartTour} 
            videoComparison={videoComparison} 
            showComments={showComments} 
            setShowComments={setShowComments} 
            compareMode={compareMode} 
            setCompareMode={setCompareMode} 
            getShareLink={getShareLink} 
            copyShareLink={copyShareLink} 
            copied={copied} 
            handleDragOver={handleDragOver} 
            handleDragLeave={handleDragLeave} 
            handleDrop={handleDrop} 
            renderFilePreview={renderFilePreview} 
            isAnnotating={isAnnotating} 
            isReadOnly={isReadOnly} 
            handleStartAnnotating={handleStartAnnotating} 
            handleDoneAnnotating={handleDoneAnnotating} 
            showOnlyCurrentTimeComments={showOnlyCurrentTimeComments} 
            setShowOnlyCurrentTimeComments={setShowOnlyCurrentTimeComments} 
            isVideoFullscreen={isVideoFullscreen} 
            handleResizeStart={handleResizeStart} 
            project={project} 
            isArchived={isArchived} 
            viewAllVersions={viewAllVersions} 
            setViewAllVersions={setViewAllVersions} 
            fileComments={fileComments} 
            currentUserName={currentUserName} 
            onUserNameChange={onUserNameChange} 
            onResolveToggle={onResolveToggle} 
            handleTimestampClick={handleTimestampClick} 
            handleViewAnnotation={handleViewAnnotation} 
            onAddComment={onAddComment} 
            onEditComment={onEditComment} 
            onDeleteComment={onDeleteComment} 
            annotationData={annotationData} 
            glbViewerRef={glbViewerRef} 
            setAnnotationData={setAnnotationData} 
            setIsAnnotating={setIsAnnotating} 
            currentTime={currentTime} 
            currentTimeRef={currentTimeRef} 
            currentFrame={currentFrame} 
            commentWidth={commentWidth} 
            annotationTool={annotationTool} 
            setAnnotationTool={setAnnotationTool} 
            annotationColor={annotationColor} 
            setAnnotationColor={setAnnotationColor} 
            annotationStrokeWidth={annotationStrokeWidth} 
            setAnnotationStrokeWidth={setAnnotationStrokeWidth} 
            handleAnnotationUndo={handleAnnotationUndo} 
            handleAnnotationRedo={handleAnnotationRedo} 
            handleClearAnnotations={handleClearAnnotations}
            annotationHistoryIndex={annotationHistoryIndex} 
            annotationHistory={annotationHistory} 
            portalContainer={portalContainer}
            fullscreenPortalTarget={sequenceFullscreen.isFullscreen ? sequenceFullscreenRef.current : null}
            isDropPinMode={isDropPinMode}
            setIsDropPinMode={setIsDropPinMode}
            dropPinCoordinates={dropPinCoordinates}
            setDropPinCoordinates={setDropPinCoordinates}
          />
      )}

      {file?.type === 'sequence' && frameDetailView !== null && (() => {
        const u = current?.sequenceUrls || []
        return <FileViewDialogShared file={{ ...file, type: 'image', name: `${file.name} - F${frameDetailView + 1}` }} projectId={_projectId} resolvedUrl={u[frameDetailView]} open={frameDetailView !== null} onOpenChange={o => !o && setFrameDetailView(null)} comments={allFileComments.filter(c => c.timestamp === frameDetailView)} currentUserName={currentUserName} onUserNameChange={onUserNameChange} onAddComment={async (usr, cn, _t, p, a, att) => onAddComment(usr, cn, frameDetailView, p, a, att)} onResolveToggle={onResolveToggle} onEditComment={onEditComment} onDeleteComment={onDeleteComment} isAdmin={isAdmin} onCaptionChange={onCaptionChange ? async (fid, v, _fr, cap) => onCaptionChange(fid, v, frameDetailView, cap) : undefined} sequenceContext={{ totalFrames: u.length, currentFrameIndex: frameDetailView, frameCaptions: current?.frameCaptions, onNavigateFrame: idx => setFrameDetailView(idx) }} initialFullscreen={sequenceFullscreen.isFullscreen} portalContainer={sequenceFullscreen.isFullscreen ? (sequenceFullscreenRef.current || (typeof document !== 'undefined' ? (document.fullscreenElement as HTMLElement) : undefined)) : undefined} />
      })()}
      <UploadDialog projectId={_projectId} existingFileId={file.id} existingFileType={file.type} open={showUploadDialog} onOpenChange={setShowUploadDialog} initialFiles={droppedFiles} trigger={<span className="hidden" />} />
      <DragDropUpdateOverlay isDragOver={isDragOver} />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title={t('comments.resolve') + "?"}
        description={t('fileView:tour.stopDesc')}
        confirmText={t('common:actions.delete')}
        variant="destructive"
        onConfirm={handleActualClearAnnotations}
      />

    </>
  )
}
