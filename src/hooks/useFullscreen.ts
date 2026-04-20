import { useState, useCallback, useEffect, type RefObject } from 'react'

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggle = useCallback(async () => {
    if (!targetRef.current) return

    try {
      if (!document.fullscreenElement) {
        await targetRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error(`Error attempting to toggle fullscreen:`, err)
    }
  }, [targetRef])

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.error(`Error attempting to exit fullscreen:`, err)
      }
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === targetRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [targetRef])

  const enter = useCallback(async () => {
    if (!targetRef.current) return
    try {
      if (!document.fullscreenElement) {
        await targetRef.current.requestFullscreen()
      }
    } catch (err) {
      console.error(`Error attempting to enter fullscreen:`, err)
    }
  }, [targetRef])

  return { isFullscreen, toggle, enter, exit }
}
