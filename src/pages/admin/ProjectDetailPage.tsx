import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/stores/projects'
import { useFileStore } from '@/stores/files'
import { useCommentStore } from '@/stores/comments'
import { UploadDialog } from '@/components/files/UploadDialog'
import { UploadProgressPopup } from '@/components/files/UploadProgressPopup'
import { ExternalLinkDialog } from '@/components/files/ExternalLinkDialog'
import { FilesList } from '@/components/files/FilesList'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Share2, Check, Mail, Link, Settings, Upload, ChevronDown, Plus, Link2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ProjectEditDialog } from '@/components/projects/ProjectEditDialog'
import { ProjectShareDialog } from '@/components/dashboard/ProjectShareDialog'
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
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('filesViewMode') as ViewMode) || 'grid'
  })
  
  // Drag & drop states
  const [isDragActive, setIsDragActive] = useState(false)
  const [initialDroppedFiles, setInitialDroppedFiles] = useState<File[]>([])
  
  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('filesViewMode', viewMode)
  }, [viewMode])
  
  const files = useFileStore(s => s.files)
  
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragActive) {
      setIsDragActive(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Kéo vào chỉ hiển thị nếu chưa có drag active hoặc target là container chính
    if (!isDragActive) {
      setIsDragActive(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setInitialDroppedFiles(files)
      setShowUploadDialog(true)
    }
  }

  return (
    <div 
      className="space-y-6 relative min-h-[calc(100vh-100px)]"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Main Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm rounded-xl border-2 border-primary border-dashed flex items-center justify-center pointer-events-none">
          <div className="bg-card/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            </div>
            <h3 className="text-xl font-bold mb-2">Thả file vào đây</h3>
            <p className="text-muted-foreground">Các file sẽ được tải lên dự án này</p>
          </div>
        </div>
      )}

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

      {/* Filters and Controls */}
      <div className="bg-card/30 backdrop-blur-sm p-4 rounded-xl border border-primary/5 shadow-sm">
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
        >
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
              className="h-10 w-10 border-primary/10 bg-card/50 backdrop-blur-sm hover:bg-card/80"
              title={isSelectionMode && selectedFileIds.size > 0 ? 'Tải về đã chọn' : 'Tải về tất cả'}
            >
              <Download className="w-4 h-4 text-primary/70" />
            </Button>

            <Button
              variant={isSelectionMode ? "secondary" : "outline"}
              size="icon"
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={cn(
                "h-10 w-10 border-primary/10 bg-card/50 backdrop-blur-sm hover:bg-card/80",
                isSelectionMode && "bg-primary/10 border-primary/20 text-primary"
              )}
              title="Chọn nhiều"
            >
              <CheckSquare className="w-4 h-4" />
            </Button>
          </div>
        </FileFilters>
      </div>

      {/* Files List */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
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
            />
          )}
        </div>
      </div>
    </div>
  )
}
