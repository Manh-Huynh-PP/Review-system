import { forwardRef, memo } from 'react'
import { VideoOverlayContainer, SafeZoneOverlay, CompositionOverlay, type CompositionGuide } from './overlays'
import { Loader2 } from 'lucide-react'
import { parseDriveUrl } from '@/utils/googleDrive'

interface VideoDisplayAreaProps {
    src: string
    isFullscreen: boolean
    isBuffering: boolean
    activeSafeZone: string | null
    activeGuides: CompositionGuide[]
    videoRatio: number
    guideColor: string
    overlayOpacity: number
    onClick: () => void
    onDoubleClick: () => void
    onError?: (e: any) => void
}

const VideoDisplayAreaComponent = forwardRef<HTMLVideoElement, VideoDisplayAreaProps>(({
    src,
    isFullscreen,
    isBuffering,
    activeSafeZone,
    activeGuides,
    videoRatio,
    guideColor,
    overlayOpacity,
    onClick,
    onDoubleClick,
    onError
}, ref) => {
    // Drive links don't support CORS headers, so we must disable crossOrigin for them
    // This means we won't be able to export frames for Drive videos (tainted canvas),
    // but the video will actually play.
    const isDrive = !!parseDriveUrl(src)
    const crossOrigin = isDrive ? undefined : "anonymous"

    return (
        <>
            <video
                key={src}
                ref={ref}
                crossOrigin={crossOrigin}
                playsInline
                webkit-playsinline=""
                preload="metadata"
                className="w-full h-auto bg-black"
                style={isFullscreen ? {
                    maxHeight: 'calc(100vh - 120px)',
                    objectFit: 'contain'
                } : undefined}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onError={onError}
            >
                {src && <source src={src} type="video/mp4" />}
            </video>

            {/* Loading Spinner */}
            {isBuffering && (
                <div className="loading-overlay">
                    <Loader2 className="loading-spinner" />
                </div>
            )}

            {/* Video Overlays (Safe Zone + Composition Guides) */}
            <VideoOverlayContainer videoRef={ref as React.RefObject<HTMLVideoElement>}>
                <SafeZoneOverlay safeZoneUrl={activeSafeZone} opacity={overlayOpacity} />
                <CompositionOverlay
                    activeGuides={activeGuides}
                    videoRatio={videoRatio}
                    color={guideColor}
                    opacity={overlayOpacity}
                />
            </VideoOverlayContainer>
        </>
    )
})

export const VideoDisplayArea = memo(VideoDisplayAreaComponent)
