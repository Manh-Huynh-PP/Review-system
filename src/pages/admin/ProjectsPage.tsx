import { useEffect, useState, useMemo } from 'react'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { ProjectCreateDialog } from '@/components/projects/ProjectCreateDialog'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Search, ArrowUpDown, Calendar, Clock, Tag } from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'name' | 'deadline' | 'updated'

export default function ProjectsPage() {
  const { projects, subscribeToProjects, isSubscribed } = useProjectStore()
  const user = useAuthStore(s => s.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all')

  console.log('📁 ProjectsPage render:', {
    user: user?.email,
    projectsCount: projects.length,
    isSubscribed
  })

  useEffect(() => {
    // Ensure subscription exists (store will handle duplicates)
    if (user?.email) {
      console.log('🔄 ProjectsPage: Ensuring subscription for', user.email)
      subscribeToProjects(user.email)
    }
  }, [user?.email, subscribeToProjects])

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => {
        const matchName = p.name.toLowerCase().includes(query)
        const matchDesc = p.description?.toLowerCase().includes(query)
        const matchClient = p.clientName?.toLowerCase().includes(query) || 
                          p.clientEmail?.toLowerCase().includes(query)
        const matchTags = p.tags?.some(tag => tag.toLowerCase().includes(query))
        return matchName || matchDesc || matchClient || matchTags
      })
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.toMillis() - a.createdAt.toMillis()
        case 'oldest':
          return a.createdAt.toMillis() - b.createdAt.toMillis()
        case 'name':
          return a.name.localeCompare(b.name, 'vi')
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return a.deadline.toMillis() - b.deadline.toMillis()
        case 'updated':
          const aTime = a.updatedAt?.toMillis() || a.createdAt.toMillis()
          const bTime = b.updatedAt?.toMillis() || b.createdAt.toMillis()
          return bTime - aTime
        default:
          return 0
      }
    })

    return sorted
  }, [projects, searchQuery, sortBy, filterStatus])

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'Mới nhất'
      case 'oldest': return 'Cũ nhất'
      case 'name': return 'Tên A-Z'
      case 'deadline': return 'Deadline'
      case 'updated': return 'Cập nhật gần đây'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dự án</h1>
        <ProjectCreateDialog />
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, mô tả, khách hàng, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                {filterStatus === 'all' ? 'Tất cả' : 
                 filterStatus === 'active' ? 'Đang hoạt động' : 'Đã lưu trữ'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                Đang hoạt động
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('archived')}>
                Đã lưu trữ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {getSortLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                <Clock className="h-4 w-4 mr-2" />
                Mới nhất
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                <Clock className="h-4 w-4 mr-2" />
                Cũ nhất
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Tên A-Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('deadline')}>
                <Calendar className="h-4 w-4 mr-2" />
                Deadline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('updated')}>
                Cập nhật gần đây
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {filteredAndSortedProjects.map(p => (
          <ProjectCard key={p.id} project={p} />
        ))}
        {filteredAndSortedProjects.length === 0 && projects.length > 0 && (
          <p className="text-muted-foreground text-center py-8">
            Không tìm thấy dự án phù hợp
          </p>
        )}
        {projects.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            Chưa có dự án nào. Hãy tạo dự án mới.
          </p>
        )}
      </div>
    </div>
  )
}
