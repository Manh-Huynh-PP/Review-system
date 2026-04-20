import React from 'react'
import { CustomVideoPlayer, type CustomVideoPlayerRef } from '@/components/viewers/CustomVideoPlayer'
import { VideoFrameControls } from '@/components/viewers/VideoFrameControls'

interface Props {
  file: any
  effectiveUrl: string
  allFileComments: any[]
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

  return (
    <div className="space-y-2 sm:space-y-3 w-full h-full flex flex-col">
      {/* Video Player - Better space utilization */}
      <div className="relative bg-black flex-1 min-h-0 overflow-hidden">
        {driveInfo ? (
          <div className="flex flex-col h-full bg-black relative">
            <div className="flex-1">
              <iframe
                src={`https://drive.google.com/file/d/${driveInfo.id}/preview`}
                className="w-full h-full border-0"
                allow="autoplay"
                title="Google Drive Preview"
              />
            </div>
          </div>
        ) : (
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
            />
            {!isPlaying && renderAnnotationOverlay()}
          </>
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
