import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/projects'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@/types'
import { ProjectEditDialog } from './ProjectEditDialog'
import { Calendar, User, Mail, AlertCircle, MoreVertical, Archive, ArchiveRestore } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ProjectCard({ project }: { project: Project }) {
  const updateProject = useProjectStore(s => s.updateProject)
  const navigate = useNavigate()

  const created = project.createdAt?.toDate ? project.createdAt.toDate() : new Date()
  const deadline = project.deadline?.toDate ? project.deadline.toDate() : null
  const isOverdue = deadline && deadline < new Date()

  return (
    <div className="rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status === 'active' ? 'Đang hoạt động' : 'Đã lưu trữ'}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Quá hạn
              </Badge>
            )}
          </div>
          
          {project.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Tạo: {format(created, 'dd/MM/yyyy', { locale: vi })}</span>
            
            {project.clientName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {project.clientName}
              </span>
            )}
            
            {project.clientEmail && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {project.clientEmail}
              </span>
            )}
            
            {deadline && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                <Calendar className="h-3 w-3" />
                Deadline: {format(deadline, 'dd/MM/yyyy', { locale: vi })}
              </span>
            )}
          </div>

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="secondary" onClick={() => navigate(`/app/projects/${project.id}`)}>
            Mở
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ProjectEditDialog project={project} triggerAsMenuItem />
              <DropdownMenuSeparator />
              {project.status === 'active' ? (
                <DropdownMenuItem onClick={() => updateProject(project.id, { status: 'archived' })}>
                  <Archive className="h-4 w-4 mr-2" />
                  Lưu trữ
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => updateProject(project.id, { status: 'active' })}>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Khôi phục
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
