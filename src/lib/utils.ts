import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function getDomainFromUrl(url: string): string {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    return new URL(urlWithProtocol).hostname
  } catch {
    return ''
  }
}

export function getFaviconUrl(url: string): string | null {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
    const parsedUrl = new URL(urlWithProtocol)
    const hostname = parsedUrl.hostname.toLowerCase()
    const pathname = parsedUrl.pathname.toLowerCase()
    
    if (hostname.includes('docs.google.com')) {
      if (pathname.includes('/document')) return 'https://ssl.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png'
      if (pathname.includes('/spreadsheets')) return 'https://ssl.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png'
      if (pathname.includes('/presentation')) return 'https://ssl.gstatic.com/images/branding/product/1x/slides_2020q4_48dp.png'
      if (pathname.includes('/forms')) return 'https://ssl.gstatic.com/images/branding/product/1x/forms_2020q4_48dp.png'
      return 'https://ssl.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png'
    }
    
    if (hostname.includes('drive.google.com')) {
      return 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png'
    }

    if (hostname.includes('figma.com')) {
      return 'https://static.figma.com/app/icon/1/favicon.svg'
    }
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'https://www.youtube.com/s/desktop/106ca5e3/img/favicon_96x96.png'
    }

    // Default fallback to Google Favicon API cho mọi domain
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch {
    return null
  }
}
