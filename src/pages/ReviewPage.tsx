import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useInvitationStore } from '@/stores/invitationStore'
import type { ProjectInvitation } from '@/types'
import { useProjectStore } from '@/stores/projects'
import { useFileStore } from '@/stores/files'
import { useCommentStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileFilters, type SortOption, type SortDirection, type ViewMode } from '@/components/files/FileFilters'
import { FilesList } from '@/components/files/FilesList'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LanguageToggle } from '@/components/LanguageToggle'
import { NotificationSubscriptionDialog } from '@/components/shared/NotificationSubscriptionDialog'
import { HelpCircle, ShieldAlert, Loader2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { resetTourStatus } from '@/lib/fileTours'
import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useBulkDownload } from '@/hooks/useBulkDownload'
import { DownloadProgressDialog } from '@/components/dashboard/DownloadProgressDialog'
import { Archive, ExternalLink, Menu, Globe, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useThemeStore } from '@/stores/theme'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReviewPage() {
  const { t, i18n } = useTranslation(['review', 'common'])
  const {
    isDownloading,
    downloadProgress,
    downloadMessage,
    currentDownloadFile
  } = useBulkDownload()
  const { theme, toggleTheme } = useThemeStore()
  const { projectId, fileId } = useParams<{ projectId: string; fileId?: string }>()
  const { project, fetchProject } = useProjectStore()
  const { files, loadingFiles, subscribeToFiles, cleanup: cleanupFiles } = useFileStore()
  const { subscribeToComments, cleanup: cleanupComments } = useCommentStore()
  const { user } = useAuthStore()

  const projectFiles = useMemo(() => {
    return files.filter(f => f.projectId === projectId && !f.isTrashed)
  }, [files, projectId])

  const [isVerifyingEmpty, setIsVerifyingEmpty] = useState(true)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  useEffect(() => {
    if (!loadingFiles && projectFiles.length === 0) {
      const timer = setTimeout(() => setIsVerifyingEmpty(false), 800)
      return () => clearTimeout(timer)
    } else {
      setIsVerifyingEmpty(true)
    }
  }, [loadingFiles, projectFiles.length])

  const [currentUserName, setCurrentUserName] = useState(() => {
    return localStorage.getItem('reviewUserName') || ''
  })
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('reviewUserAvatar') || '/avatar/Connection.svg'
  })
  const [selectedColor, setSelectedColor] = useState(() => {
    return localStorage.getItem('reviewUserColor') || '#A855F7'
  })

  const [loading, setLoading] = useState(true)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [isInitialPrompt, setIsInitialPrompt] = useState(true)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { validateToken, verifyOTP, requestOTP, recoverAccess } = useInvitationStore()

  useEffect(() => {
    if (!projectId) return

    const load = async () => {
      try {
        await fetchProject(projectId)
        subscribeToFiles(projectId)
        subscribeToComments(projectId)
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    }

    load()

    return () => {
      cleanupFiles()
      cleanupComments()
    }
  }, [projectId, fetchProject, subscribeToFiles, subscribeToComments, cleanupFiles, cleanupComments])

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const availableTypes = useMemo(() => {
    if (!files || !projectId) return []
    const projectFiles = files.filter(f => f.projectId === projectId && !f.isTrashed)
    const types = new Set<string>()
    projectFiles.forEach(f => {
      if (f.type) types.add(f.type)
    })
    return Array.from(types)
  }, [files, projectId])


  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('filesViewMode') as ViewMode) || 'grid'
  })

  useEffect(() => {
    localStorage.setItem('filesViewMode', viewMode)
  }, [viewMode])

  const [thumbnailSize, setThumbnailSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('filesThumbnailSize') as 'sm' | 'md' | 'lg') || 'md'
  })

  useEffect(() => {
    localStorage.setItem('filesThumbnailSize', thumbnailSize)
  }, [thumbnailSize])

  const availableColors = useMemo(() => {
    if (!files || !projectId) return []
    const projectFiles = files.filter(f => f.projectId === projectId)
    const colors = new Set<string>()
    projectFiles.forEach(f => {
      if (f.cardBackgroundColor) colors.add(f.cardBackgroundColor)
    })
    return Array.from(colors)
  }, [files, projectId])

  // Access Control State
  const [accessStatus, setAccessStatus] = useState<'checking' | 'allowed' | 'denied' | 'verification_needed'>('checking')
  const [accessError, setAccessError] = useState<string>('')
  const [invitation, setInvitation] = useState<ProjectInvitation | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const hasCheckedAccess = useRef(false)


  // Device ID Management
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', crypto.randomUUID())
    }
  }, [])
  const deviceId = localStorage.getItem('deviceId') || ''

  // Access Guard Logic
  useEffect(() => {
    const checkAccess = async () => {
      // Allow re-check if user login status changes, but be careful of loops.
      // Ideally hasCheckedAccess should be reset if dependencies change significantly?
      // But for simplicity, we check user first.

      if (!project) return // Wait for project load

      // 0.5. DELETED CHECK
      if (project.status === 'trash') {
        setAccessStatus('denied')
        setAccessError(t('access.projectDeleted'))
        setLoading(false)
        return
      }

      // 0. ADMIN BYPASS
      if (user) {
        setAccessStatus('allowed')
        setLoading(false)
        return
      }

      if (hasCheckedAccess.current) return

      // 1. If public, allow immediately
      if (project.accessLevel !== 'token_required') {
        setAccessStatus('allowed')
        setLoading(false)
        return
      }

      // 2. If private, check token
      if (!token) {
        setAccessStatus('denied')
        setAccessError(t('access.required'))
        setLoading(false)
        return
      }

      // 3. Validate Token
      setAccessStatus('checking')
      const result = await validateToken(token)

      if (!result.isValid || !result.invitation) {
        setAccessStatus('denied')
        setAccessError(result.error || t('review:access.tokenInvalid'))
        setLoading(false)
        return
      }

      setInvitation(result.invitation)

      // 4. Check Scope (File vs Project)
      if (result.invitation.resourceType === 'file') {
        // Logic to restrict view to ONLY this file is complex in this component structure
        // For now, allow access but we should filter the `files` list later
        if (fileId && result.invitation.resourceId !== fileId) {
          setAccessStatus('denied')
          setAccessError(t('review:access.noPermission'))
          setLoading(false)
          return
        }
      }

      // 5. Check Device Binding (Multi-Device Logic)
      const allowedDevices = result.invitation.allowedDevices || []

      if (allowedDevices.includes(deviceId)) {
        setAccessStatus('allowed')
      } else {
        if (allowedDevices.length === 0) {
          // First time, treat as needing verification (or auto-bind logic if desired)
          // We stick to current plan: verification needed.
          setAccessStatus('verification_needed')
        } else {
          setAccessStatus('verification_needed')
        }
      }

      setLoading(false)
      hasCheckedAccess.current = true
    }

    if (project) {
      checkAccess()
    }
  }, [project, token, validateToken, deviceId, fileId, user])

  const handleDeviceVerification = async () => {
    if (!invitation) return
    setVerifyingOtp(true)
    try {
      if (invitation.allowedDevices.length === 0) {
        await requestOTP(invitation.id)
      } else {
        await verifyOTP(invitation.id, otpCode, deviceId)
      }

      // Re-check (reload invitation)
      const result = await validateToken(invitation.token)
      if (result.invitation && result.invitation.allowedDevices.includes(deviceId)) {
        setAccessStatus('allowed')
      }
    } catch (e) {
      toast.error(t('verification.failed'))
    } finally {
      setVerifyingOtp(false)
    }
  }





  // Update page title
  useEffect(() => {
    if (project) {
      document.title = `${project.name} | Review system`
    }

    return () => {
      document.title = 'Review system'
    }
  }, [project])

  // Show name prompt if user doesn't have a name
  useEffect(() => {
    if (!loading && !currentUserName) {
      setIsInitialPrompt(true)
      setShowNamePrompt(true)
    }
  }, [loading, currentUserName])

  const handleUserNameChange = (name: string) => {
    setCurrentUserName(name)
    localStorage.setItem('reviewUserName', name)
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = (e.target as HTMLFormElement).elements.namedItem('userName') as HTMLInputElement
    const name = input.value.trim()
    if (name) {
      handleUserNameChange(name)
      // Save avatar settings
      localStorage.setItem('reviewUserAvatar', selectedAvatar)
      localStorage.setItem('reviewUserColor', selectedColor)
      setShowNamePrompt(false)
    }
  }



  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  const handleRecoverAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryEmail || !projectId) return

    setRecovering(true)
    try {
      await recoverAccess(projectId, recoveryEmail)
      setShowCodeInput(true)
      // Optional: Show check email message permanently or instructions
    } catch (error) {
      // Toast handled in store
    } finally {
      setRecovering(false)
    }
  }

  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !recoveryEmail || !accessCode) return

    setVerifyingCode(true)
    try {
      const token = await useInvitationStore.getState().verifyAccessCode(projectId, recoveryEmail, accessCode, deviceId)
      if (token) {
        // Redirect to url with token
        const url = new URL(window.location.href)
        url.searchParams.set('token', token)
        window.location.href = url.toString()
      }
    } catch (error) {
      // Toast handled in store
    } finally {
      setVerifyingCode(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('common:status.loading')}</p>
        </div>
      </div>
    )
  }

  if (accessStatus === 'denied') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-lg p-6 space-y-6 shadow-lg">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-destructive">{t('access.denied')}</h2>
            <p className="text-muted-foreground">{accessError}</p>
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">{t('recovery.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {showCodeInput
                  ? t('recovery.sent', { email: recoveryEmail })
                  : t('recovery.prompt')}
              </p>
            </div>

            {!showCodeInput ? (
              <form onSubmit={handleRecoverAccess} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={recoveryEmail}
                      onChange={e => setRecoveryEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={recovering}>
                  {recovering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {recovering ? t('recovery.sending') : t('review:verification.sendOtp')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAccessCode} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder={t('review:recovery.sent', { email: '' }).split(' ')[0] + " 6 số"}
                    className="text-center text-lg tracking-widest"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={verifyingCode}>
                  {verifyingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {verifyingCode ? t('recovery.checking') : t('review:recovery.access')}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setShowCodeInput(false)}>
                  {t('recovery.backToEmail')}
                </Button>
              </form>
            )}
          </div>

          <div className="text-center">
            <Button variant="link" onClick={() => window.location.reload()}>
              {t('actions.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (accessStatus === 'verification_needed') {
    const isFirstTime = invitation?.allowedDevices?.length === 0

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-lg p-6 space-y-6 shadow-lg">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t('verification.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {isFirstTime
                ? t('verification.firstTime')
                : t('verification.notLinked')}
            </p>
          </div>

          {!otpCode && isFirstTime ? (
            <div className="space-y-4">
              <Button
                className="w-full"
                onClick={handleDeviceVerification}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? <Loader2 className="animate-spin text-primary" /> : t('verification.sendOtp')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder={t('verification.otpPlaceholder')}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleDeviceVerification}
                disabled={verifyingOtp || otpCode.length < 4}
              >
                {verifyingOtp ? <Loader2 className="animate-spin" /> : t('verification.verify')}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtpCode('')
                  if (invitation) requestOTP(invitation.id)
                }}
              >
                {t('verification.resend')}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">{t('access.projectNotFound')}</p>
          <p className="text-muted-foreground">{t('access.projectNotFoundDesc')}</p>
        </div>
      </div>
    )
  }

  const isArchived = project.status === 'archived'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DownloadProgressDialog
        open={isDownloading}
        progress={downloadProgress}
        message={downloadMessage}
        fileName={currentDownloadFile}
      />

      <Dialog open={showNamePrompt} onOpenChange={setShowNamePrompt}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => isInitialPrompt && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {isInitialPrompt ? t('onboarding.welcome') : t('onboarding.settings')}
            </DialogTitle>
            <DialogDescription>
              {isInitialPrompt
                ? t('onboarding.descNew')
                : t('onboarding.descUpdate')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('onboarding.displayName')}</label>
              <Input
                name="userName"
                placeholder={t('onboarding.namePlaceholder')}
                required
                autoFocus
                className="w-full"
                defaultValue={currentUserName}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">{t('onboarding.selectAvatar')}</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  '/avatar/Connection.svg',
                  '/avatar/Momentum.svg',
                  '/avatar/Radiance.svg',
                  '/avatar/structure.svg'
                ].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedAvatar(src)}
                    className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all ${selectedAvatar === src ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center p-2"
                    >
                      <div
                        className="w-full h-full transition-colors duration-200"
                        style={{
                          backgroundColor: selectedColor,
                          maskImage: `url(${src})`,
                          WebkitMaskImage: `url(${src})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center'
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">{t('onboarding.avatarColor')}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  '#EF4444', // Red
                  '#F97316', // Orange
                  '#EAB308', // Yellow
                  '#22C55E', // Green
                  '#3B82F6', // Blue
                  '#06B6D4', // Cyan
                  '#A855F7', // Purple
                  '#64748B', // Grey
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border transition-all ${selectedColor === color ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-transparent hover:scale-105'
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">
              {isInitialPrompt ? t('onboarding.continue') : t('actions.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <NotificationSubscriptionDialog
        projectId={projectId!}
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
      />

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                {isArchived && (
                  <Badge variant="secondary" className="gap-1 text-amber-600 bg-amber-100 border-amber-200">
                    <Archive className="h-3 w-3" />
                    {t('header.archived')}
                  </Badge>
                )}
              </div>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t('header.publicReview')}</span>
                <span>•</span>
                <span>{t('header.fileCount', { count: projectFiles.length })}</span>
              </div>

              {/* Archive Links Section */}
              {(!isArchived && ((project.archiveLinks && project.archiveLinks.length > 0) || project.archiveUrl)) && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {[...(project.archiveLinks || []), ...(project.archiveUrl && (!project.archiveLinks || !project.archiveLinks.some(l => l.url === project.archiveUrl)) ? [{ url: project.archiveUrl, title: project.archiveTitle }] : [])]
                    .filter(link => link.url)
                    .map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 p-2 rounded-lg border bg-background/50 hover:bg-muted transition-colors group max-w-[250px]"
                      >
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`}
                          alt="Drive Icon"
                          className="w-5 h-5 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <ExternalLink className="w-4 h-4 hidden flex-shrink-0" />
                        <div className="flex flex-col text-left min-w-0">
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {link.title || 'Link lưu trữ dự án'}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {new URL(link.url).hostname}
                          </span>
                        </div>
                      </a>
                    ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* DESKTOP ACTIONS */}
              <div className="hidden sm:flex items-center gap-2">

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotificationDialogOpen(true)}
                  className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                  title={t('header.getNotifications')}
                >
                  <Mail className="w-4 h-4" />
                  <span>{t('header.getNotifications')}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetTourStatus()
                    toast.success(t('header.tourReset'))
                  }}
                  className="gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('header.guide')}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full overflow-hidden border border-border hover:border-primary transition-colors"
                  onClick={() => {
                    setIsInitialPrompt(false)
                    setShowNamePrompt(true)
                  }}
                  title={t('onboarding.settings')}
                >
                  <div className="w-full h-full flex items-center justify-center p-1.5 bg-muted">
                    <div
                      className="w-full h-full transition-colors duration-200"
                      style={{
                        backgroundColor: selectedColor,
                        maskImage: `url(${selectedAvatar})`,
                        WebkitMaskImage: `url(${selectedAvatar})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center'
                      }}
                    />
                  </div>
                </Button>
                <LanguageToggle />
                <ThemeToggle />
              </div>

              {/* MOBILE ACTIONS */}
              <div className="flex sm:hidden items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">

                    <DropdownMenuItem
                      onClick={() => setNotificationDialogOpen(true)}
                      className="gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{t('header.getNotifications')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        resetTourStatus()
                        toast.success(t('header.tourReset'))
                      }}
                      className="gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{t('header.guide')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => {
                        setIsInitialPrompt(false)
                        setShowNamePrompt(true)
                      }}
                      className="gap-2"
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-border">
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: selectedColor,
                            maskImage: `url(${selectedAvatar})`,
                            WebkitMaskImage: `url(${selectedAvatar})`,
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center'
                          }}
                        />
                      </div>
                      <span>{t('onboarding.settings')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={toggleTheme}
                      className="gap-2"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4" />
                          <span>{t('header.themeLight')}</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          <span>{t('header.themeDark')}</span>
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                       <Globe className="w-3 h-3" />
                       {t('header.language')}
                    </div>
                    <DropdownMenuItem 
                      onClick={() => i18n.changeLanguage('vi')}
                      className={i18n.language.startsWith('vi') ? 'bg-accent font-medium' : ''}
                    >
                      Tiếng Việt
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => i18n.changeLanguage('en')}
                      className={i18n.language.startsWith('en') ? 'bg-accent font-medium' : ''}
                    >
                      English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Notice Banner */}
      {isArchived && project && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Archive className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">{t('access.archivedDesc')}</p>
                  <p className="text-sm text-amber-700">{t('access.archivedLock')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[...(project.archiveLinks || []), ...(project.archiveUrl && (!project.archiveLinks || !project.archiveLinks.some(l => l.url === project.archiveUrl)) ? [{ url: project.archiveUrl, title: project.archiveTitle }] : [])]
                  .filter(link => link.url)
                  .map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link.title || t('common:actions.view')}
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-8">
        {loadingFiles || isVerifyingEmpty || projectFiles.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between bg-card p-3 rounded-lg border w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="gap-2 text-xs font-bold"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('common:filters.title')}</span>
                {(searchTerm || selectedColors.length > 0 || selectedTypes.length > 0) && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4 bg-primary/20 text-primary border-transparent">
                    {(searchTerm ? 1 : 0) + selectedColors.length + selectedTypes.length}
                  </Badge>
                )}
              </Button>
              <div className="text-xs text-muted-foreground font-medium">
                {projectFiles.length} {t('common:status.noDocumentsDesc').includes('file') ? 'files' : 'tài liệu'}
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

            {/* Files List Content */}
            <main className="flex-1 min-w-0 w-full bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className={cn(
                viewMode !== 'kanban' && "p-6"
              )}>
                <FilesList
                  projectId={projectId!}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  searchTerm={searchTerm}
                  selectedColors={selectedColors}
                  viewMode={viewMode}
                  colorLabels={project?.colorLabels}
                  columnOrder={project?.kanbanColumnOrder}
                  thumbnailSize={thumbnailSize}
                  selectedTypes={selectedTypes}
                />
              </div>
            </main>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
            <div className="text-lg font-medium mb-2">{t('common:status.noDocuments')}</div>
            <div className="text-sm text-muted-foreground">{t('common:status.noDocumentsDesc')}</div>
          </div>
        )}
      </div>

      <DownloadProgressDialog 
        open={isDownloading} 
        progress={downloadProgress} 
        message={downloadMessage} 
        fileName={currentDownloadFile} 
      />

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Review System © {new Date().getFullYear()}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Developed by <a href="https://manhhuynh.work" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Manh Huynh</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
