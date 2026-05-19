import React from 'react'
import { PDFViewer } from '@/components/viewers/PDFViewer'
import { SpatialCommentOverlay } from '@/components/comments/SpatialCommentOverlay'

interface PDFPreviewModeProps {
  url: string
  currentPage: number
  onPageChange: (page: number) => void
  annotationOverlay: React.ReactNode
  allFileComments?: any[]
  fileComments?: any[]
  isDropPinMode?: boolean
  dropPinCoordinates?: any
  setDropPinCoordinates?: (coords: any) => void
}

/**
 * PDF Preview component that wraps PDFViewer with specific container styling and annotation support.
 * Separated to reduce the complexity of the main renderFilePreview function.
 */
export function PDFPreviewMode({
  url,
  currentPage,
  onPageChange,
  annotationOverlay,
  allFileComments = [],
  fileComments = [],
  isDropPinMode,
  dropPinCoordinates,
  setDropPinCoordinates
}: PDFPreviewModeProps) {
  return (
    <div className="relative h-full min-h-[500px] w-full bg-muted/20">
      <PDFViewer
        url={url}
        currentPage={currentPage}
        onPageChange={onPageChange}
        className="w-full h-full"
      >
        <SpatialCommentOverlay
          comments={fileComments.length > 0 ? fileComments : allFileComments.filter((c: any) => c.frameIndex === currentPage || c.frameIndex === undefined)}
          isDropPinMode={isDropPinMode}
          dropPinCoordinates={dropPinCoordinates}
          setDropPinCoordinates={setDropPinCoordinates}
        />
        {annotationOverlay}
      </PDFViewer>
    </div>
  )
}
