import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, FileType, Calendar, Download, Grid3x3, List, Columns, FileImage, Video, Box, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import { PRESET_COLORS } from '@/constants/colors'

export type SortOption = 'name' | 'date' | 'type' | 'size'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list' | 'kanban'

interface FileFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  sortDirection: SortDirection
  onSortDirectionToggle: () => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  selectedColors: string[]
  onColorsChange: (colors: string[]) => void
  availableColors: string[] // Colors actually used in the files
  colorLabels?: Record<string, string>
  onClose?: () => void
  thumbnailSize?: 'sm' | 'md' | 'lg'
  onThumbnailSizeChange?: (size: 'sm' | 'md' | 'lg') => void
  availableTypes?: string[]
  selectedTypes?: string[]
  onTypesChange?: (types: string[]) => void
}

export function FileFilters({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionToggle,
  viewMode,
  onViewModeChange,
  selectedColors,
  onColorsChange,
  availableColors,
  colorLabels = {},
  onClose,
  thumbnailSize = 'md',
  onThumbnailSizeChange,
  availableTypes = [],
  selectedTypes = [],
  onTypesChange
}: FileFiltersProps) {
  const { t } = useTranslation(['common'])

  const getFileTypeIcon = (type: string, className = "w-3.5 h-3.5") => {
    if (type === 'image') return <FileImage className={cn(className, "text-green-500")} />
    if (type === 'video') return <Video className={cn(className, "text-blue-500")} />
    if (type === 'model') return <Box className={cn(className, "text-purple-500")} />
    if (type === 'sequence') return <FileImage className={cn(className, "text-emerald-500")} />
    if (type === 'pdf') return <FileText className={cn(className, "text-red-500")} />
    return <FileText className={cn(className, "text-gray-500")} />
  }

  const getFileTypeLabel = (type: string) => {
    if (type === 'image') return t('filters.typeImage')
    if (type === 'video') return t('filters.typeVideo')
    if (type === 'model') return t('filters.typeModel')
    if (type === 'sequence') return t('filters.typeSequence')
    if (type === 'pdf') return t('filters.typePdf')
    return t('filters.typeFile')
  }

  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color))
    } else {
      onColorsChange([...selectedColors, color])
    }
  }

  // Only show colors that are actually being used by at least one file
  const filterColors = PRESET_COLORS.filter(pc => 
    pc.value === undefined || (pc.value && availableColors.includes(pc.value))
  )

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Title & Close button for Mobile */}
      {onClose && (
        <div className="flex items-center justify-between lg:hidden pb-4 border-b border-border/60">
          <h3 className="font-bold text-lg">{t('filters.title')}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* 1. Search */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{t('filters.search')}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder={t('actions.searchFiles')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 bg-background/50 border-primary/10 focus-visible:ring-primary/20 transition-all text-sm"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 2. View Mode */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{t('filters.viewMode')}</label>
        <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-primary/5 w-full">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "flex-1 h-8 rounded-md transition-all gap-1.5 font-medium px-2",
              viewMode === 'grid' ? "shadow-sm bg-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            <span className="text-[11px]">{t('filters.viewGrid')}</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={cn(
              "flex-1 h-8 rounded-md transition-all gap-1.5 font-medium px-2",
              viewMode === 'list' ? "shadow-sm bg-background" : "text-muted-foreground hover:text-foreground"
            )}
            title={t('filters.viewList')}
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px]">{t('filters.viewList')}</span>
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('kanban')}
            className={cn(
              "flex-1 h-8 rounded-md transition-all gap-1.5 font-medium px-2",
              viewMode === 'kanban' ? "shadow-sm bg-background" : "text-muted-foreground hover:text-foreground"
            )}
            title={t('filters.viewKanban')}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="text-[11px]">{t('filters.viewKanban')}</span>
          </Button>
        </div>
      </div>

      {/* 2.5 Thumbnail Size (Only shown in grid view) */}
      {viewMode === 'grid' && onThumbnailSizeChange && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{t('filters.thumbnailSize')}</label>
          <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-primary/5 w-full">
            <Button
              variant={thumbnailSize === 'sm' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onThumbnailSizeChange('sm')}
              className={cn(
                "flex-1 h-8 rounded-md transition-all font-medium px-2",
                thumbnailSize === 'sm' ? "shadow-sm bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[11px]">{t('filters.sizeSmall')}</span>
            </Button>
            <Button
              variant={thumbnailSize === 'md' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onThumbnailSizeChange('md')}
              className={cn(
                "flex-1 h-8 rounded-md transition-all font-medium px-2",
                thumbnailSize === 'md' ? "shadow-sm bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[11px]">{t('filters.sizeMedium')}</span>
            </Button>
            <Button
              variant={thumbnailSize === 'lg' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onThumbnailSizeChange('lg')}
              className={cn(
                "flex-1 h-8 rounded-md transition-all font-medium px-2",
                thumbnailSize === 'lg' ? "shadow-sm bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[11px]">{t('filters.sizeLarge')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2.7 File Types Filter */}
      {availableTypes.length > 1 && onTypesChange && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{t('filters.fileTypes')}</label>
            {selectedTypes.length > 0 && (
              <button 
                onClick={() => onTypesChange([])}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-0.5"
                title="Bỏ lọc loại file"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 border border-primary/5 rounded-lg">
            {availableTypes.map((type) => {
              const isActive = selectedTypes.includes(type);
              return (
                <Button
                  key={type}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (isActive) {
                      onTypesChange(selectedTypes.filter(t => t !== type))
                    } else {
                      onTypesChange([...selectedTypes, type])
                    }
                  }}
                  className={cn(
                    "h-7 px-2.5 text-[10px] font-bold uppercase rounded-md transition-all gap-1.5 flex-1 min-w-[70px]",
                    isActive 
                      ? "shadow-sm bg-background text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {getFileTypeIcon(type, "w-3.5 h-3.5")}
                  <span>{getFileTypeLabel(type)}</span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Color Filters */}
      {availableColors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{t('filters.tagColors')}</label>
            {selectedColors.length > 0 && (
              <button 
                onClick={() => onColorsChange([])}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-0.5"
                title="Bỏ lọc màu"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/20 border border-primary/5 rounded-lg">
            {filterColors.map((color) => {
              const colorValue = color.value || 'default'
              const isActive = selectedColors.includes(colorValue) || (colorValue === 'default' && selectedColors.length === 0);
              const isDefault = colorValue === 'default';
              
              return (
                <button
                  key={color.name}
                  onClick={() => isDefault ? onColorsChange([]) : toggleColor(colorValue)}
                  className={cn(
                    "relative w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-95 border-2",
                    isActive ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.4)] opacity-100 scale-105" : "border-transparent opacity-50",
                  )}
                  title={colorLabels[colorValue] || color.label}
                >
                  <div 
                    className={cn(
                      "w-full h-full rounded-full",
                      isDefault && "border-2 border-dashed border-muted-foreground/40"
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Sort Options */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{t('filters.sortBy')}</label>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 justify-between h-10 border-primary/10 bg-background/50 hover:bg-background/80 text-left px-3 text-xs"
              >
                <span>
                  {sortBy === 'name' ? t('filters.fileName') : sortBy === 'date' ? t('filters.uploadDate') : sortBy === 'type' ? t('filters.fileType') : t('filters.fileSize')}
                </span>
                <ArrowUpDown className="w-3.5 h-3.5 opacity-50 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background/95 backdrop-blur-md">
              <DropdownMenuItem onClick={() => onSortChange('name')} className="gap-2 text-xs">
                <FileType className="w-4 h-4" /> {t('filters.fileName')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('date')} className="gap-2 text-xs">
                <Calendar className="w-4 h-4" /> {t('filters.uploadDate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('type')} className="gap-2 text-xs">
                <FileType className="w-4 h-4" /> {t('filters.fileType')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('size')} className="gap-2 text-xs">
                <Download className="w-4 h-4" /> {t('filters.fileSize')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={onSortDirectionToggle}
            className="h-10 w-10 border-primary/10 bg-background/50 hover:bg-background/80"
            title={sortDirection === 'asc' ? t('filters.sortAscending') : t('filters.sortDescending')}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="w-4 h-4 text-primary/70 animate-in fade-in zoom-in duration-200" />
            ) : (
              <ArrowDown className="w-4 h-4 text-primary/70 animate-in fade-in zoom-in duration-200" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
