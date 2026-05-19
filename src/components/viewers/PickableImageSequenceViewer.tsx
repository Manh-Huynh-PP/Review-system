import { useFileStore } from '@/stores/files'
import { ImageSequenceViewer } from './ImageSequenceViewer'
import { FramePickOverlay } from './FramePickOverlay'
import type { AnnotationObject } from '@/types'

interface PickableImageSequenceViewerProps {
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
  file: { id: string; currentVersion: number; projectId: string }
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
  // Grid edit mode callbacks
  onReorderFrames?: (newOrder: number[]) => void
  onDeleteFrames?: (indices: number[]) => void
  onAddFrames?: (files: File[]) => void
  isUploading?: boolean
  // External fullscreen control
  externalIsFullscreen?: boolean
  onToggleFullscreen?: () => void
  externalFullscreenRef?: React.RefObject<HTMLDivElement | null>
  lastModified?: string | number
  allFileComments?: any[]
  fileComments?: any[]
  isDropPinMode?: boolean
  dropPinCoordinates?: any
  setDropPinCoordinates?: (coords: any) => void
  showOnlyCurrentTimeComments?: boolean
  setShowOnlyCurrentTimeComments?: (show: boolean) => void
}
export function PickableImageSequenceViewer(props: PickableImageSequenceViewerProps) {
  const { file, isAdmin } = props
  const files = useFileStore((state) => state.files)
  const togglePickedFrame = useFileStore((state) => state.togglePickedFrame)

  // Find the current file in the store to get the pickedFrames state
  const currentFile = files.find((f) => f.id === file.id)
  const currentVersionData = currentFile?.versions.find((v) => v.version === file.currentVersion)
  const pickedFrames = currentVersionData?.pickedFrames || {}

  const handleTogglePick = (frameIndex: number, isPicked: boolean) => {
    togglePickedFrame(file.projectId, file.id, file.currentVersion, frameIndex, isPicked)
  }

  const renderFrameOverlay = (frameIndex: number) => {
    const isPicked = !!pickedFrames[frameIndex]
    
    // Admin can see all picks, Client can toggle
    return (
      <FramePickOverlay 
        isPicked={isPicked} 
        onToggle={() => handleTogglePick(frameIndex, !isPicked)} 
        isAdminView={isAdmin}
      />
    )
  }

  return (
    <ImageSequenceViewer 
      {...props} 
      renderFrameOverlay={renderFrameOverlay}
      externalIsFullscreen={props.externalIsFullscreen}
      onToggleFullscreen={props.onToggleFullscreen}
      allFileComments={props.allFileComments}
      fileComments={props.fileComments}
      isDropPinMode={props.isDropPinMode}
      dropPinCoordinates={props.dropPinCoordinates}
      setDropPinCoordinates={props.setDropPinCoordinates}
    />
  )
}
