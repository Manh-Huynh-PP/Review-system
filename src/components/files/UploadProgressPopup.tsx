import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useUploadProgressStore } from '@/stores/uploadProgress'
import { Progress } from '@/components/ui/progress'
import { X, CheckCircle, Maximize2, Minimize2, AlertCircle, FileIcon, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UploadTask } from '@/stores/uploadProgress'

interface UploadProgressPopupProps {
  // no props needed — popup is self-contained
}

function TaskRow({ task }: { task: UploadTask }) {
  // Use task.progress directly since it's now smoothly updated via onProgress callback
  const displayProgress = task.status === 'success' ? 100 : task.progress

  return (
    <div className="flex items-center gap-2.5 px-4 py-2">
      {/* Status icon */}
      <div className="flex-shrink-0">
        {task.status === 'success' ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : task.status === 'error' ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : (
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        )}
      </div>

      {/* File info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {task.fileType === 'sequence' ? (
            <Film className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          ) : (
            <FileIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-xs font-medium truncate">{task.fileName}</span>
          {task.totalFiles > 1 && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              ({task.completedFiles}/{task.totalFiles})
            </span>
          )}
        </div>
        {task.status === 'uploading' && (
          <Progress value={displayProgress} className="h-1" />
        )}
        {task.status === 'error' && task.error && (
          <div className="text-[10px] text-destructive truncate">{task.error}</div>
        )}
      </div>

      {/* Progress % */}
      {task.status === 'uploading' && (
        <span className="text-[10px] font-mono font-semibold text-primary flex-shrink-0 tabular-nums">
          {displayProgress}%
        </span>
      )}
    </div>
  )
}

export function UploadProgressPopup(_props?: UploadProgressPopupProps) {
  const { tasks, isMinimized, reset } = useUploadProgressStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true) // task list expanded by default
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  // Create a dedicated container at the very end of document.body
  // This ensures it's always above Radix Dialog portals in DOM/paint order
  useEffect(() => {
    let el = document.getElementById('upload-progress-portal')
    if (!el) {
      el = document.createElement('div')
      el.id = 'upload-progress-portal'
      el.style.position = 'relative'
      el.style.zIndex = '99999'
      el.style.pointerEvents = 'auto' // explicitly allow pointer events inside the portal
      document.body.appendChild(el)
    }
    setPortalContainer(el)
    return () => {
      // Don't remove — it may be reused by other instances
    }
  }, [])

  const activeTasks = tasks.filter(t => t.status === 'uploading')
  const completedTasks = tasks.filter(t => t.status === 'success')
  const errorTasks = tasks.filter(t => t.status === 'error')
  const hasActiveTasks = activeTasks.length > 0
  const allDone = tasks.length > 0 && !hasActiveTasks

  // Show/hide animation
  useEffect(() => {
    if (isMinimized && tasks.length > 0) {
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [isMinimized, tasks.length])

  // Auto-hide after all tasks complete
  useEffect(() => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      setAutoHideTimer(null)
    }

    if (allDone && isMinimized) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          reset()
        }, 300)
      }, 4000)
      setAutoHideTimer(timer)
    }

    return () => {
      if (autoHideTimer) clearTimeout(autoHideTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, isMinimized])

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleDismiss = useCallback(() => {
    // Don't allow dismissing while uploads are still active
    const currentTasks = useUploadProgressStore.getState().tasks
    if (currentTasks.some(t => t.status === 'uploading')) return

    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      setAutoHideTimer(null)
    }
    setIsVisible(false)
    setTimeout(() => {
      reset()
    }, 300)
  }, [reset, autoHideTimer])

  // Don't render if not minimized or no tasks or portal not ready
  if (!isMinimized || tasks.length === 0 || !portalContainer) return null

  // Overall summary for header
  const summaryText = hasActiveTasks
    ? `Đang tải lên ${activeTasks.length} file...`
    : allDone && errorTasks.length === 0
      ? 'Tải lên hoàn thành!'
      : errorTasks.length > 0 && !hasActiveTasks
        ? `${completedTasks.length} thành công, ${errorTasks.length} lỗi`
        : 'Tải lên hoàn thành!'

  const subtitleText = hasActiveTasks
    ? `${completedTasks.length}/${tasks.length} hoàn thành`
    : `${completedTasks.length} file đã tải thành công`

  return createPortal(
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[9999] w-[360px] pointer-events-auto',
        'transition-all duration-300 ease-out',
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'rounded-xl border shadow-2xl overflow-hidden',
          'bg-background/95 backdrop-blur-xl',
          'ring-1',
          allDone && errorTasks.length === 0
            ? 'ring-green-500/20 border-green-500/30'
            : errorTasks.length > 0 && !hasActiveTasks
              ? 'ring-destructive/20 border-destructive/30'
              : 'ring-primary/20 border-primary/30'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2.5',
            'hover:bg-muted/30 transition-colors',
            allDone && errorTasks.length === 0
              ? 'bg-green-500/5'
              : errorTasks.length > 0 && !hasActiveTasks
                ? 'bg-destructive/5'
                : 'bg-primary/5'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {allDone && errorTasks.length === 0 ? (
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ) : errorTasks.length > 0 && !hasActiveTasks ? (
              <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{summaryText}</div>
              <div className="text-[11px] text-muted-foreground truncate">{subtitleText}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-2 relative z-10">
            {hasActiveTasks && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary/10"
                onClick={handleToggleExpand}
                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-full',
                hasActiveTasks
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-destructive/10 hover:text-destructive'
              )}
              onClick={handleDismiss}
              title={hasActiveTasks ? 'Không thể đóng khi đang tải lên' : 'Đóng'}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Task list — show all tasks with individual progress (collapsible) */}
        {isExpanded && tasks.length > 0 && (
          <div className="border-t border-border/50 max-h-[240px] overflow-y-auto">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    portalContainer
  )
}
