import React, { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { vi, enUS } from 'date-fns/locale'
import {
  ChevronLeft, ChevronDown, Download, Trash2, Upload, Clock,
  HelpCircle, Columns, Share2, Check, Copy, MessageSquare, X, Pencil, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFileStore } from '@/stores/files'
import toast from 'react-hot-toast'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from './ConfirmDialog'

export interface FileViewHeaderProps {
  file: any
  current: any
  projectId: string
  currentVersion: number
  uniqueVersions: any[]
  isAdmin: boolean
  
  onOpenChange: (open: boolean) => void
  onRenameFile?: (fileId: string, newName: string) => void
  onSwitchVersion?: (fileId: string, version: number) => void
  deleteVersion: (projectId: string, fileId: string, version: number) => void
  onUploadNewVersion?: (file: File, existingFileId: string) => Promise<void> | void
  setShowUploadDialog: (show: boolean) => void
  handleDownload: (e: React.MouseEvent, url?: string, versionData?: any) => Promise<void> | void
  
  getFileTypeIcon: (type: string) => React.ReactNode
  getFileTypeLabel: (type: string) => string
  formatFileSize: (size: number) => string
  ensureFileExtension: (name: string, urlStr: string, activeType?: string, modelType?: string) => string
  
  uploadDate: Date
  sequenceContext: any
  latestUrl?: string
  latestVersion: any
  
  handleStartTour: () => void
  videoComparison: { isComparing: boolean, toggleCompare: () => void }
  showComments: boolean
  setShowComments: (show: boolean) => void
  compareMode: boolean
  setCompareMode: (compare: boolean) => void

  getShareLink: () => string
  copyShareLink: () => void
  copied: boolean
}

export function FileViewHeader({
  file, current, projectId, currentVersion, uniqueVersions, isAdmin,
  onOpenChange, onRenameFile, onSwitchVersion, deleteVersion,
  onUploadNewVersion, setShowUploadDialog, handleDownload,
  getFileTypeIcon, getFileTypeLabel, formatFileSize,
  uploadDate, sequenceContext,
  handleStartTour, videoComparison, showComments, setShowComments,
  compareMode, setCompareMode, getShareLink, copyShareLink, copied
}: FileViewHeaderProps) {
  const { t, i18n } = useTranslation(['fileView', 'common', 'review'])
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(file.name)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<any>(null)

  return (
    <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0 group">
      {/* LEFT: File Info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-4">
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
          {getFileTypeIcon(file.type)}
        </div>
        <div className="min-w-0 flex-1">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 truncate">
            {sequenceContext && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2 mr-1"
                onClick={() => onOpenChange(false)}
                title={t('common:actions.back')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            {isRenaming ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="h-8 text-lg font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (renameValue.trim() && onRenameFile) {
                        onRenameFile(file.id, renameValue.trim())
                        setIsRenaming(false)
                      }
                    } else if (e.key === 'Escape') {
                      setIsRenaming(false)
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    if (renameValue.trim() && onRenameFile) {
                      onRenameFile(file.id, renameValue.trim())
                      setIsRenaming(false)
                    }
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setIsRenaming(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="truncate">{file.name}</span>
                {isAdmin && onRenameFile && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setRenameValue(file.name)
                      setIsRenaming(true)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}

            {/* Version dropdown inline with title */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="header-version-dropdown"
                  variant="outline"
                  size="sm"
                  className="gap-1 px-2 min-w-[3.5rem] ml-2"
                  title={t('toolbar.version')}
                >
                  <span className="font-medium text-xs">v{currentVersion}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-2 border-b mb-1">
                  <div className="font-semibold text-sm">{t('toolbar.version')}</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {uniqueVersions
                    .map((version: any) => (
                      <DropdownMenuItem
                        key={version.version}
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => {
                          onSwitchVersion?.(file.id, version.version)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${version.version === currentVersion
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}>
                            v{version.version}
                          </div>
                          <div>
                            <div className="font-medium">
                              {version.version === currentVersion ? t('toolbar.current') : `${t('common:labels.version')} ${version.version}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(version.uploadedAt?.toDate ? version.uploadedAt.toDate() : new Date(), 'dd/MM/yyyy HH:mm', { locale: i18n.language.startsWith('vi') ? vi : enUS })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(e as any, version.url, version)
                            }}
                            title={t('common:actions.download')}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          {isAdmin && uniqueVersions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVersionToDelete(version)
                                setDeleteConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>

                {onUploadNewVersion && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <div className="p-2">
                      <DropdownMenuItem
                        className="w-full justify-start cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault()
                          setShowUploadDialog(true)
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t('toolbar.uploadNew')}
                      </DropdownMenuItem>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogTitle>
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
            <span>{getFileTypeLabel(file.type)}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{formatFileSize(current?.metadata?.size || 0)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {uploadDate && format(uploadDate, 'dd/MM/yyyy HH:mm', { locale: i18n.language.startsWith('vi') ? vi : enUS })}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Actions Toolbar */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* LEFT SIDE: Tour | Share | Download | Comments */}
        <Button
          id="header-tour-btn"
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 hidden sm:flex"
          onClick={handleStartTour}
          title={t('review:header.guide')}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="sr-only">{t('review:header.guide')}</span>
        </Button>

        {file.type === 'video' && uniqueVersions.length > 1 && (
          <Button
            id="header-video-compare-btn"
            variant={videoComparison.isComparing ? 'secondary' : 'ghost'}
            size="sm"
            className="h-9 w-9 px-0 hidden sm:flex"
            onClick={videoComparison.toggleCompare}
            title={videoComparison.isComparing ? t('toolbar.compare') : t('toolbar.compare')}
          >
            <Columns className="w-4 h-4" />
            <span className="sr-only">{t('toolbar.compare')}</span>
          </Button>
        )}

        <div id="header-share-download-group" className="flex items-center gap-1">
          {/* Share Desktop */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="header-share-btn"
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 hidden sm:flex"
                title={t('common:actions.share')}
              >
                <Share2 className="w-4 h-4" />
                <span className="sr-only">{t('common:actions.share')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t('fileView:sharing.title')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('fileView:sharing.anyoneWithLink')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={getShareLink()} className="text-xs h-8" />
                  <Button size="sm" className="h-8 px-2" onClick={copyShareLink}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Share Mobile */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 sm:hidden"
                title={t('common:actions.share')}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{t('fileView:sharing.title')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('fileView:sharing.anyoneWithLink')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={getShareLink()} className="text-xs h-8" />
                  <Button size="sm" className="h-8 px-2" onClick={copyShareLink}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            id="header-download-btn"
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0"
            title={t('common:actions.download')}
            onClick={(e) => handleDownload(e as any)}
          >
            <Download className="w-4 h-4" />
            <span className="sr-only">{t('common:actions.download')}</span>
          </Button>

          {isAdmin && file.isExternalLink && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 px-0"
              onClick={async () => {
                const tid = toast.loading('Đang làm mới...')
                try {
                  await useFileStore.getState().refreshExternalLink(projectId, file.id)
                  toast.success('Đã làm mới!', { id: tid })
                } catch {
                  toast.error('Thất bại', { id: tid })
                }
              }}
              title={file.type === 'sequence' ? 'Đồng bộ Google Drive Folder' : 'Làm mới cache Google Drive Link'}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Button
          id="header-comments-toggle"
          variant={showComments ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="h-9 w-9 px-0 hidden sm:flex"
          title={showComments ? t('comments.hide') : t('comments.show')}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="sr-only">{t('comments.title')}</span>
        </Button>

        <div className="flex-1" />

        {/* Compare Image */}
        {file.type === 'image' && uniqueVersions.length > 1 && (
          <Button
            id="header-compare-btn"
            variant={compareMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => setCompareMode(!compareMode)}
            title={t('toolbar.compare')}
          >
            <Columns className="w-4 h-4" />
            <span className="sr-only">{t('toolbar.compare')}</span>
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`${t('comments.deleteVersion')} ${versionToDelete?.version}?`}
        description={t('comments.deleteVersionConfirm')}
        confirmText={t('comments.deleteVersion')}
        variant="destructive"
        onConfirm={() => {
          if (versionToDelete) {
            deleteVersion(projectId, file.id, versionToDelete.version)
            setDeleteConfirmOpen(false)
            setVersionToDelete(null)
          }
        }}
      />
    </DialogHeader>
  )
}
