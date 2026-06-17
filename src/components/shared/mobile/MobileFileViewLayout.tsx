import { useState, useEffect, type ReactNode, memo } from 'react'
import type { DropPinCoordinates } from '@/types'
import { MobileViewToggle } from './MobileViewToggle'
import { Button } from '@/components/ui/button'
import {
    Download,
    Share2,
    X,
    Clock,
    ChevronDown,
    Layers,
    MessageSquare,
    ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { formatFileSize } from '@/lib/utils'
import type { File as FileType, Comment } from '@/types'
import { CommentsList } from '@/components/comments/CommentsList'

import { CommentBottomSheet } from '@/components/comments/CommentBottomSheet'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from 'react-i18next'

interface MobileFileViewLayoutProps {
    // File info
    file: FileType
    current: any // Version data
    effectiveUrl: string

    // Render functions (passed from parent)
    renderFilePreview: () => ReactNode

    // Comments
    comments: Comment[]
    currentUserName: string
    onUserNameChange: (name: string) => void
    onAddComment: (userName: string, content: string, timestamp?: number, parentCommentId?: string, annotationData?: string | null, attachments?: File[]) => Promise<void>
    onResolveToggle?: (commentId: string, isResolved: boolean) => void
    onEditComment?: (commentId: string, newContent: string) => Promise<void>
    onDeleteComment?: (commentId: string) => Promise<void>
    onTimestampClick?: (timestamp: number) => void
    onViewAnnotation?: (data: string, comment: any) => void

    // State
    isAdmin?: boolean
    isLocked?: boolean
    viewAllVersions: boolean
    onViewAllVersionsChange: (value: boolean) => void

    // Video/Sequence specific
    currentTimestamp?: number
    currentTimeRef?: any

    // Actions
    onClose: () => void
    onDownload: (e: React.MouseEvent<HTMLAnchorElement>) => void
    onShare: () => void

    // Version switching
    uniqueVersions: any[]
    currentVersion: number
    onSwitchVersion?: (fileId: string, version: number) => void

    // Drop pin props
    isDropPinMode?: boolean
    setIsDropPinMode?: (mode: boolean) => void
    dropPinCoordinates?: DropPinCoordinates | null
    setDropPinCoordinates?: (coords: DropPinCoordinates | null) => void
}

/**
 * Mobile-specific layout for file viewing
 * Provides fullscreen toggle between file preview and comments
 * With full annotation support
 */
function MobileFileViewLayoutComponent({
    file,
    current,
    effectiveUrl,
    renderFilePreview,
    comments,
    currentUserName,
    onUserNameChange,
    onAddComment,
    onResolveToggle,
    onEditComment,
    onDeleteComment,
    onTimestampClick,
    onViewAnnotation,
    isAdmin = false,
    isLocked = false,
    viewAllVersions,
    onViewAllVersionsChange,
    currentTimestamp,
    currentTimeRef,
    // Actions
    onClose,
    onDownload,
    onShare,
    uniqueVersions,
    currentVersion,
    onSwitchVersion,
    isDropPinMode = false,
    setIsDropPinMode,
    dropPinCoordinates,
    setDropPinCoordinates,
}: MobileFileViewLayoutProps) {
    const { t } = useTranslation(['fileView', 'common'])
    const [activeView, setActiveView] = useState<'file' | 'comments'>('file')

    const uploadDate = current?.uploadedAt?.toDate ? current.uploadedAt.toDate() : new Date()

    // Lock body scroll when mobile view is active
    useEffect(() => {
        const originalStyle = document.body.style.overflow
        const originalPosition = document.body.style.position
        const originalWidth = document.body.style.width

        // Prevent scrolling on the underlying body
        document.body.style.overflow = 'hidden'
        // iOS fix: position fixed ensures no background scrolling
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'

        return () => {
            document.body.style.overflow = originalStyle
            document.body.style.position = originalPosition
            document.body.style.width = originalWidth
        }
    }, [])



    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
            {/* Header - Compact for mobile */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur-lg safe-area-pt">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {/* Version dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                                        v{currentVersion}
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="max-h-48 overflow-y-auto">
                                    {(uniqueVersions || []).map((v: any) => (
                                        <DropdownMenuItem
                                            key={v.version}
                                            onClick={() => onSwitchVersion?.(file.id, v.version)}
                                            className={v.version === currentVersion ? 'bg-accent' : ''}
                                        >
                                            v{v.version}
                                            {v.version === currentVersion && ' (hiện tại)'}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <h2 className="font-medium text-sm truncate">{file.name}</h2>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>{formatFileSize(current?.metadata?.size || 0)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(uploadDate, 'dd/MM/yyyy')}
                            </span>
                            {current?.externalUrl && (
                                <>
                                    <span>•</span>
                                    <a
                                        href={current.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors border border-primary/20"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{t('fileView:toolbar.originalLink')}</span>
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                    <Button
                        id="mobile-comment-mode-toggle"
                        variant={isDropPinMode ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                            const nextMode = !isDropPinMode;
                            setIsDropPinMode?.(nextMode);
                            if (!nextMode) setDropPinCoordinates?.(null);
                        }}
                    >
                        <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={onShare}
                    >
                        <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                    >
                        <a
                            href={effectiveUrl}
                            download={file.name}
                            onClick={onDownload}
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    </Button>
                </div>
            </div>



            {/* Legacy Annotation Status Bar deprecated */}
            {/* Content area with slide animation */}
            <div className="flex-1 relative overflow-hidden">
                {/* File View */}
                <div
                    className={`absolute inset-0 transition-transform duration-300 ease-out ${activeView === 'file' ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div 
                        id="preview-container" 
                        className={`w-full h-full overflow-auto pb-16 relative ${isDropPinMode ? 'cursor-crosshair' : ''}`}
                    >
                        {renderFilePreview()}

                        {isDropPinMode && dropPinCoordinates && dropPinCoordinates.screenX !== undefined && dropPinCoordinates.screenY !== undefined && (
                            <CommentBottomSheet
                                spatialContext={{
                                    viewerType: file.type as any,
                                    x_pct: dropPinCoordinates.x,
                                    y_pct: dropPinCoordinates.y,
                                    w_pct: dropPinCoordinates.w,
                                    h_pct: dropPinCoordinates.h,
                                    timestamp: file.type === 'video' ? (currentTimeRef?.current ?? currentTimestamp) : undefined,
                                    frameNumber: file.type === 'sequence' ? currentTimestamp : undefined
                                }}
                                onClose={() => { setDropPinCoordinates?.(null); /* Do not turn off isDropPinMode */ }}
                                onSubmit={async (content, attachments, color) => {
                                    const spatialData = dropPinCoordinates.type === 'region'
                                      ? JSON.stringify({ x: dropPinCoordinates.x, y: dropPinCoordinates.y, w: dropPinCoordinates.w, h: dropPinCoordinates.h, color: color || '#ef4444', type: 'region' })
                                      : JSON.stringify({ x: dropPinCoordinates.x, y: dropPinCoordinates.y, color: color || '#ef4444' });
                                    const ts = file.type === 'video' ? (currentTimeRef?.current ?? currentTimestamp) : (file.type === 'sequence' ? currentTimestamp : undefined);
                                    await onAddComment(currentUserName, content, ts, undefined, spatialData, attachments);
                                    setDropPinCoordinates?.(null);
                                }}
                                userName={currentUserName}
                                onUserNameChange={onUserNameChange}
                            />
                        )}
                    </div>
                </div>

                {/* Comments View */}
                <div
                    className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-out ${activeView === 'comments' ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    {/* Comments Header */}
                    <div className="p-3 border-b flex items-center justify-between bg-muted/10 flex-shrink-0">
                        <div className="text-sm font-medium">
                            Bình luận ({comments.length})
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewAllVersionsChange(!viewAllVersions)}
                            className={`h-7 px-2 text-xs gap-1.5 ${viewAllVersions
                                ? 'bg-primary/10 text-primary border-primary/50'
                                : 'text-muted-foreground border-dashed'
                                }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{viewAllVersions ? 'Tất cả' : 'Phiên bản này'}</span>
                        </Button>
                    </div>

                    {/* Legacy Annotation Indicator deprecated */}
                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-3 min-h-0 basic-scroll">
                        <CommentsList
                            comments={comments}
                            currentUserName={currentUserName}
                            onResolveToggle={onResolveToggle}
                            onTimestampClick={(timestamp) => {
                                onTimestampClick?.(timestamp)
                                // Switch to file view when clicking timestamp
                                setActiveView('file')
                            }}
                            onViewAnnotation={(data, comment) => {
                                onViewAnnotation?.(data, comment)
                                // Switch to file view to see annotation
                                setActiveView('file')
                            }}
                            onReply={async (parentCommentId, userName, content) => {
                                await onAddComment(userName, content, undefined, parentCommentId)
                            }}
                            isSequence={file.type === 'sequence'}
                            isAdmin={isAdmin}
                            onEdit={onEditComment}
                            onDelete={onDeleteComment}
                            isLocked={isLocked}
                            showVersionBadge={viewAllVersions}
                        />
                        {comments.length === 0 && (
                            <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                                <div className="text-4xl mb-2 opacity-50">💬</div>
                                <div>Chưa có bình luận nào</div>
                                <div className="text-xs mt-1 mb-6 text-muted-foreground/60">
                                    Hãy là người đầu tiên bình luận
                                </div>
                                {setIsDropPinMode && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-dashed border-2 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground gap-2"
                                        onClick={() => {
                                            setIsDropPinMode(true)
                                            setActiveView('file')
                                        }}
                                    >
                                        {t('fileView:toolbar.commentNow')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>


                </div>
            </div>

            {/* Legacy Annotation Toolbar deprecated */}
            {/* Bottom Toggle Navigation */}
            <MobileViewToggle
                activeView={activeView}
                onViewChange={setActiveView}
            />
        </div>
    )
}

export const MobileFileViewLayout = memo(MobileFileViewLayoutComponent, (prevProps, nextProps) => {
    // Basic props comparison
    if (prevProps.file.id !== nextProps.file.id) return false
    if (prevProps.currentVersion !== nextProps.currentVersion) return false
    if (prevProps.comments !== nextProps.comments) return false
    if (prevProps.isDropPinMode !== nextProps.isDropPinMode) return false
    if (prevProps.dropPinCoordinates !== nextProps.dropPinCoordinates) return false

    // We explicitly IGNORE currentTimestamp updates for re-rendering the whole layout
    // The AddComment component inside will receive the new timestamp, but we'll try to optimize that too.
    // Wait - if we pass nextProps directly to child, child re-renders.
    // But since we are memoizing THIS component (the parent of AddComment/CommentsList in mobile view),
    // we can control whether WE re-render.

    // If currentTimestamp changes, but nothing else -> component DOES NOT re-render.
    // But then AddComment won't get the new timestamp?
    // Correct. That's the optimization. AddComment doesn't need to re-render 10x per second just for a hidden timestamp field.
    // We'll trust that when User hits Submit, we can get the LATEST timestamp from a ref or similar, OR we accept that the displayed timestamp might be slightly stale (0.1s off).
    // Actually, AddComment uses currentTimestamp for placeholder text (WHICH WE ARE REMOVING) and for submission.

    return true
})
