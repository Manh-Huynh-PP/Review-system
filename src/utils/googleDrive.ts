import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Parse a Google Drive URL to extract the ID and type (file or folder)
 */
export function parseDriveUrl(url: string): { type: 'file' | 'folder'; id: string } | null {
  if (!url) return null

  try {
    const u = new URL(url)
    if (!u.hostname.includes('drive.google.com') && !u.hostname.includes('docs.google.com')) {
      return null
    }

    // Folder: https://drive.google.com/drive/folders/{id}
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    if (folderMatch) {
      return { type: 'folder', id: folderMatch[1] }
    }

    // File: https://drive.google.com/file/d/{id}/...
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) {
      return { type: 'file', id: fileMatch[1] }
    }

    // Open: https://drive.google.com/open?id={id}
    const openId = u.searchParams.get('id')
    if (openId) {
      return { type: 'file', id: openId }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get a thumbnail URL for a Google Drive file with configurable size.
 * @param fileId - The Drive file ID
 * @param size - Width in pixels (default: 2000). Use smaller values (e.g. 800) for grid thumbnails to avoid rate-limiting.
 */
export function getDriveThumbnailUrl(fileId: string, size: number = 2000): string {
  // Use googleusercontent.com which is often more reliable for direct embedding
  return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`
}

/** @deprecated Use getDriveThumbnailUrl instead */
export function getDirectImageUrl(fileId: string): string {
  return getDriveThumbnailUrl(fileId, 2000)
}

/**
 * Extract the Google Drive file ID from any Drive URL format.
 * Returns null if the URL is not a recognized Drive format.
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || !url.includes('google.com')) return null

  // Format: thumbnail?id=...
  const thumbMatch = url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/)
  if (thumbMatch) return thumbMatch[1]

  // Format: uc?id=... or open?id=...
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]

  // Format: /file/d/... or /d/...
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (dMatch) return dMatch[1]

  return null
}

/**
 * Normalizes any Google Drive link to the best possible embeddable image URL.
 * Handles old 'uc' links, file share links, etc.
 * @param url - The Drive URL to normalize
 * @param size - Thumbnail width in pixels (default: 2000)
 */
export function normalizeDriveUrl(url: string, size: number = 2000): string {
  const fileId = extractDriveFileId(url)
  if (fileId) {
    return getDriveThumbnailUrl(fileId, size)
  }
  return url
}

/**
 * Get a direct download/stream URL from a Google Drive file ID
 * For videos, export=download is more effective for HTML5 <video> tag
 */
export function getDirectDownloadUrl(fileId: string): string {
  return `https://drive.google.com/u/0/uc?id=${fileId}&export=download`
}

/**
 * Detect the type of an external URL
 */
export function detectUrlType(url: string): 'image' | 'video' | 'pdf' | 'google_drive_file' | 'google_drive_folder' | 'unknown' {
  // Check Google Drive folder first
  const driveInfo = parseDriveUrl(url)
  if (driveInfo) {
    if (driveInfo.type === 'folder') return 'google_drive_folder'
    
    // If it's a file, try to guess the type from the URL string (often contains name or ext)
    const lowerUrl = url.toLowerCase()
    if (/\.(mp4|webm|mov|avi|mkv|m4v)/i.test(lowerUrl)) return 'video'
    if (/\.(pdf)/i.test(lowerUrl)) return 'pdf'
    
    return 'google_drive_file'
  }

  try {
    const u = new URL(url)
    const path = u.pathname.toLowerCase()

    // Image extensions
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff?)$/i.test(path)) return 'image'

    // Video extensions
    if (/\.(mp4|webm|mov|avi|mkv)$/i.test(path)) return 'video'

    // PDF
    if (/\.pdf$/i.test(path)) return 'pdf'
  } catch {
    // Invalid URL
  }

  return 'unknown'
}

export interface DriveFileInfo {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  webContentLink?: string
}

/**
 * Call the Cloud Function to list files in a Google Drive folder
 * Requires authenticated admin user
 */
export async function listDriveFolder(folderId: string): Promise<DriveFileInfo[]> {
  const callable = httpsCallable<{ folderId: string }, { files: DriveFileInfo[] }>(
    functions,
    'listDriveFolder'
  )

  const result = await callable({ folderId })
  return result.data.files
}
