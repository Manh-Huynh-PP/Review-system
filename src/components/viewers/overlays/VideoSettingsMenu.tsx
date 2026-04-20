import { useState, useRef, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContentNoPortal, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Grid3X3, Upload, X } from 'lucide-react'
import type { CompositionGuide } from './CompositionOverlay'

// Safe zone definitions
export interface SafeZoneOption {
    id: string
    name: string
    url: string
    aspectRatio: 'horizontal' | 'vertical' // 16:9 or 9:16
}

// Predefined safe zones from public assets
const PREDEFINED_SAFE_ZONES: SafeZoneOption[] = [
    { id: '16x9', name: '16:9 Standard', url: '/assets/Video-safezone/16x9.png', aspectRatio: 'horizontal' },
    { id: 'youtube', name: 'YouTube', url: '/assets/Video-safezone/Youtube.png', aspectRatio: 'vertical' },
    { id: 'tiktok', name: 'TikTok', url: '/assets/Video-safezone/TikTok.png', aspectRatio: 'vertical' },
    { id: 'reels', name: 'Reels', url: '/assets/Video-safezone/Reels.png', aspectRatio: 'vertical' },
]

interface VideoSettingsMenuProps {
    /** Current video aspect ratio (width/height) */
    videoRatio: number
    /** Currently active safe zone URL */
    activeSafeZone: string | null
    /** Callback when safe zone changes */
    onSafeZoneChange: (url: string | null) => void
    /** Currently active composition guides */
    activeGuides: CompositionGuide[]
    /** Callback when guides change */
    onGuidesChange: (guides: CompositionGuide[]) => void
    /** Opacity (0-1) for both safe zone and guides */
    opacity: number
    /** Callback when opacity changes */
    onOpacityChange: (value: number) => void
    /** Color for composition guides */
    guideColor: string
    /** Callback when guide color changes */
    onGuideColorChange: (color: string) => void
}

