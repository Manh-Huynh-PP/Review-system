import { useState, useRef, useCallback, useEffect } from 'react'

interface ZoomPanOptions {
    minZoom?: number
    maxZoom?: number
    zoomStep?: number
    initialZoom?: number
    initialPan?: { x: number; y: number }
}

export function useZoomPan(options: ZoomPanOptions = {}) {
    const {
        minZoom = 0.25,
        maxZoom = 5,
        zoomStep = 0.25,
        initialZoom = 1,
        initialPan = { x: 0, y: 0 }
    } = options

    const [zoom, setZoom] = useState(initialZoom)
    const [panOffset, setPanOffset] = useState(initialPan)
    const [isDragging, setIsDragging] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const lastPointers = useRef<Map<number, { x: number; y: number }>>(new Map())
    const lastPinchDistance = useRef<number | null>(null)
    const lastPanPos = useRef<{ x: number; y: number } | null>(null)

    const reset = useCallback(() => {
        setZoom(initialZoom)
        setPanOffset(initialPan)
    }, [initialZoom, initialPan])

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(maxZoom, prev + zoomStep))
    }, [maxZoom, zoomStep])

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(minZoom, prev - zoomStep))
    }, [minZoom, zoomStep])

    // Utility to calculate distance between two points
    const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    }

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        // Only allow dragging if zoomed in
        if (zoom <= 1 && e.pointerType === 'mouse') return

        lastPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

        if (lastPointers.current.size === 1) {
            setIsDragging(true)
            lastPanPos.current = { x: e.clientX, y: e.clientY }
        } else if (lastPointers.current.size === 2) {
            // Start pinch
            const pointers = Array.from(lastPointers.current.values())
            lastPinchDistance.current = getDistance(pointers[0], pointers[1])
        }
        
        // Prevent default touch behavior (like scrolling) when interacting with the viewer
        if (e.pointerType === 'touch') {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId)
        }
    }, [zoom])

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (lastPointers.current.size === 0) return

        lastPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

        if (lastPointers.current.size === 1 && isDragging) {
            // Pan
            if (zoom > 1) {
                const deltaX = (e.clientX - lastPanPos.current!.x) / zoom
                const deltaY = (e.clientY - lastPanPos.current!.y) / zoom
                setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
                lastPanPos.current = { x: e.clientX, y: e.clientY }
            }
        } else if (lastPointers.current.size === 2) {
            // Pinch to zoom
            const pointers = Array.from(lastPointers.current.values())
            const distance = getDistance(pointers[0], pointers[1])

            if (lastPinchDistance.current !== null) {
                const delta = distance / lastPinchDistance.current
                const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * delta))
                
                if (newZoom !== zoom) {
                    setZoom(newZoom)
                }
            }
            lastPinchDistance.current = distance
        }
    }, [isDragging, zoom, maxZoom, minZoom])

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        lastPointers.current.delete(e.pointerId)
        
        if (lastPointers.current.size < 2) {
            lastPinchDistance.current = null
        }
        
        if (lastPointers.current.size === 0) {
            setIsDragging(false)
            lastPanPos.current = null
        } else if (lastPointers.current.size === 1) {
            // Resume pan with the remaining pointer
            const remaining = lastPointers.current.values().next().value
            if (remaining) {
                lastPanPos.current = remaining
            }
        }
    }, [])

    const onWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setZoom(prev => Math.min(maxZoom, Math.max(minZoom, prev + delta)))
        }
    }, [maxZoom, minZoom])

    // Auto-center when zoom is reset
    useEffect(() => {
        if (zoom <= 1) {
            setPanOffset({ x: 0, y: 0 })
        }
    }, [zoom])

    return {
        zoom,
        setZoom,
        panOffset,
        setPanOffset,
        isDragging,
        containerRef,
        reset,
        handleZoomIn,
        handleZoomOut,
        bind: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onWheel,
            style: { touchAction: 'none' as const }
        }
    }
}
