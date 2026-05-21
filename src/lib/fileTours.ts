import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export type FileType = 'image' | 'video' | 'sequence' | 'pdf' | 'model'

interface TourOptions {
  fileType: FileType
  isMobile: boolean
  isAdmin?: boolean
  sequenceViewMode?: string
  t: any
}

/**
 * Start a guided tour for the file viewer based on file type and device
 */
async function getClientIp(): Promise<string | null> {
  try {
    const cached = localStorage.getItem('client_ip')
    if (cached) return cached

    const resp = await fetch('https://api.ipify.org?format=json')
    if (!resp.ok) return null
    const json = await resp.json()
    const ip = json?.ip
    if (ip) {
      localStorage.setItem('client_ip', ip)
      return ip
    }
  } catch (e) {
    // ignore
  }
  return null
}

export async function startFileTour({ fileType, isMobile, sequenceViewMode = 'video', t }: TourOptions) {
  let steps: any[] = []

  // Common steps for desktop
  const commentStep = {
    element: '#comments-sidebar',
    popover: {
      title: t('tours:common.comments.title'),
      description: t('tours:common.comments.description'),
      side: 'left',
      align: 'start'
    }
  }

  const versionToggleStep = {
    element: '#comments-version-toggle',
    popover: {
      title: t('tours:common.versionToggle.title'),
      description: t('tours:common.versionToggle.description'),
      side: 'left',
      align: 'start'
    }
  }

  const compareStep = {
    element: '#header-compare-btn',
    popover: {
      title: t('tours:common.compare.title'),
      description: t('tours:common.compare.description'),
      side: 'bottom',
      align: 'start'
    }
  }

  const resizeHandleStep = {
    element: '#comments-resize-handle',
    popover: {
      title: t('tours:common.resizeHandle.title'),
      description: t('tours:common.resizeHandle.description'),
      side: 'left',
      align: 'center'
    }
  }

  // Common header steps for desktop
  const headerSteps = [
    {
      element: '#header-version-dropdown',
      popover: {
        title: t('tours:common.headerVersion.title'),
        description: t('tours:common.headerVersion.description'),
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#header-share-download-group',
      popover: {
        title: t('tours:common.headerShare.title'),
        description: t('tours:common.headerShare.description'),
        side: 'bottom',
        align: 'start'
      }
    }
  ]
  
  const desktopModeSwitcherStep = {
    element: '#desktop-mode-switcher',
    popover: {
      title: t('tours:common.modeSwitcher.title'),
      description: t('tours:common.modeSwitcher.description'),
      side: 'bottom',
      align: 'start'
    }
  }

  const modelCommentModeStep = {
    element: '#model-comment-mode',
    popover: {
      title: t('tours:common.modeSwitcher.title'),
      description: t('tours:common.modeSwitcher.description'),
      side: 'right',
      align: 'center'
    }
  }

  // Common mobile helper steps
  const mobileCommentModeStep = {
    element: '#mobile-comment-mode-toggle',
    popover: {
      title: t('tours:common.mobileCommentMode.title'),
      description: t('tours:common.mobileCommentMode.description'),
      side: 'top',
      align: 'center'
    }
  }

  const mobileViewToggleStep = {
    element: '#mobile-view-comments-btn',
    popover: {
      title: t('tours:common.mobileViewToggle.title'),
      description: t('tours:common.mobileViewToggle.description'),
      side: 'top',
      align: 'center'
    }
  }

  // ========== IMAGE TOURS ==========
  if (fileType === 'image') {
    if (isMobile) {
      steps = [
        mobileCommentModeStep,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:image.previewMobile.title'),
            description: t('tours:image.previewMobile.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        mobileViewToggleStep
      ]
    } else {
      steps = [
        {
          element: '#image-mode-selector',
          popover: {
            title: t('tours:image.modeSwitcher.title'),
            description: t('tours:image.modeSwitcher.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        ...headerSteps,
        compareStep,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:image.spatialComment.title'),
            description: t('tours:image.spatialComment.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        resizeHandleStep,
        commentStep,
        versionToggleStep
      ]
    }
  }

  // ========== VIDEO TOURS ==========
  else if (fileType === 'video') {
    if (isMobile) {
      steps = [
        mobileCommentModeStep,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:video.playerMobile.title'),
            description: t('tours:video.playerMobile.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#video-timeline-container',
          popover: {
            title: t('tours:video.timelineMobile.title'),
            description: t('tours:video.timelineMobile.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#video-controls-settings',
          popover: {
            title: t('tours:video.settings.title'),
            description: t('tours:video.settings.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#mobile-nav-toggle',
          popover: {
            title: t('tours:video.navToggleMobile.title'),
            description: t('tours:video.navToggleMobile.description'),
            side: 'top',
            align: 'center'
          }
        },
        mobileViewToggleStep
      ]
    } else {
      steps = [
        desktopModeSwitcherStep,
        ...headerSteps,
        {
          element: '#header-video-compare-btn',
          popover: {
            title: t('tours:common.compare.title'),
            description: t('tours:common.compare.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#preview-container',
          popover: {
            title: t('tours:video.spatialComment.title'),
            description: t('tours:video.spatialComment.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#video-controls-export',
          popover: {
            title: t('tours:video.exportFrame.title'),
            description: t('tours:video.exportFrame.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#video-controls-settings',
          popover: {
            title: t('tours:video.settings.title'),
            description: t('tours:video.settings.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#video-controls-fullscreen',
          popover: {
            title: t('tours:video.fullscreen.title'),
            description: t('tours:video.fullscreen.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#filter-time-toggle',
          popover: {
            title: t('tours:video.filterTime.title'),
            description: t('tours:video.filterTime.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#video-timeline-container',
          popover: {
            title: t('tours:video.timeline.title'),
            description: t('tours:video.timeline.description'),
            side: 'top',
            align: 'center'
          }
        },
        resizeHandleStep,
        commentStep,
        versionToggleStep
      ]
    }
  }

  // ========== SEQUENCE TOURS ==========
  else if (fileType === 'sequence') {
    if (isMobile) {
      steps = [
        mobileCommentModeStep,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:sequence.preview.title'),
            description: sequenceViewMode === 'grid'
              ? t('tours:sequence.previewGrid.description')
              : t('tours:sequence.preview.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#grid-toggle',
          popover: {
            title: t('tours:sequence.viewMode.title'),
            description: t('tours:sequence.viewMode.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        mobileViewToggleStep
      ]
    } else {
      steps = [
        desktopModeSwitcherStep,
        ...headerSteps,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:sequence.spatialComment.title'),
            description: sequenceViewMode === 'video'
              ? t('tours:sequence.previewVideo.description')
              : sequenceViewMode === 'carousel'
                ? t('tours:sequence.preview.description')
                : t('tours:sequence.previewGrid.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#filter-time-toggle',
          popover: {
            title: t('tours:video.filterTime.title'),
            description: t('tours:video.filterTime.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        resizeHandleStep,
        commentStep,
        versionToggleStep
      ]
    }
  }

  // ========== PDF TOURS ==========
  else if (fileType === 'pdf') {
    if (isMobile) {
      steps = [
        mobileCommentModeStep,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:pdf.previewMobile.title'),
            description: t('tours:pdf.previewMobile.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        mobileViewToggleStep
      ]
    } else {
      steps = [
        ...headerSteps,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:pdf.spatialComment.title'),
            description: t('tours:pdf.spatialComment.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        resizeHandleStep,
        commentStep,
        versionToggleStep
      ]
    }
  }

  // ========== 3D MODEL TOURS ==========
  else if (fileType === 'model') {
    if (isMobile) {
      steps = [
        mobileCommentModeStep,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:model.previewMobile.title'),
            description: t('tours:model.previewMobile.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#mobile-3d-toolbar',
          popover: {
            title: t('tours:model.toolbar.title'),
            description: t('tours:model.toolbar.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#mobile-model-auto-rotate',
          popover: {
            title: t('tours:model.lighting.title'),
            description: t('tours:model.lighting.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#mobile-model-render-mode',
          popover: {
            title: t('tours:model.renderMode.title'),
            description: t('tours:model.renderMode.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#mobile-model-screenshot',
          popover: {
            title: t('tours:model.screenshot.title'),
            description: t('tours:model.screenshot.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#mobile-model-reset',
          popover: {
            title: t('tours:model.resetView.title'),
            description: t('tours:model.resetView.description'),
            side: 'top',
            align: 'center'
          }
        },
        mobileViewToggleStep
      ]
    } else {
      steps = [
        modelCommentModeStep,
        ...headerSteps,
        {
          element: '#preview-container',
          popover: {
            title: t('tours:model.spatialComment.title'),
            description: t('tours:model.spatialComment.description'),
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#model-interaction-mode',
          popover: {
            title: t('tours:model.interactionMode.title'),
            description: t('tours:model.interactionMode.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#model-reset-view',
          popover: {
            title: t('tours:model.resetView.title'),
            description: t('tours:model.resetView.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#model-screenshot',
          popover: {
            title: t('tours:model.screenshot.title'),
            description: t('tours:model.screenshot.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '.glb-toolbar',
          popover: {
            title: t('tours:model.toolbar.title'),
            description: t('tours:model.toolbar.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#model-ar-view',
          popover: {
            title: t('tours:model.arView.title'),
            description: t('tours:model.arView.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#model-render-mode',
          popover: {
            title: t('tours:model.renderMode.title'),
            description: t('tours:model.renderMode.description'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#model-lighting',
          popover: {
            title: t('tours:model.lighting.title'),
            description: t('tours:model.lighting.description'),
            side: 'top',
            align: 'center'
          }
        },
        resizeHandleStep,
        commentStep,
        versionToggleStep
      ]
    }
  }

  // Generic fallback
  else {
    steps = [
      {
        element: '#preview-container',
        popover: {
          title: t('tours:fallback.preview.title', 'View & Browse'),
          description: t('tours:fallback.preview.description', 'View file content and use available tools.'),
          side: 'bottom',
          align: 'center'
        }
      },
      resizeHandleStep,
      commentStep,
      versionToggleStep
    ]
  }

  // Filter out steps whose target elements are not currently present in the DOM
  const activeSteps = steps.filter(step => {
    if (!step.element) return true
    try {
      if (typeof step.element === 'string') {
        return document.querySelector(step.element) !== null
      }
    } catch (e) {
      // ignore query selector errors
    }
    return true
  })

  const driverObj = driver({
    showProgress: true,
    steps: activeSteps,
    onDestroyed: async () => {
      try {
        const ip = await getClientIp()
        if (ip) {
          localStorage.setItem(`hasSeenTour_${fileType}_${ip}`, 'true')
        } else {
          localStorage.setItem(`hasSeenTour_${fileType}`, 'true')
        }
      } catch (e) {
        localStorage.setItem(`hasSeenTour_${fileType}`, 'true')
      }
      try {
        document.body.classList.remove('tour-running')
      } catch (e) {
        /* ignore */
      }
    }
  })

  // Ensure UI elements that hide on hover (like the 3D toolbar) remain visible during the tour
  try {
    document.body.classList.add('tour-running')
  } catch (e) {
    /* ignore */
  }


  driverObj.drive()
}

/**
 * Check if user has seen the tour for a specific file type
 */
export async function hasSeenTour(fileType: FileType): Promise<boolean> {
  // Try per-IP key first
  try {
    const ip = await getClientIp()
    if (ip) {
      const key = `hasSeenTour_${fileType}_${ip}`
      if (localStorage.getItem(key) === 'true') return true
    }
  } catch (e) {
    // ignore and fallback
  }

  // Backwards-compatible fallback to old key
  return localStorage.getItem(`hasSeenTour_${fileType}`) === 'true'
}

/**
 * Reset tour seen status (useful for debugging or user request)
 */
export function resetTourStatus(fileType?: FileType) {
  if (fileType) {
    // remove generic key
    localStorage.removeItem(`hasSeenTour_${fileType}`)
    // remove any per-ip keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(`hasSeenTour_${fileType}_`)) {
        localStorage.removeItem(k)
        // adjust index because we removed an item
        i--
      }
    }
  } else {
    const types: FileType[] = ['image', 'video', 'sequence', 'pdf', 'model']
    types.forEach(type => {
      localStorage.removeItem(`hasSeenTour_${type}`)
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(`hasSeenTour_${type}_`)) {
          localStorage.removeItem(k)
          i--
        }
      }
    })
  }
}
