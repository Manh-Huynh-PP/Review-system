import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/stores/projects'
import { useFileStore } from '@/stores/files'
import { FileUploader } from '@/components/files/FileUploader'
import { FilesList } from '@/components/files/FilesList'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import type { Project } from '@/types'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const { projects } = useProjectStore()
  const { subscribeToFiles, cleanup: cleanupFiles } = useFileStore()
  const [project, setProject] = useState<Project | null>(
    projects.find(p => p.id === projectId) || null
  )

  useEffect(() => {
    if (projectId) {
      console.log('🎯 Loading files for project:', projectId)
      subscribeToFiles(projectId)
    }
    return () => cleanupFiles()
  }, [projectId, subscribeToFiles, cleanupFiles])

  // Subscribe to the specific project document so detail works independently
  useEffect(() => {
    if (!projectId) return
    const ref = doc(db, 'projects', projectId)
    const off = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setProject({ id: snap.id, ...(snap.data() as any) })
      } else {
        setProject(null)
      }
    })
    return () => off()
  }, [projectId])

  if (!project) {
    return <div className="text-muted-foreground">Đang tải dự án...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">Trạng thái: {project.status}</p>
      </div>

      <div className="rounded-lg border p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">📁 Tải file mới</h2>
          {projectId && <FileUploader projectId={projectId} />}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">📋 Files trong dự án</h2>
          {projectId && <FilesList projectId={projectId} />}
        </div>
      </div>
    </div>
  )
}
