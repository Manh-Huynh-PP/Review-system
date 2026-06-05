import type { Project } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { HardDrive, ExternalLink, Link2 } from 'lucide-react'
import { getDomainFromUrl, getFaviconUrl, cn } from '@/lib/utils'

interface ArchiveLinksDropdownProps {
  project: Project
}

export function ArchiveLinksDropdown({ project }: ArchiveLinksDropdownProps) {
  const archiveLinks = project.archiveLinks || []
  
  // Also support legacy single archive link if present and no multiple links exist
  const effectiveLinks = archiveLinks.length > 0 
    ? archiveLinks 
    : (project.archiveUrl ? [{ url: project.archiveUrl, title: project.archiveTitle || 'Link lưu trữ' }] : [])

  if (effectiveLinks.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/50 dark:hover:bg-amber-950/30">
          <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <span className="hidden sm:inline">Link lưu trữ</span>
          {effectiveLinks.length > 1 && (
            <span className="flex items-center justify-center bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] h-4 px-1 rounded-full min-w-[16px]">
              {effectiveLinks.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Danh sách lưu trữ
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {effectiveLinks.map((link, index) => {
          const domain = getDomainFromUrl(link.url);
          const faviconUrl = getFaviconUrl(link.url);
          const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
          
          return (
            <DropdownMenuItem 
              key={index} 
              className="cursor-pointer py-3 flex items-center gap-3"
              onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
            >
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="w-5 h-5 flex-shrink-0 object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <ExternalLink className={cn("h-4 w-4 flex-shrink-0 opacity-50", faviconUrl ? "hidden" : "block")} />

              <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                <span className="font-medium truncate text-sm">
                  {link.title || `Link ${index + 1}`}
                </span>
                <span className="text-[10px] text-muted-foreground truncate font-mono">
                  {domain || link.url}
                </span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
