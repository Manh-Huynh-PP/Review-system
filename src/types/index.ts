import { Timestamp } from 'firebase/firestore'

export type FileType = 'image' | 'video' | 'model' | 'sequence' | 'pdf'
export type ProjectStatus = 'active' | 'archived' | 'trash'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  adminEmail: string
}

export interface ArchiveLink {
  url: string
  title?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  clientId?: string
  clientName?: string // Cached for display
  clientEmail?: string // Cached for display
  deadline?: Timestamp
  tags?: string[]
  createdAt: Timestamp
  updatedAt?: Timestamp
  status: ProjectStatus
  adminEmail: string
  notificationEmails?: string[] // Emails to receive notifications (uses default if not set)
  // Archive fields
  archiveUrl?: string // Legacy single link
  archiveTitle?: string // Legacy single title
  archiveLinks?: ArchiveLink[] // Multiple storage links
  archivedAt?: Timestamp // When project was archived
  isDataCleared?: boolean // True if files were cleared (keeping thumbnails/comments)
  // Trash fields
  trashedAt?: Timestamp // When project was moved to trash
  previousStatus?: 'active' | 'archived' // To restore to correct state
  isCommentsLocked?: boolean
  accessLevel?: 'public' | 'token_required'
  colorLabels?: Record<string, string> // colorValue -> customLabel
  kanbanColumnOrder?: string[]
}

export interface ProjectInvitation {
  id: string
  projectId: string
  // Granular Access Control
  resourceType: 'project' | 'file'
  resourceId: string // projectId or fileId

  email: string
  token: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  createdAt: Timestamp
  expiresAt?: Timestamp
  // For Trigger Email Extension
  to?: string
  message?: {
    subject: string
    html: string
  }
  delivery?: {
    state: string
    startTime: Timestamp
    endTime: Timestamp
    error?: string
  }
  // Security: Device Binding
  allowedDevices: string[] // Array of authorized deviceIds
  verificationCode?: {
    code: string
    expiresAt: Timestamp
    attempts: number
  }
}

export interface FileVersion {
  url: string
  version: number
  uploadedAt: Timestamp
  sequenceUrls?: string[] // For image sequences
  sequenceMediaTypes?: ('image' | 'video')[] // Media type per frame (image or video) - parallel to sequenceUrls
  sequenceFileNames?: string[] // Original file names from Drive - parallel to sequenceUrls
  frameCount?: number // Number of frames in sequence
  frameCaptions?: Record<number, string> // Captions for each frame (frame index -> caption text)
  thumbnailUrl?: string // Custom thumbnail for 3D models
  shareThumbnailUrl?: string // Compressed thumbnail for social sharing (1200x630 JPEG, <1MB)
  cameraState?: { // Camera position for 3D models
    position: [number, number, number]
    target: [number, number, number]
  }
  // Extended version metadata
  versionLabel?: string // Human-readable version label (e.g., "Final", "Draft 1", "v2.1")
  versionNotes?: string // Optional notes about this version
  isLatest?: boolean // Computed field for UI convenience
  metadata: {
    size: number
    type: string
    name: string
    lastModified?: number
    width?: number
    height?: number
    duration?: number
  }
  validationStatus?: 'pending' | 'clean' | 'infected' | 'error'
  // External link support
  isExternal?: boolean
  externalUrl?: string // Original external URL (e.g. Google Drive link)
  externalProvider?: 'google_drive' | 'direct'
  // 3D Model Render Settings (Admin configured, applies to all viewers)
  renderSettings?: {
    toneMapping?: string // AgX, ACESFilmic, Reinhard, Cineon, Linear, NoToneMapping
    exposure?: number
    enablePostProcessing?: boolean
    bloomIntensity?: number
    envPreset?: string
    envIntensity?: number
    lightIntensity?: number
    gamma?: number
  }
  pickedFrames?: Record<number, boolean> // Frames picked by client (frame index -> true)
}

export interface File {
  id: string
  projectId: string
  name: string
  type: FileType
  versions: FileVersion[]
  currentVersion: number
  sequenceViewMode?: 'video' | 'carousel' | 'grid' // Admin-set view mode for sequences
  createdAt: Timestamp
  updatedAt?: Timestamp
  // External link flag
  isExternalLink?: boolean // Quick flag to identify files added via URL
  // Trash fields
  isTrashed?: boolean
  trashedAt?: Timestamp
  isCommentsLocked?: boolean
  cardBackgroundColor?: string
}

export type SpatialAnnotationType = 'pin' | 'region'

/** Coordinates for the drop-pin / region-draw gesture */
export interface DropPinCoordinates {
  x: number
  y: number
  w?: number       // Width in % (region only)
  h?: number       // Height in % (region only)
  screenX?: number
  screenY?: number
  type?: SpatialAnnotationType
}

export interface SpatialContext {
  viewerType: 'image' | 'video' | 'pdf' | '3d'
  // Spatial
  x_pct?: number
  y_pct?: number
  w_pct?: number  // Region width in %
  h_pct?: number  // Region height in %
  position3D?: { x: number; y: number; z: number }
  cameraState?: { position: [number, number, number]; target: [number, number, number] }
  
  // Temporal & Paging
  pageNumber?: number // For PDF
  timestamp?: number  // For Video (seconds)
  frameNumber?: number // For Image Sequence (index)
}

export interface Comment {
  id: string
  projectId: string
  fileId: string
  version: number
  userName: string
  content: string
  timestamp: number | null // seconds for video
  isResolved: boolean
  parentCommentId: string | null // For threading
  createdAt: Timestamp
  // --- Advanced features ---
  isPinned?: boolean
  spatialContext?: SpatialContext
  annotationData?: string | null // JSON.stringify(AnnotationObject[])
  // --- Image attachments ---
  imageUrls?: string[] // Firebase Storage URLs for attached images
  attachments?: {
    id: string
    type: 'image' | 'file'
    url: string
    name: string
    size: number
    mimeType?: string
    validationStatus?: 'pending' | 'clean' | 'infected' | 'error'
  }[]
  isPending?: boolean // Optimistic UI state
  isEdited?: boolean
  origin?: string // URL origin where comment was created (e.g. https://view.manhhuynh.work or http://localhost:5173)
  avatarUrl?: string // URL or path to avatar image
  avatarColor?: string // Background color for avatar
  updatedAt?: Timestamp
  reactions?: Record<string, string[]> // reactionType -> array of userIds
}

export interface AnnotationObject {
  id: string
  type: 'pen' | 'rect' | 'arrow' | 'text'
  color: string
  strokeWidth?: number
  // Normalized coordinates (0..1)
  points?: number[] // For 'pen' -> [x1,y1,x2,y2,...]
  x?: number
  y?: number
  w?: number
  h?: number
  startPoint?: { x: number; y: number }
  endPoint?: { x: number; y: number }
  // Text & transform fields
  text?: string
  fontSize?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
}

export type NotificationType = 'upload' | 'comment' | 'resolve'

export interface Notification {
  id: string
  type: NotificationType
  projectId: string
  projectName: string
  fileId?: string
  fileName?: string
  userName?: string
  message: string
  isRead: boolean
  createdAt: Timestamp
  adminEmail: string
}
