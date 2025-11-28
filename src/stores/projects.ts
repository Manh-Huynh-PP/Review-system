import { create } from 'zustand'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Project } from '../types'
import toast from 'react-hot-toast'

interface ProjectState {
  projects: Project[]
  selectedProject: Project | null
  loading: boolean
  isSubscribed: boolean
  currentAdminEmail: string | null
  unsubscribe: Unsubscribe | null
  
  subscribeToProjects: (adminEmail: string) => void
  createProject: (name: string, adminEmail: string) => Promise<string>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  selectProject: (project: Project | null) => void
  cleanup: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  isSubscribed: false,
  currentAdminEmail: null,
  unsubscribe: null,

  subscribeToProjects: (adminEmail: string) => {
    const { isSubscribed, currentAdminEmail } = get()
    
    // Avoid duplicate subscriptions for same admin
    if (isSubscribed && currentAdminEmail === adminEmail) {
      console.log('🔄 Projects already subscribed for', adminEmail)
      return
    }
    
    // Cleanup existing subscription if switching users
    if (isSubscribed && currentAdminEmail !== adminEmail) {
      console.log('🧹 Cleaning up subscription for', currentAdminEmail, 'switching to', adminEmail)
      get().cleanup()
    }
    
    console.log('📡 Starting projects subscription for', adminEmail)
    set({ isSubscribed: true, currentAdminEmail: adminEmail })
    
    const baseCol = collection(db, 'projects')

    // Preferred query: filter by adminEmail and order by createdAt desc
    const q = query(
      baseCol,
      where('adminEmail', '==', adminEmail),
      orderBy('createdAt', 'desc')
    )

    const off = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[]
      console.log('📊 Projects loaded:', projects.length)
      set({ projects })
    }, (error: any) => {
      // Graceful fallback while Firestore builds the index
      const msg = String(error?.message || '')
      if (msg.toLowerCase().includes('requires an index') || error?.code === 'failed-precondition') {
        toast('Đang xây dựng Firestore index. Tạm thời hiển thị không sắp xếp.', { icon: '⏳' })
        const fallback = query(baseCol, where('adminEmail', '==', adminEmail))
        const off2 = onSnapshot(fallback, (snapshot2) => {
          const projects = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]
          console.log('📊 Projects loaded (fallback):', projects.length)
          set({ projects })
        }, (err2) => {
          toast.error('Lỗi tải dự án (fallback): ' + (err2?.message || ''))
          console.error('[projects] fallback error', err2)
          set({ isSubscribed: false })
        })
        set({ unsubscribe: off2 })
      } else {
        toast.error('Lỗi tải dự án: ' + (error?.message || ''))
        console.error('[projects] onSnapshot error', error)
        set({ isSubscribed: false })
      }
    })

    set({ unsubscribe: off })
  },

  createProject: async (name: string, adminEmail: string) => {
    set({ loading: true })
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name,
        adminEmail,
        status: 'active',
        createdAt: Timestamp.now()
      })
      toast.success('Tạo dự án thành công')
      return docRef.id
    } catch (error: any) {
      toast.error('Lỗi tạo dự án: ' + error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    set({ loading: true })
    try {
      await updateDoc(doc(db, 'projects', id), data as any)
      toast.success('Cập nhật thành công')
    } catch (error: any) {
      toast.error('Lỗi cập nhật: ' + error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Optional helper: archive/unarchive
  

  selectProject: (project: Project | null) => {
    set({ selectedProject: project })
  },

  cleanup: () => {
    const { unsubscribe } = get()
    console.log('🧹 Cleaning up projects subscription')
    if (unsubscribe) {
      unsubscribe()
      set({ 
        unsubscribe: null, 
        projects: [], 
        selectedProject: null,
        isSubscribed: false,
        currentAdminEmail: null
      })
    }
  },
}))
