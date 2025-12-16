export type CompositionGuide =
    | 'center'
    | 'thirds'
    | 'diagonal'
    | 'goldenRatio'
    | 'goldenTriangleA'
    | 'goldenTriangleB'
    | 'harmonyA'
    | 'harmonyB'

interface CompositionOverlayProps {
    /** Which guides to display */
    activeGuides: CompositionGuide[]
    /** Video Aspect Ratio (width/height) */
    videoRatio?: number
    /** Line color */
    color?: string
    /** Line opacity (0-1) */
    opacity?: number
    /** Line stroke width in pixels */
    strokeWidth?: number
}

// Golden ratio constant
const PHI_INVERSE = 0.618033988749895 // 1/φ ≈ 0.618

/**
 * Calculate the intersection point where a perpendicular from point (px, py) 
 * meets the line from (x1, y1) to (x2, y2).
 * 
 * Calculations are done in "visual aspect ratio space" to ensure
 * lines look perpendicular to the human eye, then converted back to 0-100 coordinate space.
 */
function perpendicularIntersection(
    x1: number, y1: number,
    x2: number, y2: number,
    px: number, py: number,
    aspectRatio: number
): { x: number; y: number } {
    // Convert to visual space (X scaled by aspect ratio)
    const vx1 = x1 * aspectRatio
    const vx2 = x2 * aspectRatio
    const vpx = px * aspectRatio

    // Y coordinates remain the same (0-100)

    const dx = vx2 - vx1
    const dy = y2 - y1

    // Calculate parameter t for the intersection point on the line segment
    // Formula for projection of point P onto line passing through A and B:
    // t = ((P - A) . (B - A)) / |B - A|^2
    const t = ((vpx - vx1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)

    // Calculate intersection point in visual space
    const vix = vx1 + t * dx
    const viy = y1 + t * dy

    // Convert X back to 0-100 space
    return {
        x: vix / aspectRatio,
        y: viy
    }
}

/**
 * Extends a ray starting at p1 passing through p2 until it hits the box boundary (0,0 to 100,100).
 */
function getExtendedEndPoint(
    start: { x: number; y: number },
    through: { x: number; y: number }
): { x: number; y: number } {
    const dx = through.x - start.x
    const dy = through.y - start.y

    // Avoid potential division by zero
    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return through

    let bestT = Infinity

    // Check intersection with x=0
    if (dx < 0) {
        const t = (0 - start.x) / dx
        if (t > 1.0001) bestT = Math.min(bestT, t)
    }
    // Check intersection with x=100
    if (dx > 0) {
        const t = (100 - start.x) / dx
        if (t > 1.0001) bestT = Math.min(bestT, t)
    }
    // Check intersection with y=0
    if (dy < 0) {
        const t = (0 - start.y) / dy
        if (t > 1.0001) bestT = Math.min(bestT, t)
    }
    // Check intersection with y=100
    if (dy > 0) {
        const t = (100 - start.y) / dy
        if (t > 1.0001) bestT = Math.min(bestT, t)
    }

    if (bestT === Infinity) return through

    return {
        x: start.x + bestT * dx,
        y: start.y + bestT * dy
    }
}

/**
 * CompositionOverlay renders SVG lines for various composition guides.
 * Uses viewBox for percentage-based calculations.
 * 
 * Lines are styled as thin dashed lines with low opacity for subtle guidance.
 */
export function CompositionOverlay({
    activeGuides,
    videoRatio = 16 / 9,
    color = '#ffffff',
    opacity = 0.2,
    strokeWidth = 1
}: CompositionOverlayProps) {
    if (activeGuides.length === 0) return null

    const lineStyle: React.SVGProps<SVGLineElement> = {
        stroke: color,
        strokeWidth: strokeWidth,
        opacity: opacity,
        strokeDasharray: '4 4', // Dashed line
        vectorEffect: 'non-scaling-stroke', // Prevent stroke from being scaled
    }

    const solidLineStyle: React.SVGProps<SVGLineElement> = {
        ...lineStyle,
        strokeDasharray: undefined, // Solid line for main diagonals
    }

    // ============================================
    // GOLDEN TRIANGLE: Perpendicular lines (90°)
    // ============================================
    // Triangle A: Diagonal from Bottom-Left (0,100) to Top-Right (100,0)
    const goldenA_intersect1 = perpendicularIntersection(0, 100, 100, 0, 0, 0, videoRatio) // From Top-Left
    const goldenA_intersect2 = perpendicularIntersection(0, 100, 100, 0, 100, 100, videoRatio) // From Bottom-Right

    // Extend lines to border
    const goldenA_perp1 = getExtendedEndPoint({ x: 0, y: 0 }, goldenA_intersect1)
    const goldenA_perp2 = getExtendedEndPoint({ x: 100, y: 100 }, goldenA_intersect2)


    // Triangle B: Diagonal from Top-Left (0,0) to Bottom-Right (100,100)
    const goldenB_intersect1 = perpendicularIntersection(0, 0, 100, 100, 100, 0, videoRatio) // From Top-Right
    const goldenB_intersect2 = perpendicularIntersection(0, 0, 100, 100, 0, 100, videoRatio) // From Bottom-Left

    // Extend lines to border
    const goldenB_perp1 = getExtendedEndPoint({ x: 100, y: 0 }, goldenB_intersect1)
    const goldenB_perp2 = getExtendedEndPoint({ x: 0, y: 100 }, goldenB_intersect2)


    // ============================================
    // HARMONY TRIANGLE: Adaptive based on Aspect Ratio
    // ============================================
    // Rule: Cuts intersect the LONG edge (width for Landscape, height for Portrait)
    // AND should be the "soft" variation of the Golden perpendicular.
    // We select the golden section point (38.2% or 61.8%) that is closest to the 
    // actual Golden Triangle perpendicular intersection.

    // Helper to find best harmony point
    const getBestHarmonyPoint = (
        perpTarget: { x: number, y: number },
        edge: 'bottom' | 'top' | 'left' | 'right'
    ) => {
        // Define the two possible golden points on the given edge
        let p1: { x: number, y: number }
        let p2: { x: number, y: number }

        if (edge === 'bottom') {
            p1 = { x: PHI_INVERSE * 100, y: 100 }
            p2 = { x: (1 - PHI_INVERSE) * 100, y: 100 }
        } else if (edge === 'top') {
            p1 = { x: PHI_INVERSE * 100, y: 0 }
            p2 = { x: (1 - PHI_INVERSE) * 100, y: 0 }
        } else if (edge === 'right') {
            p1 = { x: 100, y: PHI_INVERSE * 100 }
            p2 = { x: 100, y: (1 - PHI_INVERSE) * 100 }
        } else { // left
            p1 = { x: 0, y: PHI_INVERSE * 100 }
            p2 = { x: 0, y: (1 - PHI_INVERSE) * 100 }
        }

        // Distance in visual space (accounting for aspect ratio)
        const getDist = (p: { x: number, y: number }) => {
            const dx = (p.x - perpTarget.x) * videoRatio
            const dy = p.y - perpTarget.y
            return dx * dx + dy * dy
        }

        return getDist(p1) < getDist(p2) ? p1 : p2
    }

    const isLandscape = videoRatio >= 1

    // Harmony A: Diagonal Bottom-Left (0,100) -> Top-Right (100,0)
    let harmonyA_p1: { x: number, y: number }
    let harmonyA_p2: { x: number, y: number }

    // Harmony B: Diagonal Top-Left (0,0) -> Bottom-Right (100,100)
    let harmonyB_p1: { x: number, y: number }
    let harmonyB_p2: { x: number, y: number }

    if (isLandscape) {
        // LANDSCAPE: Compare with perpendiculars on Top/Bottom edges
        harmonyA_p1 = getBestHarmonyPoint(goldenA_perp1, 'bottom') // From TL
        harmonyA_p2 = getBestHarmonyPoint(goldenA_perp2, 'top') // From BR

        harmonyB_p1 = getBestHarmonyPoint(goldenB_perp1, 'bottom') // From TR
        harmonyB_p2 = getBestHarmonyPoint(goldenB_perp2, 'top') // From BL
    } else {
        // PORTRAIT: Compare with perpendiculars on Left/Right edges
        harmonyA_p1 = getBestHarmonyPoint(goldenA_perp1, 'right') // From TL
        harmonyA_p2 = getBestHarmonyPoint(goldenA_perp2, 'left') // From BR

        harmonyB_p1 = getBestHarmonyPoint(goldenB_perp1, 'left') // From TR
        harmonyB_p2 = getBestHarmonyPoint(goldenB_perp2, 'right') // From BL
    }

    return (
        <svg
            className="composition-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        >
            {/* Center Guide: Crosshair */}
            {activeGuides.includes('center') && (
                <>
                    <line x1="50" y1="0" x2="50" y2="100" {...lineStyle} />
                    <line x1="0" y1="50" x2="100" y2="50" {...lineStyle} />
                </>
            )}

            {/* Rule of Thirds */}
            {activeGuides.includes('thirds') && (
                <>
                    <line x1="33.33" y1="0" x2="33.33" y2="100" {...lineStyle} />
                    <line x1="66.66" y1="0" x2="66.66" y2="100" {...lineStyle} />
                    <line x1="0" y1="33.33" x2="100" y2="33.33" {...lineStyle} />
                    <line x1="0" y1="66.66" x2="100" y2="66.66" {...lineStyle} />
                </>
            )}

            {/* Diagonal */}
            {activeGuides.includes('diagonal') && (
                <>
                    <line x1="0" y1="0" x2="100" y2="100" {...lineStyle} />
                    <line x1="100" y1="0" x2="0" y2="100" {...lineStyle} />
                </>
            )}

            {/* Golden Ratio (Phi Grid) - lines at ~38.2% and ~61.8% */}
            {activeGuides.includes('goldenRatio') && (
                <>
                    <line x1={100 * (1 - PHI_INVERSE)} y1="0" x2={100 * (1 - PHI_INVERSE)} y2="100" {...lineStyle} />
                    <line x1={100 * PHI_INVERSE} y1="0" x2={100 * PHI_INVERSE} y2="100" {...lineStyle} />
                    <line x1="0" y1={100 * (1 - PHI_INVERSE)} x2="100" y2={100 * (1 - PHI_INVERSE)} {...lineStyle} />
                    <line x1="0" y1={100 * PHI_INVERSE} x2="100" y2={100 * PHI_INVERSE} {...lineStyle} />
                </>
            )}

            {/* 
             * GOLDEN TRIANGLE A (Tam giác vàng A):
             * - Main diagonal: Bottom-Left (0,100) → Top-Right (100,0)
             * - Perpendicular from Top-Left (0,0) to diagonal (90°)
             * - Perpendicular from Bottom-Right (100,100) to diagonal (90°)
             */}
            {activeGuides.includes('goldenTriangleA') && (
                <>
                    {/* Main diagonal */}
                    <line x1="0" y1="100" x2="100" y2="0" {...solidLineStyle} />
                    {/* Perpendicular from Top-Left */}
                    <line x1="0" y1="0" x2={goldenA_perp1.x} y2={goldenA_perp1.y} {...lineStyle} />
                    {/* Perpendicular from Bottom-Right */}
                    <line x1="100" y1="100" x2={goldenA_perp2.x} y2={goldenA_perp2.y} {...lineStyle} />
                </>
            )}

            {/* 
             * GOLDEN TRIANGLE B (Tam giác vàng B):
             * - Main diagonal: Top-Left (0,0) → Bottom-Right (100,100)
             * - Perpendicular from Top-Right (100,0) to diagonal (90°)
             * - Perpendicular from Bottom-Left (0,100) to diagonal (90°)
             */}
            {activeGuides.includes('goldenTriangleB') && (
                <>
                    {/* Main diagonal */}
                    <line x1="0" y1="0" x2="100" y2="100" {...solidLineStyle} />
                    {/* Perpendicular from Top-Right */}
                    <line x1="100" y1="0" x2={goldenB_perp1.x} y2={goldenB_perp1.y} {...lineStyle} />
                    {/* Perpendicular from Bottom-Left */}
                    <line x1="0" y1="100" x2={goldenB_perp2.x} y2={goldenB_perp2.y} {...lineStyle} />
                </>
            )}

            {/* 
             * HARMONY TRIANGLE A (Tam giác hài hòa A):
             * - Main diagonal: Bottom-Left (0,100) → Top-Right (100,0)
             * - Lines to Golden Ratio points on LONG edges
             */}
            {activeGuides.includes('harmonyA') && (
                <>
                    {/* Main diagonal */}
                    <line x1="0" y1="100" x2="100" y2="0" {...solidLineStyle} />
                    {/* From Top-Left */}
                    <line x1="0" y1="0" x2={harmonyA_p1.x} y2={harmonyA_p1.y} {...lineStyle} />
                    {/* From Bottom-Right */}
                    <line x1="100" y1="100" x2={harmonyA_p2.x} y2={harmonyA_p2.y} {...lineStyle} />
                </>
            )}

            {/* 
             * HARMONY TRIANGLE B (Tam giác hài hòa B):
             * - Main diagonal: Top-Left (0,0) → Bottom-Right (100,100)
             * - Lines to Golden Ratio points on LONG edges
             */}
            {activeGuides.includes('harmonyB') && (
                <>
                    {/* Main diagonal */}
                    <line x1="0" y1="0" x2="100" y2="100" {...solidLineStyle} />
                    {/* From Top-Right */}
                    <line x1="100" y1="0" x2={harmonyB_p1.x} y2={harmonyB_p1.y} {...lineStyle} />
                    {/* From Bottom-Left */}
                    <line x1="0" y1="100" x2={harmonyB_p2.x} y2={harmonyB_p2.y} {...lineStyle} />
                </>
            )}
        </svg>
    )
}
