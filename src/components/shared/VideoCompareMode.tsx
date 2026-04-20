import { Volume2, VolumeX, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Props {
  videoComparison: any
  currentVersion: number
  uniqueVersions: any[]
  effectiveUrl?: string
  handleTimeUpdate: (time: number) => void
}

export function VideoCompareMode({
  videoComparison,
  currentVersion,
  uniqueVersions,
  effectiveUrl,
  handleTimeUpdate
}: Props) {
  if (!videoComparison.isComparing || !videoComparison.secondaryUrl) {
    return null
  }

  return (
    <div className="space-y-2 w-full h-full flex flex-col">
      {/* Comparison Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0 bg-black p-2">
        {/* PRIMARY VIDEO */}
        <div className="relative flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 py-1 bg-black/70">
            <span className="text-xs text-white font-medium">v{currentVersion} (Chính)</span>
            <Button
              size="sm"
              variant={videoComparison.activeAudio === 'primary' ? 'secondary' : 'ghost'}
              className="h-6 px-2 text-xs"
              onClick={videoComparison.toggleAudio}
              title={videoComparison.activeAudio === 'primary' ? 'Đang phát âm thanh' : 'Bật âm thanh'}
            >
              {videoComparison.activeAudio === 'primary' ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </Button>
          </div>
          <video
            ref={videoComparison.primaryVideoRef}
            src={effectiveUrl}
            controls
            className="w-full h-auto max-h-[45vh] object-contain flex-1"
            onPlay={() => videoComparison.handlePrimaryEvent('play')}
            onPause={() => videoComparison.handlePrimaryEvent('pause')}
            onSeeked={(e) => videoComparison.handlePrimaryEvent('seeked', e.currentTarget.currentTime)}
            onTimeUpdate={(e) => {
              handleTimeUpdate(e.currentTarget.currentTime)
              videoComparison.handlePrimaryEvent('timeupdate', e.currentTarget.currentTime)
            }}
            muted={videoComparison.activeAudio !== 'primary'}
          />
        </div>

        {/* SECONDARY VIDEO */}
        <div className="relative flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 py-1 bg-black/70">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                  v{videoComparison.secondaryVersion}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {uniqueVersions
                  .filter((v: any) => v.version !== currentVersion)
                  .map((v: any) => (
                    <DropdownMenuItem
                      key={v.version}
                      onClick={() => videoComparison.setSecondaryVersion(v.version)}
                      className={v.version === videoComparison.secondaryVersion ? 'bg-accent' : ''}
                    >
                      Version {v.version}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant={videoComparison.activeAudio === 'secondary' ? 'secondary' : 'ghost'}
              className="h-6 px-2 text-xs"
              onClick={videoComparison.toggleAudio}
              title={videoComparison.activeAudio === 'secondary' ? 'Đang phát âm thanh' : 'Bật âm thanh'}
            >
              {videoComparison.activeAudio === 'secondary' ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </Button>
          </div>
          <video
            ref={videoComparison.secondaryVideoRef}
            src={videoComparison.secondaryUrl}
            controls
            className="w-full h-auto max-h-[45vh] object-contain flex-1"
            onPlay={() => videoComparison.handleSecondaryEvent('play')}
            onPause={() => videoComparison.handleSecondaryEvent('pause')}
            onSeeked={(e) => videoComparison.handleSecondaryEvent('seeked', e.currentTarget.currentTime)}
            muted={videoComparison.activeAudio !== 'secondary'}
          />
        </div>
      </div>
    </div>
  )
}
