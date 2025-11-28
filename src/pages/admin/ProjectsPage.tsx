import { useEffect } from 'react'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { ProjectCreateDialog } from '@/components/projects/ProjectCreateDialog'
import { ProjectCard } from '@/components/projects/ProjectCard'

export default function ProjectsPage() {
  const { projects, subscribeToProjects, isSubscribed } = useProjectStore()
  const user = useAuthStore(s => s.user)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dự án</h1>
        <ProjectCreateDialog />
      </div>
      <div className="grid gap-4">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} />
        ))}
        {projects.length === 0 && (
          <p className="text-muted-foreground">Chưa có dự án nào. Hãy tạo dự án mới.</p>
        )}
      </div>
    </div>
  )
}
