import React from 'react'
import { PDFViewer } from '@/components/viewers/PDFViewer'

interface PDFPreviewModeProps {
  url: string
  currentPage: number
  onPageChange: (page: number) => void
  annotationOverlay: React.ReactNode
}

/**
 * PDF Preview component that wraps PDFViewer with specific container styling and annotation support.
 * Separated to reduce the complexity of the main renderFilePreview function.
 */
export function PDFPreviewMode({
  url,
  currentPage,
  onPageChange,
  annotationOverlay
}: PDFPreviewModeProps) {
  return (
    <div className="relative h-full min-h-[500px] w-full bg-muted/20">
      <PDFViewer
        url={url}
        currentPage={currentPage}
        onPageChange={onPageChange}
        className="w-full h-full"
      >
        {annotationOverlay}
      </PDFViewer>
    </div>
  )
}
