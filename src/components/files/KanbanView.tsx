import { useMemo, useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { File as FileType } from '@/types'
import { PRESET_COLORS } from '@/constants/colors'
import { FileCardShared } from '@/components/shared/FileCardShared'
import { cn } from '@/lib/utils'
import { useFileStore } from '@/stores/files'

interface KanbanViewProps {
  files: FileType[]
  projectId: string
  isAdmin?: boolean
  colorLabels?: Record<string, string>
  columnOrder?: string[]
  onFileClick: (file: FileType) => void
  onColumnOrderChange?: (newOrder: string[]) => void
}

interface KanbanCardProps {
  file: FileType
  onClick: () => void
  isAdmin: boolean
}

function KanbanCard({ file, onClick, isAdmin }: KanbanCardProps) {
  const { deleteFile, toggleFileLock } = useFileStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.id,
    data: {
      type: 'File',
    },
    disabled: !isAdmin,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <FileCardShared
        file={file}
        commentCount={0}
        onClick={onClick}
        compact={true}
        isAdmin={isAdmin}
        isLocked={file.isCommentsLocked}
        onDelete={() => deleteFile(file.projectId, file.id)}
        onToggleLock={() => toggleFileLock(file.projectId, file.id, !file.isCommentsLocked)}
      />
    </div>
  )
}

