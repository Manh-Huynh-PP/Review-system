import { useEffect, useMemo, useState } from 'react'
import { useFileStore } from '@/stores/files'
import { useCommentStore } from '@/stores/comments'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { FileCardShared } from '@/components/shared/FileCardShared'
import { FileViewDialogShared } from '@/components/shared/FileViewDialogShared'
import { DeleteFileDialog } from './DeleteFileDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { formatFileSize } from '@/lib/utils'
import { Trash2, X, CheckSquare, Square, Grid3x3, List, MessageSquare, Calendar, FileImage, Download, Play } from 'lucide-react'
import type { File as FileType } from '@/types'
import { useBulkDownload } from '@/hooks/useBulkDownload'
import { DownloadProgressDialog } from '@/components/dashboard/DownloadProgressDialog'
import { CardColorPicker } from '../shared/CardColorPicker'
import { cn } from '@/lib/utils'

type SortOption = 'name' | 'date' | 'type' | 'size'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

interface FilesListProps {
  projectId: string
  sortBy?: SortOption
  sortDirection?: SortDirection
  searchTerm?: string
}

const getFileTypeLabel = (type: string) => {
  if (type === 'image') return 'Hình ảnh'
  if (type === 'video') return 'Video'
  if (type === 'model') return 'Mô hình 3D'
  if (type === 'sequence') return 'Image Sequence'
  if (type === 'pdf') return 'PDF'
  return 'Tệp tin'
}

