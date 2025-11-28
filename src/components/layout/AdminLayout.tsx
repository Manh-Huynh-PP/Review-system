import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { LogOut, FolderOpen, Home, ChevronDown, Plus } from 'lucide-react'
import { useEffect } from 'react'

export function AdminLayout() {
  const { user, signOut } = useAuthStore()
  const { projects, subscribeToProjects, isSubscribed } = useProjectStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { projectId } = useParams()
  
  const currentProject = projects.find(p => p.id === projectId)
  const isProjectDetail = location.pathname.includes('/projects/') && projectId
  const isProjectsList = location.pathname === '/app/projects'

  console.log('🧮 AdminLayout render:', {
    user: user?.email,
    projectsCount: projects.length,
    isSubscribed,
    currentPath: location.pathname,
    projectId,
    currentProject: currentProject?.name
  })

  // Subscribe to projects when user is available
  useEffect(() => {
    if (user?.email) {
      console.log('🔄 AdminLayout: Ensuring subscription for', user.email)
      subscribeToProjects(user.email)
    }
  }, [user?.email, subscribeToProjects])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/projects')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Review System
            </Button>
            
            {isProjectDetail && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {currentProject?.name || 'Chọn dự án'}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuItem onClick={() => navigate('/app/projects')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tất cả dự án
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {projects.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                        Đang tải dự án...
                      </div>
                    ) : (
                      projects.map(project => (
                        <DropdownMenuItem 
                          key={project.id}
                          onClick={() => navigate(`/app/projects/${project.id}`)}
                          className={project.id === projectId ? 'bg-accent' : ''}
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          <div className="flex-1">
                            <div className="font-medium truncate">{project.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {project.status}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/projects')}
              className={`h-8 px-2 ${isProjectsList ? 'bg-accent' : ''}`}
            >
              <Home className="w-3 h-3 mr-1" />
              Dự án
            </Button>
            
            {isProjectDetail && (
              <>
                <span className="text-muted-foreground">/</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 bg-accent"
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {currentProject?.name || 'Loading...'}
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
