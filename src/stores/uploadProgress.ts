import { create } from 'zustand'

export interface UploadTask {
  id: string
  projectId: string
  fileName: string
  fileType: 'single' | 'sequence'
  existingFileId?: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  totalFiles: number
  completedFiles: number
  error?: string
  startedAt: number
}

interface MinimizedDialogInfo {
  projectId: string
  existingFileId?: string
  existingFileType?: string
  defaultTab?: 'single' | 'sequence'
}

interface UploadProgressState {
  tasks: UploadTask[]
  minimizedDialogInfo: MinimizedDialogInfo | null
  isMinimized: boolean

  // Actions
  addTask: (task: UploadTask) => void
  updateTask: (id: string, partial: Partial<UploadTask>) => void
  removeTask: (id: string) => void
  minimize: (dialogInfo: MinimizedDialogInfo) => void
  restore: () => void
  clearCompleted: () => void
  reset: () => void
}

export const useUploadProgressStore = create<UploadProgressState>((set) => ({
  tasks: [],
  minimizedDialogInfo: null,
  isMinimized: false,

  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks.filter(t => t.id !== task.id), task]
    }))
  },

  updateTask: (id, partial) => {
    set((state) => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, ...partial } : t
      )
    }))
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }))
  },

  minimize: (dialogInfo) => {
    set({ isMinimized: true, minimizedDialogInfo: dialogInfo })
  },

  restore: () => {
    set({ isMinimized: false })
  },

  clearCompleted: () => {
    set((state) => ({
      tasks: state.tasks.filter(t => t.status === 'uploading')
    }))
  },

  reset: () => {
    set({
      tasks: [],
      minimizedDialogInfo: null,
      isMinimized: false
    })
  }
}))
