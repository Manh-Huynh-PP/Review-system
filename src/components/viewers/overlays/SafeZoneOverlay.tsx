interface SafeZoneOverlayProps {
    /** URL or path to the safe zone image (PNG) */
    safeZoneUrl: string | null
    /** Opacity of the overlay (0-1), defaults to 0.2 (20%) */
    opacity?: number
}

/**
 * SafeZoneOverlay renders a safe zone image on top of the video.
 * The image fills the overlay container and uses the specified opacity.
 */
export function SafeZoneOverlay({ safeZoneUrl, opacity = 0.2 }: SafeZoneOverlayProps) {
    if (!safeZoneUrl) return null

    return (
        <img
            src={safeZoneUrl}
            alt="Safe Zone Overlay"
            className="safe-zone-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill', // Fill the container exactly
                opacity: opacity,
                pointerEvents: 'none',
            }}
        />
    )
}
