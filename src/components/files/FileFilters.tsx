import { Search, X, ArrowUpDown, FileType, Calendar, Download, Grid3x3, List, Columns } from 'lucide-react'
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
  children?: React.ReactNode
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
  children
}: FileFiltersProps) {

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
    <div className="flex flex-col space-y-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm file..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 bg-card/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20 transition-all"
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Color Filter Dots */}
          {availableColors.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex items-center gap-1.5">
                {filterColors.map((color) => {
                  const colorValue = color.value || 'default'
                  const isActive = selectedColors.includes(colorValue) || (colorValue === 'default' && selectedColors.length === 0);
                  const isDefault = colorValue === 'default';
                  
                  return (
                    <button
                      key={color.name}
                      onClick={() => isDefault ? onColorsChange([]) : toggleColor(colorValue)}
                      className={cn(
                        "relative w-5 h-5 rounded-full transition-all hover:scale-110 active:scale-95 border-2",
                        isActive ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.4)] opacity-100" : "border-transparent opacity-50",
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

          <div className="h-6 w-px bg-border/50 hidden md:block" />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-primary/5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === 'grid' ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === 'list' ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title="Danh sách"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === 'kanban' ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title="Kanban"
            >
              <Columns className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border/50 hidden md:block" />

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 border-primary/10 bg-card/50 backdrop-blur-sm hover:bg-card/80"
                  title={`Sắp xếp: ${sortBy === 'name' ? 'Tên' : sortBy === 'date' ? 'Ngày' : sortBy === 'type' ? 'Loại' : 'Dung lượng'} (${sortDirection === 'asc' ? 'Tăng' : 'Giảm'})`}
                >
                  <ArrowUpDown className="w-4 h-4 text-primary/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-md">
                <DropdownMenuItem onClick={() => onSortChange('name')} className="gap-2">
                  <FileType className="w-4 h-4" /> Tên file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('date')} className="gap-2">
                  <Calendar className="w-4 h-4" /> Ngày tải lên
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('type')} className="gap-2">
                  <FileType className="w-4 h-4" /> Loại file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('size')} className="gap-2">
                  <Download className="w-4 h-4" /> Kích thước
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem onClick={onSortDirectionToggle} className="gap-2 font-medium text-primary">
                  <ArrowUpDown className="w-4 h-4" /> 
                  Đảo ngược thứ tự
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {children && (
            <>
              <div className="h-6 w-px bg-border/50 hidden md:block" />
              <div className="flex items-center gap-2">
                {children}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