export function FilesList({ projectId, sortBy = 'date', sortDirection = 'desc', searchTerm = '' }: FilesListProps) {
  const { files, switchVersion, deleteFile, deleting, uploadFile, setSequenceViewMode, updateFrameCaption, renameFile, toggleFileLock, selectedFile: storeSelectedFile, selectFile: storeSelectFile, updateFileBackgroundColor } = useFileStore()
  const { comments, subscribeToComments, addComment, toggleResolve, editComment, deleteComment, cleanup: cleanupComments } = useCommentStore()
  const { user } = useAuthStore()
  const project = useProjectStore(s => s.project)
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null)
  const [currentUserName, setCurrentUserName] = useState(() => {
    return localStorage.getItem('reviewUserName') || ''
  })
  const [displayLimit, setDisplayLimit] = useState(20)

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const {
    handleBulkDownload,
    isDownloading,
    downloadProgress,
    downloadMessage,
    currentDownloadFile
  } = useBulkDownload()

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('filesViewMode') as ViewMode) || 'grid'
  })

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('filesViewMode', viewMode)
  }, [viewMode])

  const getKey = (fileId: string, version: number) => `${fileId}-v${version}`

  const ensureDownloadUrl = async (fileId: string, version: number, storagePath: string, currentUrl?: string) => {
    const key = getKey(fileId, version)
    if (resolvedUrls[key]) return resolvedUrls[key]

    const needsFix = currentUrl?.includes('firebasestorage.app')
    if (!needsFix) return currentUrl

    try {
      const url = await getDownloadURL(ref(storage, storagePath))
      setResolvedUrls(prev => ({ ...prev, [key]: url }))
      return url
    } catch (e: any) {
      if (e.code !== 'storage/object-not-found') {
        console.warn('Failed to refresh URL:', e)
      }
      return currentUrl
    }
  }

  // Fix invalid legacy download URLs once per file-version
  useEffect(() => {
    const run = async () => {
      const tasks: Promise<any>[] = []
      for (const f of files || []) {
        const current = f.versions.find(v => v.version === f.currentVersion) || f.versions[0]
        if (!current?.url || !current?.metadata?.name) continue
        if (current.url.includes('token=')) continue

        const key = getKey(f.id, current.version)
        if (resolvedUrls[key]) continue
        if (!current.url.includes('firebasestorage.app')) continue

        const storagePath = `projects/${projectId}/${f.id}/v${current.version}/${current.metadata.name}`
        tasks.push(ensureDownloadUrl(f.id, current.version, storagePath, current.url))
      }
      if (tasks.length) {
        await Promise.allSettled(tasks)
      }
    }
    run()
  }, [files, projectId])

  // Subscribe to comments
  useEffect(() => {
    subscribeToComments(projectId)
    return () => cleanupComments()
  }, [projectId, subscribeToComments, cleanupComments])

  // External trigger open file
  useEffect(() => {
    if (storeSelectedFile && storeSelectedFile.projectId === projectId) {
      setSelectedFile(storeSelectedFile)
      setDialogOpen(true)
      setTimeout(() => storeSelectFile(null), 100)
    }
  }, [storeSelectedFile, projectId, storeSelectFile])

  // Auto-update selected file
  useEffect(() => {
    if (selectedFile && files) {
      const updatedFile = files.find(f => f.id === selectedFile.id)
      if (updatedFile && (
        updatedFile.currentVersion !== selectedFile.currentVersion ||
        updatedFile.name !== selectedFile.name ||
        updatedFile.updatedAt?.toMillis() !== selectedFile.updatedAt?.toMillis()
      )) {
        setSelectedFile({ ...updatedFile })
      }
    }
  }, [files, selectedFile])

  const getCommentCount = (fileId: string, version: number) => {
    return comments.filter(c => c.fileId === fileId && c.version === version).length
  }

  const handleFileClick = (file: FileType) => {
    setSelectedFile(file)
    setDialogOpen(true)
  }

  const handleSwitchVersion = async (fileId: string, version: number) => {
    await switchVersion(fileId, version)
    const updatedFile = files?.find(f => f.id === fileId)
    if (updatedFile) setSelectedFile({ ...updatedFile })
  }

  const handleUserNameChange = (name: string) => {
    setCurrentUserName(name)
    localStorage.setItem('reviewUserName', name)
  }

  const handleAddComment = async (userName: string, content: string, timestamp?: number, parentCommentId?: string, annotationData?: string | null, attachments?: File[]) => {
    if (selectedFile) {
      await addComment(projectId, selectedFile.id, selectedFile.currentVersion, userName, content, timestamp, parentCommentId, annotationData, attachments)
    }
  }

  const handleResolveToggle = (commentId: string, isResolved?: boolean) => {
    if (user) toggleResolve(projectId, commentId, !!isResolved)
  }

  const handleDeleteClick = (file: FileType) => {
    setFileToDelete(file)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        await deleteFile(projectId, fileToDelete.id)
        setDeleteDialogOpen(false)
        setFileToDelete(null)
        if (selectedFile?.id === fileToDelete.id) {
          setDialogOpen(false)
          setSelectedFile(null)
        }
      } catch (error) {}
    }
  }

  const handleUploadNewVersion = async (newFile: File, existingFileId: string) => {
    if (user) await uploadFile(projectId, newFile, existingFileId)
  }

  const handleSequenceViewModeChange = async (fileId: string, mode: 'video' | 'carousel' | 'grid') => {
    await setSequenceViewMode(projectId, fileId, mode)
  }

  const handleCaptionChange = async (fileId: string, version: number, frame: number, caption: string) => {
    await updateFrameCaption(projectId, fileId, version, frame, caption)
  }

  const handleEditComment = async (commentId: string, newContent: string) => {
    await editComment(projectId, commentId, newContent)
  }

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(projectId, commentId)
  }

  const filteredAndSortedFiles = useMemo(() => {
    if (!files) return []
    let filtered = files.filter(f => f.projectId === projectId && !f.isTrashed)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(file => {
        const matchesName = file.name.toLowerCase().includes(term)
        const matchesType = getFileTypeLabel(file.type).toLowerCase().includes(term)
        const currentVersion = file.versions.find(v => v.version === file.currentVersion) || file.versions[0]
        const matchesFileName = currentVersion?.metadata.name.toLowerCase().includes(term)
        return matchesName || matchesType || matchesFileName
      })
    }
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0
      switch (sortBy) {
        case 'name': compareValue = a.name.localeCompare(b.name); break
        case 'date': compareValue = a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime(); break
        case 'type': compareValue = a.type.localeCompare(b.type); break
        case 'size': {
          const aVersion = a.versions.find(v => v.version === a.currentVersion) || a.versions[0]
          const bVersion = b.versions.find(v => v.version === b.currentVersion) || b.versions[0]
          compareValue = (aVersion?.metadata.size || 0) - (bVersion?.metadata.size || 0)
          break
        }
        default: return 0
      }
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
    return sorted
  }, [files, sortBy, sortDirection, searchTerm])

  const displayedFiles = filteredAndSortedFiles.slice(0, displayLimit)
  const hasMore = filteredAndSortedFiles.length > displayLimit

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => {
      if (prev) setSelectedFileIds(new Set())
      return !prev
    })
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) newSet.delete(fileId)
      else newSet.add(fileId)
      return newSet
    })
  }

  const selectAllDisplayed = () => {
    const allIds = displayedFiles.map(f => f.id)
    setSelectedFileIds(new Set(allIds))
  }

  const deselectAllFiles = () => setSelectedFileIds(new Set())

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return
    setBulkDeleting(true)
    try {
      for (const fileId of selectedFileIds) await deleteFile(projectId, fileId)
      setSelectedFileIds(new Set())
      setBulkDeleteDialogOpen(false)
      setIsSelectionMode(false)
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setBulkDeleting(false)
    }
  }

  if (!filteredAndSortedFiles.length) {
    if (searchTerm.trim()) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-lg mb-2">Không tìm thấy kết quả</div>
          <div className="text-sm">Thử tìm kiếm với từ khóa khác</div>
        </div>
      )
    }
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center text-2xl">📁</div>
        <div className="text-lg font-medium mb-2">Chưa có tài liệu nào</div>
        <div className="text-sm text-muted-foreground">Hãy tải lên file đầu tiên cho dự án này</div>
      </div>
    )
  }

  return (
    <>
      {user && filteredAndSortedFiles.length > 0 && (
        <div className="flex items-center justify-between mb-4 bg-background/50 backdrop-blur-sm p-2 rounded-lg border border-primary/5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
            <span className="font-medium">{filteredAndSortedFiles.length} tài liệu</span>
            {isSelectionMode && selectedFileIds.size > 0 && (
              <span className="text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">
                Đã chọn {selectedFileIds.size}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const filesToDownload = isSelectionMode && selectedFileIds.size > 0
                  ? files.filter(f => selectedFileIds.has(f.id))
                  : filteredAndSortedFiles
                handleBulkDownload(filesToDownload.map(f => ({ ...f, projectName: 'Project Files' })), comments)
              }}
              className="h-8 px-3 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Tải về {isSelectionMode && selectedFileIds.size > 0 ? 'đã chọn' : 'tất cả'}</span>
            </Button>

            <div className="flex items-center bg-muted/50 p-0.5 rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 px-2 rounded-sm"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-2 rounded-sm"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="h-4 w-px bg-border mx-1" />

            {isSelectionMode ? (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={selectedFileIds.size < displayedFiles.length ? selectAllDisplayed : deselectAllFiles} className="h-8 px-2 text-xs">
                  {selectedFileIds.size < displayedFiles.length ? <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> : <Square className="w-3.5 h-3.5 mr-1.5" />}
                  {selectedFileIds.size < displayedFiles.length ? 'Tất cả' : 'Bỏ chọn'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} disabled={selectedFileIds.size === 0} className="h-8 px-3 text-xs font-bold">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Xóa
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleSelectionMode} className="h-8 w-8 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                Chọn nhiều
              </Button>
            )}
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedFiles.map((file) => {
            const current = file.versions.find(v => v.version === file.currentVersion) || file.versions[0]
            const effectiveUrl = resolvedUrls[getKey(file.id, current?.version ?? 1)] ?? current?.url
            const commentCount = getCommentCount(file.id, file.currentVersion)
            const isSelected = selectedFileIds.has(file.id)

            return (
              <div key={file.id} className="relative group/card">
                {isSelectionMode && (
                  <div className={cn("absolute top-3 right-3 z-30 transition-all", isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100")}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleFileSelection(file.id)} className="h-5 w-5 bg-background border-2 shadow-xl" />
                  </div>
                )}
                <FileCardShared
                  file={file}
                  resolvedUrl={effectiveUrl}
                  commentCount={commentCount}
                  onClick={() => isSelectionMode ? toggleFileSelection(file.id) : handleFileClick(file)}
                  onDelete={user && !isSelectionMode ? () => handleDeleteClick(file) : undefined}
                  onToggleLock={user && !isSelectionMode ? () => toggleFileLock(projectId, file.id, !file.isCommentsLocked) : undefined}
                  isLocked={file.isCommentsLocked}
                  isAdmin={!!user}
                />
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {displayedFiles.map((file) => {
            const current = file.versions.find(v => v.version === file.currentVersion) || file.versions[0]
            const effectiveUrl = resolvedUrls[getKey(file.id, current?.version ?? 1)] ?? current?.url
            const commentCount = getCommentCount(file.id, file.currentVersion)
            const isSelected = selectedFileIds.has(file.id)

            const renderListThumbnail = () => {
              if (file.type === 'image' && effectiveUrl) return <img src={effectiveUrl} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
              if (file.type === 'sequence' && effectiveUrl) return (
                <div className="absolute inset-0">
                  <img src={effectiveUrl} alt={file.name} className="w-full h-full object-cover" />
                  <Badge variant="secondary" className="absolute bottom-1 right-1 text-[8px] px-1 py-0 h-3.5 backdrop-blur-sm bg-black/60 text-white border-0">{current?.frameCount || 0}f</Badge>
                </div>
              )
              if (file.type === 'video' && effectiveUrl) return (
                <div className="absolute inset-0 bg-muted">
                  <img src={effectiveUrl} alt={file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="w-5 h-5 text-white fill-current" /></div>
                </div>
              )
              if (file.type === 'model' && current?.thumbnailUrl) return <img src={current.thumbnailUrl} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
              if (file.type === 'pdf' && current?.thumbnailUrl) return <img src={current.thumbnailUrl} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
              return <div className="absolute inset-0 flex items-center justify-center bg-muted/20 text-muted-foreground"><FileImage className="w-6 h-6" /></div>
            }

            // Adaptive styles for List Row
            const rowStyle = file.cardBackgroundColor ? {
              backgroundColor: `color-mix(in srgb, ${file.cardBackgroundColor}, transparent 92%)`,
              borderColor: `color-mix(in srgb, ${file.cardBackgroundColor}, transparent 70%)`,
            } : {};

            return (
              <div
                key={file.id}
                className={cn(
                  "group relative flex items-center gap-4 p-2.5 rounded-lg border transition-all cursor-pointer hover:bg-muted/30",
                  isSelected ? "ring-2 ring-primary bg-primary/5 border-primary/50" : "bg-card",
                  file.cardBackgroundColor && "border-opacity-50"
                )}
                style={rowStyle}
                onClick={() => isSelectionMode ? toggleFileSelection(file.id) : handleFileClick(file)}
              >

                {isSelectionMode && (
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleFileSelection(file.id)} className="h-4 w-4 ml-1" onClick={e => e.stopPropagation()} />
                )}

                <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 relative bg-muted/10 border border-white/5">
                  {renderListThumbnail()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{file.name}</h3>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter opacity-70">
                      {getFileTypeLabel(file.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {file.createdAt.toDate().toLocaleDateString('vi-VN')}</span>
                    <span>{file.isExternalLink ? 'Link' : formatFileSize(current?.metadata.size || 0)}</span>
                    {file.versions.length > 1 && <span className="font-bold text-primary/70 underline decoration-dotted">v{file.currentVersion}</span>}
                    {commentCount > 0 && (
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <MessageSquare className="w-3 h-3" /> {commentCount}
                      </span>
                    )}
                  </div>
                </div>

                {user && !isSelectionMode && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2" onClick={e => e.stopPropagation()}>
                    <CardColorPicker
                      currentColor={file.cardBackgroundColor}
                      onColorChange={(color) => updateFileBackgroundColor(projectId, file.id, color)}
                      align="end"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(file); }}
                      className="h-8 w-8 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => setDisplayLimit(prev => prev + 20)} className="gap-2 px-8 font-bold text-xs uppercase tracking-widest shadow-sm">
            Tải thêm ({filteredAndSortedFiles.length - displayLimit})
          </Button>
        </div>
      )}

      {selectedFile && (
        <FileViewDialogShared
          file={selectedFile}
          projectId={projectId}
          resolvedUrl={resolvedUrls[getKey(selectedFile.id, selectedFile.currentVersion)]}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSwitchVersion={handleSwitchVersion}
          onUploadNewVersion={user ? handleUploadNewVersion : undefined}
          onSequenceViewModeChange={user ? handleSequenceViewModeChange : undefined}
          comments={comments}
          currentUserName={currentUserName}
          onUserNameChange={handleUserNameChange}
          onAddComment={handleAddComment}
          onResolveToggle={user ? handleResolveToggle : undefined}
          isAdmin={!!user}
          onCaptionChange={user ? handleCaptionChange : undefined}
          onEditComment={user ? handleEditComment : undefined}
          onDeleteComment={user ? handleDeleteComment : undefined}
          onRenameFile={user ? async (fileId, newName) => await renameFile(projectId, fileId, newName) : undefined}
          project={project || undefined}
          isArchived={project?.status === 'archived'}
        />
      )}

      <DeleteFileDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} fileName={fileToDelete?.name || ''} loading={deleting} />
      <DeleteFileDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen} onConfirm={handleBulkDelete} fileName={`${selectedFileIds.size} file đã chọn`} loading={bulkDeleting} />
      <DownloadProgressDialog open={isDownloading} progress={downloadProgress} message={downloadMessage} fileName={currentDownloadFile} />
    </>
  )
}
