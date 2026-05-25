import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/stores/projects'
import { useFileStore } from '@/stores/files'
import { useCommentStore } from '@/stores/comments'
import { UploadDialog } from '@/components/files/UploadDialog'
import { UploadProgressPopup } from '@/components/files/UploadProgressPopup'
import { ExternalLinkDialog } from '@/components/files/ExternalLinkDialog'
import { FilesList } from '@/components/files/FilesList'
import { DragTooltip } from '@/components/files/DragTooltip'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Share2, Check, Mail, Link, Settings, Upload, ChevronDown, Plus, Link2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ProjectEditDialog } from '@/components/projects/ProjectEditDialog'
import { ProjectShareDialog } from '@/components/dashboard/ProjectShareDialog'
import { Badge } from '@/components/ui/badge'
import { SubscribersListDialog } from '@/components/projects/SubscribersListDialog'
import { ArchiveLinksDropdown } from '@/components/projects/ArchiveLinksDropdown'
import { FileFilters, type SortOption, type SortDirection, type ViewMode } from '@/components/files/FileFilters'
import { Download, CheckSquare } from 'lucide-react'
import { useBulkDownload } from '@/hooks/useBulkDownload'

import { cn } from '@/lib/utils'


export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const { projects, updateProject } = useProjectStore()
  const { subscribeToFiles, cleanup: cleanupFiles } = useFileStore()
  const { handleBulkDownload } = useBulkDownload()
  const comments = useCommentStore(s => s.comments)

  const initialProject = useMemo(() => projects.find(p => p.id === projectId) || null, [projects, projectId])
  const [project, setProject] = useState(initialProject)
  const [isChecking, setIsChecking] = useState(!initialProject)
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSubscribers, setShowSubscribers] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('filesViewMode') as ViewMode) || 'grid'
  })
  
  // Drag & drop states
  const [isDragActive, setIsDragActive] = useState(false)
  const [isDraggingOverCard, setIsDraggingOverCard] = useState(false)
  const dragCounter = useRef(0)
  const [initialDroppedFiles, setInitialDroppedFiles] = useState<File[]>([])
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  
  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('filesViewMode', viewMode)
  }, [viewMode])

  const [thumbnailSize, setThumbnailSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('filesThumbnailSize') as 'sm' | 'md' | 'lg') || 'md'
  })

  useEffect(() => {
    localStorage.setItem('filesThumbnailSize', thumbnailSize)
  }, [thumbnailSize])
  
  const files = useFileStore(s => s.files)

  const availableTypes = useMemo(() => {
    if (!files || !projectId) return []
    const projectFiles = files.filter(f => f.projectId === projectId && !f.isTrashed)
    const types = new Set<string>()
    projectFiles.forEach(f => {
      if (f.type) types.add(f.type)
    })
    return Array.from(types)
  }, [files, projectId])

  const handleCardDragStateChange = (isDragging: boolean, isDropped?: boolean) => {
    setIsDraggingOverCard(isDragging)
    if (isDropped) {
      setIsDragActive(false)
      dragCounter.current = 0
    }
  }
  
  const availableColors = useMemo(() => {
    if (!files || !projectId) return []
    const projectFiles = files.filter(f => f.projectId === projectId)
    const colors = new Set<string>()
    projectFiles.forEach(f => {
      if (f.cardBackgroundColor) colors.add(f.cardBackgroundColor)
    })
    return Array.from(colors)
  }, [files, projectId])

  const handleCopyReviewLink = async () => {
    if (!projectId) return

    const reviewUrl = `${window.location.origin}/share/p/${projectId}`

    try {
      await navigator.clipboard.writeText(reviewUrl)
      setCopied(true)
      toast.success('Đã copy link review!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Không thể copy link')
    }
  }

  useEffect(() => {
    if (projectId) {

      subscribeToFiles(projectId)
    }
    return () => cleanupFiles()
  }, [projectId, subscribeToFiles, cleanupFiles])

  // Subscribe to the specific project document so detail works independently
  useEffect(() => {
    if (!projectId) return
    const ref = doc(db, 'projects', projectId)
    const off = onSnapshot(ref, (snap) => {
      setIsChecking(false)
      if (snap.exists()) {
        setProject({ id: snap.id, ...(snap.data() as any) })
      } else {
        setProject(null)
      }
    }, (error) => {
      console.error('Error subscribing to project:', error)
      setIsChecking(false)
    })
    return off
  }, [projectId])

  // Update page title
  useEffect(() => {
    if (project) {
      document.title = `${project.name} | Review System`
    }

    return () => {
      document.title = 'Review System'
    }
  }, [project])

  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current++
      if (dragCounter.current === 1) {
        setIsDragActive(true)
      }
    }

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current === 0) {
        setIsDragActive(false)
      }
    }

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragActive(false)
      setIsDraggingOverCard(false)

      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) {
        setInitialDroppedFiles(files)
        setShowUploadDialog(true)
      }
    }

    window.addEventListener('dragenter', handleWindowDragEnter)
    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('dragleave', handleWindowDragLeave)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter)
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('dragleave', handleWindowDragLeave)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [])

  if (isChecking) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-10 bg-muted rounded w-24" />
            <div className="h-10 bg-muted rounded w-28" />
            <div className="h-10 bg-muted rounded w-28" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="h-14 bg-muted/20 rounded-xl border border-primary/5" />

        {/* Files List Skeleton */}
        <div className="rounded-xl border bg-card overflow-hidden p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Không tìm thấy dự án</h2>
        <p className="text-muted-foreground max-w-sm">Dự án này không tồn tại hoặc đã bị xóa vĩnh viễn.</p>
        <Button onClick={() => window.history.back()} variant="outline">Quay lại</Button>
      </div>
    )
  }

  return (
    <div 
      className="space-y-6 relative min-h-[calc(100vh-100px)]"
    >


      <SubscribersListDialog
        project={project}
        open={showSubscribers}
        onOpenChange={setShowSubscribers}
      />
      {/* Header với Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Trạng thái: {project.status}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ProjectEditDialog project={project} />

          {/* Share Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Chia sẻ</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyReviewLink}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                Copy link review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSubscribers(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Người đăng ký
                {project.notificationEmails && project.notificationEmails.length > 0 && (
                  <span className="ml-2 flex items-center justify-center bg-red-500 text-white text-[10px] h-4 px-1 rounded-full min-w-[16px]">
                    {project.notificationEmails.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Quản lý quyền truy cập
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Archive Links Dropdown */}
          <ArchiveLinksDropdown project={project} />

          {/* Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Thêm mới</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Tải lên file
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Thêm link (URL)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialogs */}
          <ProjectShareDialog
            projectId={projectId!}
            resourceName={project.name}
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            trigger={<span className="hidden" />}
          />

          {projectId && (
            <>
              <UploadDialog
                projectId={projectId}
                open={showUploadDialog}
                onOpenChange={(open) => {
                  setShowUploadDialog(open)
                  if (!open) setInitialDroppedFiles([])
                }}
                initialFiles={initialDroppedFiles.length > 0 ? initialDroppedFiles : undefined}
                trigger={<span className="hidden" />}
              />
              <ExternalLinkDialog
                projectId={projectId}
                open={showLinkDialog}
                onOpenChange={setShowLinkDialog}
              />
              <UploadProgressPopup />
            </>
          )}

        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        
        {/* Mobile Toolbar & Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-card p-3 rounded-lg border w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="gap-2 text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Bộ lọc & Sắp xếp</span>
            {(searchTerm || selectedColors.length > 0 || selectedTypes.length > 0) && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4 bg-primary/20 text-primary border-transparent">
                {(searchTerm ? 1 : 0) + selectedColors.length + selectedTypes.length}
              </Badge>
            )}
          </Button>

          {/* Action Toolbar on Mobile */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const projectFiles = files.filter(f => f.projectId === projectId && !f.isTrashed)
                const filesToDownload = isSelectionMode && selectedFileIds.size > 0
                  ? projectFiles.filter(f => selectedFileIds.has(f.id))
                  : projectFiles
                handleBulkDownload(filesToDownload.map(f => ({ ...f, projectName: project?.name || 'Project' })), comments)
              }}
              className="h-9 w-9 border-primary/10 bg-card/50"
              title={isSelectionMode && selectedFileIds.size > 0 ? 'Tải về đã chọn' : 'Tải về tất cả'}
            >
              <Download className="w-4 h-4 text-primary/70" />
            </Button>

            <Button
              variant={isSelectionMode ? "secondary" : "outline"}
              size="icon"
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={cn(
                "h-9 w-9 border-primary/10 bg-card/50",
                isSelectionMode && "bg-primary/10 border-primary/20 text-primary"
              )}
              title="Chọn nhiều"
            >
              <CheckSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Sidebar (Filters) */}
        <aside className="hidden lg:block w-60 shrink-0 lg:sticky lg:top-6 h-fit bg-card/30 backdrop-blur-sm p-5 rounded-xl border border-primary/5 shadow-sm">
          <FileFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionToggle={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedColors={selectedColors}
            onColorsChange={setSelectedColors}
            availableColors={availableColors}
            colorLabels={project?.colorLabels}
            thumbnailSize={thumbnailSize}
            onThumbnailSizeChange={setThumbnailSize}
            availableTypes={availableTypes}
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
          />
        </aside>

        {/* Mobile Sidebar Drawer (Overlay) */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-6 overflow-y-auto lg:hidden animate-in fade-in slide-in-from-bottom-5">
            <FileFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionToggle={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedColors={selectedColors}
              onColorsChange={setSelectedColors}
              availableColors={availableColors}
              colorLabels={project?.colorLabels}
              onClose={() => setIsMobileFiltersOpen(false)}
              thumbnailSize={thumbnailSize}
              onThumbnailSizeChange={setThumbnailSize}
              availableTypes={availableTypes}
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
            />
          </div>
        )}

        {/* Files Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Desktop Actions Toolbar */}
          <div className="hidden lg:flex items-center justify-between bg-card p-3 rounded-xl border shadow-sm">
            <div className="text-xs text-muted-foreground font-medium pl-2">
              Tìm thấy {files.filter(f => f.projectId === projectId && !f.isTrashed).length} tài liệu
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const projectFiles = files.filter(f => f.projectId === projectId && !f.isTrashed)
                  const filesToDownload = isSelectionMode && selectedFileIds.size > 0
                    ? projectFiles.filter(f => selectedFileIds.has(f.id))
                    : projectFiles
                  handleBulkDownload(filesToDownload.map(f => ({ ...f, projectName: project?.name || 'Project' })), comments)
                }}
                className="h-9 gap-1.5 border-primary/10 bg-card/50 hover:bg-card/80 text-xs font-bold"
                title={isSelectionMode && selectedFileIds.size > 0 ? 'Tải về đã chọn' : 'Tải về tất cả'}
              >
                <Download className="w-4 h-4 text-primary/70" />
                <span>{isSelectionMode && selectedFileIds.size > 0 ? 'Tải đã chọn' : 'Tải tất cả'}</span>
              </Button>

              <Button
                variant={isSelectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={cn(
                  "h-9 gap-1.5 border-primary/10 bg-card/50 hover:bg-card/80 text-xs font-bold",
                  isSelectionMode && "bg-primary/10 border-primary/20 text-primary"
                )}
                title="Chọn nhiều"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Chọn nhiều</span>
              </Button>
            </div>
          </div>

          {/* Files List Container */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden relative">
            {/* Drag & Drop Main Overlay */}
            {isDragActive && !isDraggingOverCard && (
              <div className="absolute inset-1 z-50 rounded-lg border-2 border-primary/50 border-dashed bg-primary/[0.01] flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                <div className="bg-card/95 border border-primary/10 shadow-xl p-3 rounded-lg flex items-center gap-2.5 max-w-xs transition-all duration-300">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 text-primary animate-bounce" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[11px] font-bold text-foreground">Kéo thả vào đây để upload file mới</h4>
                    <p className="text-[9px] text-muted-foreground">Tải lên tài liệu mới cho dự án</p>
                  </div>
                </div>
              </div>
            )}

            <div className={cn(
              viewMode !== 'kanban' && "p-6"
            )}>
              {projectId && (
                <FilesList 
                  projectId={projectId} 
                  sortBy={sortBy} 
                  sortDirection={sortDirection} 
                  searchTerm={searchTerm} 
                  selectedColors={selectedColors}
                  viewMode={viewMode}
                  isSelectionMode={isSelectionMode}
                  onSelectionModeChange={setIsSelectionMode}
                  selectedFileIds={selectedFileIds}
                  onSelectedFileIdsChange={setSelectedFileIds}
                  colorLabels={project?.colorLabels}
                  columnOrder={project?.kanbanColumnOrder}
                  onColumnOrderChange={(newOrder) => {
                    if (projectId) updateProject(projectId, { kanbanColumnOrder: newOrder })
                  }}
                  thumbnailSize={thumbnailSize}
                  selectedTypes={selectedTypes}
                  onCardDragStateChange={handleCardDragStateChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <DragTooltip isActive={isDragActive} isOverCard={isDraggingOverCard} />
    </div>
  )
}
