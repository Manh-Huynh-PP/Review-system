import React from 'react'
import { CustomVideoPlayer, type CustomVideoPlayerRef } from '@/components/viewers/CustomVideoPlayer'
import { VideoFrameControls } from '@/components/viewers/VideoFrameControls'
import { SpatialCommentOverlay } from '@/components/comments/SpatialCommentOverlay'
import type { DropPinCoordinates } from '@/types'

interface Props {
  file: any
  effectiveUrl: string
  allFileComments: any[]
  fileComments?: any[]
  currentTime: number
  videoFps: number
  videoDuration: number | null
  navMode: 'frame' | 'marker'
  setNavMode: (mode: 'frame' | 'marker') => void
  isPlaying: boolean
  driveInfo: any
  
  handleTimeUpdate: (time: number) => void
  handleCommentMarkerClick: (comment: any) => void
  handleFullscreenChange: (isFullscreen: boolean) => void
  handleLoadedMetadata: (duration: number, fps: number) => void
  handleVideoPlay: () => void
  handleVideoPause: () => void
  renderAnnotationOverlay: () => React.ReactNode
  
  // Spatial Comments
  isDropPinMode?: boolean
  dropPinCoordinates?: DropPinCoordinates | null
  setDropPinCoordinates?: (coords: DropPinCoordinates | null) => void

  // Handlers for controls
  handleNextFrame: () => void
  handlePrevFrame: () => void
  handleSkipForward: () => void
  handleSkipBackward: () => void
  handleNextMarker: () => void
  handlePrevMarker: () => void
  handleFirstMarker: () => void
  handleLastMarker: () => void
}

export function StandardVideoPreview({
  effectiveUrl,
  allFileComments,
  fileComments = [],
  currentTime,
  videoFps,
  navMode,
  setNavMode,
  isPlaying,
  driveInfo,
  handleTimeUpdate,
  handleCommentMarkerClick,
  handleFullscreenChange,
  handleLoadedMetadata,
  handleVideoPlay,
  handleVideoPause,
  renderAnnotationOverlay,
  isDropPinMode,
  dropPinCoordinates,
  setDropPinCoordinates,
  handleNextFrame,
  handlePrevFrame,
  handleSkipForward,
  handleSkipBackward,
  handleNextMarker,
  handlePrevMarker,
  handleFirstMarker,
  handleLastMarker
}: Props) {
  const customVideoPlayerRef = React.useRef<CustomVideoPlayerRef>(null)
  const isDriveVideo = !!driveInfo

  return (
    <div className="space-y-2 sm:space-y-3 w-full h-full flex flex-col">
      {/* Video Player Area */}
      <div className="relative bg-black flex-1 min-h-0 overflow-hidden">
        {!isDriveVideo ? (
          <>
            <CustomVideoPlayer
              ref={customVideoPlayerRef}
              src={effectiveUrl}
              comments={allFileComments}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              onCommentMarkerClick={handleCommentMarkerClick}
              onFullscreenChange={handleFullscreenChange}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              className="w-full h-full"
              dropPinCoordinates={dropPinCoordinates}
              isDropPinMode={isDropPinMode}
            />
            {/* Spatial Comments */}
            <SpatialCommentOverlay
              comments={fileComments}
              isDropPinMode={isDropPinMode}
              dropPinCoordinates={dropPinCoordinates}
              setDropPinCoordinates={setDropPinCoordinates}
            />
            {!isPlaying && renderAnnotationOverlay()}
          </>
        ) : (
          <div className="flex flex-col h-full bg-black relative">
            <div className="flex-1">
              <iframe
                src={`https://drive.google.com/file/d/${driveInfo.id}/preview`}
                className="w-full h-full border-0 pointer-events-auto"
                style={{ touchAction: 'manipulation' }}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                title="Google Drive Preview"
              />
            </div>
            {/* External Link for Drive */}
            <a
              href={`https://drive.google.com/file/d/${driveInfo.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 text-white rounded-md transition-colors"
              title="Mở trong Google Drive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        )}
      </div>

      {/* Frame Controls + Filter/Comment Toggle on Mobile */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <VideoFrameControls
              onNextFrame={handleNextFrame}
              onPrevFrame={handlePrevFrame}
              onSkipForward={handleSkipForward}
              onSkipBackward={handleSkipBackward}
              onNextMarker={handleNextMarker}
              onPrevMarker={handlePrevMarker}
              onFirstMarker={handleFirstMarker}
              onLastMarker={handleLastMarker}
              currentFps={videoFps}
              mode={navMode}
              onModeChange={setNavMode}
            />
          </div>

          {/* Mobile: Filter Toggle + Mode Toggle is handled in MobileFileViewLayout for mobile, 
              but we keep this for consistency if needed on small screens in desktop view */}
        </div>
      </div>
    </div>
  )
}
