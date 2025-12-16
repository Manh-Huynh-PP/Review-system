import { useState, useEffect, type ReactNode } from 'react'

interface VideoOverlayContainerProps {
    videoRef: React.RefObject<HTMLVideoElement | null>
    children: ReactNode
}

interface OverlayDimensions {
    width: number
    height: number
    offsetX: number
    offsetY: number
    videoRatio: number // Intrinsic video aspect ratio
}

/**
 * Calculates the exact rendered dimensions of a video with object-fit: contain.
 * This ensures overlays align precisely with the video content, not the container.
 */
function calculateVideoDimensions(
    videoWidth: number,
    videoHeight: number,
    containerWidth: number,
    containerHeight: number
): OverlayDimensions {
    const videoRatio = videoWidth / videoHeight
    const containerRatio = containerWidth / containerHeight

    let renderWidth: number
    let renderHeight: number
    let offsetX: number
    let offsetY: number

    if (containerRatio > videoRatio) {
        // Container is wider than video - video is letterboxed horizontally
        renderHeight = containerHeight
        renderWidth = containerHeight * videoRatio
        offsetX = (containerWidth - renderWidth) / 2
        offsetY = 0
    } else {
        // Container is taller than video - video is letterboxed vertically
        renderWidth = containerWidth
        renderHeight = containerWidth / videoRatio
        offsetX = 0
        offsetY = (containerHeight - renderHeight) / 2
    }

    return { width: renderWidth, height: renderHeight, offsetX, offsetY, videoRatio }
}

/**
 * VideoOverlayContainer positions an overlay layer exactly on top of the video content.
 * It uses ResizeObserver to track video element changes and recalculates dimensions.
 */
export function VideoOverlayContainer({ videoRef, children }: VideoOverlayContainerProps) {
    const [dimensions, setDimensions] = useState<OverlayDimensions | null>(null)
    const [videoRect, setVideoRect] = useState<{ top: number; left: number } | null>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const updateDimensions = () => {
            const videoWidth = video.videoWidth
            const videoHeight = video.videoHeight

            // Get the video element's actual rendered size
            const videoElementWidth = video.clientWidth
            const videoElementHeight = video.clientHeight

            if (videoWidth > 0 && videoHeight > 0 && videoElementWidth > 0 && videoElementHeight > 0) {
                const dims = calculateVideoDimensions(videoWidth, videoHeight, videoElementWidth, videoElementHeight)
                setDimensions(dims)

                // Get video position relative to its container (the custom-video-player)
                const container = video.parentElement
                if (container) {
                    const containerRect = container.getBoundingClientRect()
                    const videoRect = video.getBoundingClientRect()
                    setVideoRect({
                        top: videoRect.top - containerRect.top,
                        left: videoRect.left - containerRect.left
                    })
                }
            }
        }

        // Update on video metadata load
        video.addEventListener('loadedmetadata', updateDimensions)

        // Also update when video can play (ensures dimensions are ready)
        video.addEventListener('canplay', updateDimensions)

        // Update on resize
        const resizeObserver = new ResizeObserver(updateDimensions)
        resizeObserver.observe(video)

        // Initial calculation
        updateDimensions()

        return () => {
            video.removeEventListener('loadedmetadata', updateDimensions)
            video.removeEventListener('canplay', updateDimensions)
            resizeObserver.disconnect()
        }
    }, [videoRef])

    if (!dimensions || !videoRect) return null

    return (
        <div
            className="video-overlay-container"
            style={{
                position: 'absolute',
                top: videoRect.top + dimensions.offsetY,
                left: videoRect.left + dimensions.offsetX,
                width: dimensions.width,
                height: dimensions.height,
                pointerEvents: 'none',
                zIndex: 10,
            }}
            data-video-ratio={dimensions.videoRatio.toFixed(2)}
        >
            {children}
        </div>
    )
}
