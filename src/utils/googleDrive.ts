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

export function getDirectImageUrl(fileId: string): string {
  // Using uc?export=view is more stable than the thumbnail endpoint for direct hotlinking
  return `https://drive.google.com/uc?export=view&id=${fileId}`
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
