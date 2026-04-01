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
        {effectiveLinks.map((link, index) => (
          <DropdownMenuItem 
            key={index} 
            className="cursor-pointer py-3"
            onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
          >
            <div className="flex flex-col gap-0.5 overflow-hidden w-full">
              <span className="font-medium truncate text-sm">
                {link.title || `Link ${index + 1}`}
              </span>
              <span className="text-[10px] text-muted-foreground truncate font-mono">
                {link.url}
              </span>
            </div>
            <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0 opacity-50" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