const COMPOSITION_GUIDE_OPTIONS: { id: CompositionGuide; labelKey: string; groupKey: string }[] = [
    { id: 'center', labelKey: 'fileView:video.settings.labels.center', groupKey: 'fileView:video.settings.groups.center' },
    { id: 'thirds', labelKey: 'fileView:video.settings.labels.thirds', groupKey: 'fileView:video.settings.groups.center' },
    { id: 'diagonal', labelKey: 'fileView:video.settings.labels.diagonal', groupKey: 'fileView:video.settings.groups.center' },
    { id: 'goldenRatio', labelKey: 'fileView:video.settings.labels.ratio', groupKey: 'fileView:video.settings.groups.golden' },
    { id: 'goldenTriangleA', labelKey: 'fileView:video.settings.labels.triangleA', groupKey: 'fileView:video.settings.groups.golden' },
    { id: 'goldenTriangleB', labelKey: 'fileView:video.settings.labels.triangleB', groupKey: 'fileView:video.settings.groups.golden' },
    { id: 'harmonyA', labelKey: 'fileView:video.settings.labels.triangleA', groupKey: 'fileView:video.settings.groups.harmony' },
    { id: 'harmonyB', labelKey: 'fileView:video.settings.labels.triangleB', groupKey: 'fileView:video.settings.groups.harmony' },
]
const VideoSettingsMenuComponent = ({
    videoRatio,
    activeSafeZone,
    onSafeZoneChange,
    activeGuides,
    onGuidesChange,
    opacity,
    onOpacityChange,
    guideColor,
    onGuideColorChange,
}: VideoSettingsMenuProps) => {
    const { t } = useTranslation()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [customSafeZones, setCustomSafeZones] = useState<SafeZoneOption[]>([])

    // Determine which safe zones to show based on video aspect ratio
    const isHorizontal = videoRatio >= 1
    const availableSafeZones = PREDEFINED_SAFE_ZONES.filter(sz =>
        isHorizontal ? sz.aspectRatio === 'horizontal' : sz.aspectRatio === 'vertical'
    )
    const allSafeZones = [...availableSafeZones, ...customSafeZones]

    // Handle custom file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Only accept PNG
        if (!file.type.includes('png')) {
            alert(t('fileView:video.errors.pngOnly'))
            return
        }

        const url = URL.createObjectURL(file)
        const newSafeZone: SafeZoneOption = {
            id: `custom-${Date.now()}`,
            name: file.name,
            url,
            aspectRatio: isHorizontal ? 'horizontal' : 'vertical',
        }

        setCustomSafeZones(prev => [...prev, newSafeZone])
        onSafeZoneChange(url)

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            customSafeZones.forEach(sz => {
                if (sz.url.startsWith('blob:')) {
                    URL.revokeObjectURL(sz.url)
                }
            })
        }
    }, [customSafeZones])

    const toggleGuide = (guide: CompositionGuide) => {
        if (activeGuides.includes(guide)) {
            onGuidesChange(activeGuides.filter(g => g !== guide))
        } else {
            onGuidesChange([...activeGuides, guide])
        }
    }

    // Group guides by category
    const guidesByGroup = COMPOSITION_GUIDE_OPTIONS.reduce((acc, opt) => {
        const group = opt.groupKey || 'fileView:video.settings.groups.other'
        if (!acc[group]) acc[group] = []
        acc[group].push(opt)
        return acc
    }, {} as Record<string, typeof COMPOSITION_GUIDE_OPTIONS>)

    return (
        <Popover modal={false}>
            <PopoverTrigger asChild>
                <Button
                    id="video-controls-settings"
                    variant="ghost"
                    size="icon"
                    className="control-btn"
                    title={t('fileView:video.settings.title')}
                >
                    <Grid3X3 className="w-5 h-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContentNoPortal className="w-80 p-3 z-[9999]" side="top" align="end" sideOffset={8}>
                <div className="space-y-4">
                    {/* Appearance Controls */}
                    <div>
                        <h4 className="font-medium text-sm mb-3">{t('fileView:video.settings.appearance')}</h4>
                        <div className="space-y-3">
                            {/* Color Picker Row */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-12">{t('fileView:video.settings.color')}</span>
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="h-7 w-7 rounded border border-border overflow-hidden relative flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all">
                                        <input
                                            type="color"
                                            value={guideColor}
                                            onChange={(e) => onGuideColorChange(e.target.value)}
                                            className="absolute inset-0 w-full h-full cursor-pointer border-none"
                                            style={{ margin: 0, padding: 0 }}
                                            title={t('fileView:video.settings.color')}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">{guideColor.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Opacity Slider Row */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-12">{t('fileView:video.settings.opacity')}</span>
                                <div className="flex-1 flex items-center gap-3">
                                    <Slider
                                        value={[opacity]}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        onValueChange={(vals) => onOpacityChange(vals[0])}
                                        className="flex-1"
                                    />
                                    <span className="text-xs font-medium text-muted-foreground w-10 text-right">{Math.round(opacity * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Safe Zone Section */}
                    <div>
                        <h4 className="font-medium text-sm mb-2">{t('fileView:video.settings.safeZone')}</h4>
                        {allSafeZones.length === 0 && !isHorizontal && (
                            <p className="text-xs text-muted-foreground mb-2">
                                {t('fileView:video.settings.noSafeZones')}
                            </p>
                        )}
                        <div className="space-y-1">
                            {/* None option */}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="safezone-none"
                                    checked={activeSafeZone === null}
                                    onCheckedChange={() => onSafeZoneChange(null)}
                                />
                                <Label htmlFor="safezone-none" className="text-sm cursor-pointer">
                                    {t('fileView:video.settings.none')}
                                </Label>
                            </div>

                            {allSafeZones.map(sz => (
                                <div key={sz.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`safezone-${sz.id}`}
                                        checked={activeSafeZone === sz.url}
                                        onCheckedChange={() => onSafeZoneChange(sz.url)}
                                    />
                                    <Label htmlFor={`safezone-${sz.id}`} className="text-sm cursor-pointer flex-1">
                                        {sz.name}
                                    </Label>
                                    {sz.id.startsWith('custom-') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => {
                                                URL.revokeObjectURL(sz.url)
                                                setCustomSafeZones(prev => prev.filter(s => s.id !== sz.id))
                                                if (activeSafeZone === sz.url) {
                                                    onSafeZoneChange(null)
                                                }
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            {/* Upload custom */}
                            <div className="pt-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".png"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-3 h-3 mr-1" />
                                    {t('fileView:video.settings.upload')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border" />

                    {/* Composition Guides Section */}
                    <div>
                        <h4 className="font-medium text-sm mb-2">{t('fileView:video.settings.guides')}</h4>
                        <div className="space-y-2">
                            {Object.entries(guidesByGroup).map(([groupKey, guides]) => (
                                <div key={groupKey} className="flex items-start gap-2">
                                    <span className="text-xs text-muted-foreground w-14 pt-0.5">{t(groupKey)}</span>
                                    <div className="flex flex-wrap gap-1 flex-1">
                                        {guides.map(guide => (
                                            <label
                                                key={guide.id}
                                                className={`
                                                    inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer
                                                    border transition-colors
                                                    ${activeGuides.includes(guide.id)
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-background border-border hover:border-primary/50'}
                                                `}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={activeGuides.includes(guide.id)}
                                                    onChange={() => toggleGuide(guide.id)}
                                                />
                                                {t(guide.labelKey)}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContentNoPortal>
        </Popover>
    )
}

export const VideoSettingsMenu = memo(VideoSettingsMenuComponent)
