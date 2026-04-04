import { useState, useRef, useCallback, useEffect, type RefObject } from 'react'

interface ScrubberOptions {
  totalFrames: number
  currentFrame: number
  containerRef: RefObject<HTMLElement | null>
  onFrameChange: (frame: number) => void
  disabled?: boolean
  threshold?: number // pixel threshold before starting to scrub
}

export function useSequenceScrubber({
  totalFrames,
  currentFrame,
  containerRef,
  onFrameChange,
  disabled = false,
  threshold = 3
}: ScrubberOptions) {
  const [isScrubbing, setIsScrubbing] = useState(false)
  const dragRef = useRef({
    startX: 0,
    startFrame: 0,
    hasStarted: false
  })

  const handleMouseDown = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (disabled || totalFrames <= 1) return

    e.preventDefault() // Prevent text selection
    dragRef.current = {
      startX: e.clientX,
      startFrame: currentFrame,
      hasStarted: false
    }
    
    // We add listeners to window to capture movement outside container
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
  }, [disabled, totalFrames, currentFrame])

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const { startX, startFrame, hasStarted } = dragRef.current
    const deltaX = e.clientX - startX

    // Check threshold to avoid jitter on simple click
    if (!hasStarted && Math.abs(deltaX) < threshold) return
    
    if (!hasStarted) {
      dragRef.current.hasStarted = true
      setIsScrubbing(true)
    }

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    
    // Logic: 1 full container width = 1 full sequence
    // Calculate how many frames correspond to the pixel delta
    const pixelsPerFrame = rect.width / (totalFrames - 1)
    const framesToMove = Math.round(deltaX / pixelsPerFrame)
    
    const targetFrame = Math.max(0, Math.min(totalFrames - 1, startFrame + framesToMove))
    
    if (targetFrame !== currentFrame) {
      onFrameChange(targetFrame)
    }
  }, [totalFrames, currentFrame, onFrameChange, containerRef, threshold])

  const handleGlobalMouseUp = useCallback(() => {
    setIsScrubbing(false)
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [handleGlobalMouseMove])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [handleGlobalMouseMove, handleGlobalMouseUp])

  return {
    isScrubbing,
    bind: {
      onMouseDown: handleMouseDown
    }
  }
}