function KanbanColumn({ 
  id, 
  title, 
  color, 
  files, 
  onFileClick, 
  isAdmin,
  isLast
}: { 
  id: string, 
  title: string, 
  color: string, 
  files: FileType[], 
  onFileClick: (file: FileType) => void,
  isAdmin: boolean,
  isLast?: boolean
}) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({
    id: id,
    data: {
      type: 'Column',
    },
    disabled: !isAdmin,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const headerStyle = color !== 'transparent' ? {
    backgroundColor: color,
    color: 'white',
  } : {}

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col flex-1 min-w-[280px] md:min-w-0 md:max-w-none shrink-0 min-h-[500px]",
        !isLast && "md:border-r border-border/40"
      )}
    >
      <div 
        style={headerStyle}
        {...attributes}
        {...listeners}
        className={cn(
          "h-10 px-4 flex items-center justify-center relative sticky top-0 z-10",
          isAdmin && "cursor-grab active:cursor-grabbing"
        )}
      >
        <h3 className="font-bold text-[10px] md:text-[11px] truncate uppercase tracking-[0.2em] text-center w-full">{title}</h3>
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
          <span className="text-[10px] font-bold bg-black/20 text-white min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
            {files.length}
          </span>
        </div>
      </div>
      
      <div 
        className="p-3 md:p-6 flex-1 flex flex-col gap-4 bg-transparent"
      >
        <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {files.map(file => (
            <div key={file.id} className="max-w-[320px] mx-auto w-full transition-transform hover:scale-[1.02] duration-200">
              <KanbanCard 
                file={file} 
                onClick={() => onFileClick(file)} 
                isAdmin={isAdmin}
              />
            </div>
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function KanbanView({ 
  files, 
  projectId, 
  isAdmin = false, 
  colorLabels = {}, 
  columnOrder = [],
  onFileClick,
  onColumnOrderChange
}: KanbanViewProps) {
  const { updateFileBackgroundColor } = useFileStore()
  const [activeFile, setActiveFile] = useState<FileType | null>(null)
  const [activeColumn, setActiveColumn] = useState<any | null>(null)
  
  // Mobile states
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // Listen to resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columns = useMemo(() => {
    const groups: Record<string, FileType[]> = {}
    
    // Initialize groups for all preset colors
    PRESET_COLORS.forEach(c => {
      groups[c.value || 'default'] = []
    })

    files.forEach(file => {
      const colorKey = file.cardBackgroundColor || 'default'
      if (!groups[colorKey]) groups[colorKey] = []
      groups[colorKey].push(file)
    })

    let baseColumns = PRESET_COLORS.map(c => ({
      id: c.value || 'default',
      title: colorLabels[c.value || 'default'] || c.label,
      color: c.hex,
      files: groups[c.value || 'default'] || []
    })).filter(col => col.files.length > 0)

    // Sort columns based on columnOrder if provided
    if (columnOrder.length > 0) {
      baseColumns.sort((a, b) => {
        const indexA = columnOrder.indexOf(a.id)
        const indexB = columnOrder.indexOf(b.id)
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
    }

    // Set default active tab for mobile
    if (baseColumns.length > 0 && !activeTabId) {
      setActiveTabId(baseColumns[0].id)
    }

    return baseColumns
  }, [files, colorLabels, columnOrder])

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAdmin) return
    const { active } = event
    
    // Check if dragging a file or a column
    const file = files.find(f => f.id === active.id)
    if (file) {
      setActiveFile(file)
    } else {
      const column = columns.find(c => c.id === active.id)
      if (column) setActiveColumn(column)
    }
  }

  const handleDragOver = (event: any) => {
    if (!isAdmin) return
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Skip if dragging a column
    if (active.data.current?.type === 'Column') return

    // Find the dragging file
    const file = files.find(f => f.id === activeId)
    if (!file) return

    // Determine target color
    let targetColor: string | undefined = undefined
    const targetColumn = PRESET_COLORS.find(c => (c.value || 'default') === overId)
    
    if (targetColumn) {
      targetColor = targetColumn.value
    } else {
      const overFile = files.find(f => f.id === overId)
      if (overFile) {
        targetColor = overFile.cardBackgroundColor
      }
    }

    // Update color during drag for smooth transition between columns
    if (file.cardBackgroundColor !== targetColor) {
      updateFileBackgroundColor(projectId, activeId, targetColor)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isAdmin) return
    setActiveFile(null)
    setActiveColumn(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle column reordering
    if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
      if (activeId !== overId) {
        const oldIndex = columns.findIndex(c => c.id === activeId)
        const newIndex = columns.findIndex(c => c.id === overId)
        const newColumns = arrayMove(columns, oldIndex, newIndex)
        if (onColumnOrderChange) {
          onColumnOrderChange(newColumns.map(c => c.id))
        }
      }
    }
  }

  const activeMobileColumn = columns.find(c => c.id === activeTabId) || columns[0]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        "flex min-h-[500px] -mx-4 md:mx-0",
        isMobile ? "flex-col" : "overflow-x-auto items-stretch"
      )}>
        {isMobile ? (
          /* Mobile Single Column View */
          <div className="flex-1 px-4 pb-20">
            {activeMobileColumn && (
              <KanbanColumn
                key={activeMobileColumn.id}
                id={activeMobileColumn.id}
                title={activeMobileColumn.title}
                color={activeMobileColumn.color}
                files={activeMobileColumn.files}
                onFileClick={onFileClick}
                isAdmin={isAdmin}
                isLast={true}
              />
            )}
          </div>
        ) : (
          /* Desktop Multi Column View */
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((col, idx) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                files={col.files}
                onFileClick={onFileClick}
                isAdmin={isAdmin}
                isLast={idx === columns.length - 1}
              />
            ))}
          </SortableContext>
        )}
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && columns.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-xl border-t z-50 flex items-stretch px-1 pb-safe">
          {columns.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTabId(col.id)}
              style={{ 
                backgroundColor: col.color !== 'transparent' ? col.color : undefined,
                color: col.color !== 'transparent' ? 'white' : 'inherit'
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center transition-all duration-200 px-1",
                activeTabId === col.id ? "opacity-100 font-bold" : "opacity-40 grayscale-[30%]"
              )}
            >
              <span className="text-[10px] uppercase tracking-tighter line-clamp-1 leading-tight text-center">
                {col.title}
              </span>
              <span className="text-[8px] opacity-70">
                {col.files.length}
              </span>
            </button>
          ))}
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {activeFile ? (
          <div className="w-64 cursor-grabbing rotate-3 shadow-2xl">
            <FileCardShared
              file={activeFile}
              commentCount={0}
              onClick={() => {}}
              compact={true}
              isAdmin={false}
            />
          </div>
        ) : activeColumn ? (
          <div className="w-[320px] opacity-80 cursor-grabbing shadow-2xl">
            <KanbanColumn
              id={activeColumn.id}
              title={activeColumn.title}
              color={activeColumn.color}
              files={activeColumn.files}
              onFileClick={() => {}}
              isAdmin={isAdmin}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
