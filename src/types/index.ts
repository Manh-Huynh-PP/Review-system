import { Timestamp } from 'firebase/firestore'

export type FileType = 'image' | 'video' | 'model'
export type ProjectStatus = 'active' | 'archived'

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
}

export interface FileVersion {
  url: string
  version: number
  uploadedAt: Timestamp
  metadata: {
    size: number
    type: string
    name: string
    lastModified?: number
    width?: number
    height?: number
    duration?: number
  }
}

export interface File {
  id: string
  projectId: string
  name: string
  type: FileType
  versions: FileVersion[]
  currentVersion: number
  createdAt: Timestamp
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
