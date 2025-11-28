import { create } from 'zustand'
import { 
  collection, 
  setDoc,
  updateDoc,
  deleteDoc,
  doc, 
  onSnapshot, 
  query,
  orderBy,
  Timestamp,
  getDoc,
  getDocs,
  where
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { createNotification } from '../lib/notifications'
import type { File as FileType, FileVersion } from '../types'
import { generateId } from '../lib/utils'
import toast from 'react-hot-toast'

interface FileState {
  files: FileType[]
  selectedFile: FileType | null
  uploading: boolean
  deleting: boolean
  error: string | null
  unsubscribe: Unsubscribe | null
  
  subscribeToFiles: (projectId: string) => void
  loadFiles: (projectId: string) => void
  uploadFile: (projectId: string, file: File, existingFileId?: string) => Promise<void>
  deleteFile: (projectId: string, fileId: string) => Promise<void>
  selectFile: (file: FileType | null) => void
  switchVersion: (fileId: string, version: number) => Promise<void>
  cleanup: () => void
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  selectedFile: null,
  uploading: false,
  deleting: false,
  error: null,
  unsubscribe: null,

  subscribeToFiles: (projectId: string) => {
    const q = query(
      collection(db, 'projects', projectId, 'files'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const files = snapshot.docs.map(doc => ({
        id: doc.id,
        projectId,
        ...doc.data()
      })) as FileType[]
      
      set({ files, error: null })
    }, (error) => {
      const errorMessage = 'Lỗi tải file: ' + error.message
      set({ error: errorMessage })
      toast.error(errorMessage)
    })

    set({ unsubscribe })
  },

  // Alias for compatibility with FilesList component
  loadFiles: (projectId: string) => {
    get().subscribeToFiles(projectId)
  },

  uploadFile: async (projectId: string, file: File, existingFileId?: string) => {
    console.log('🚀 Upload started:', { projectId, fileName: file.name, size: file.size, existingFileId })
    set({ uploading: true, error: null })
    
    try {
      const fileId = existingFileId || generateId()
      console.log('📁 Generated fileId:', fileId)
      
      // Determine file type
      let fileType: 'image' | 'video' | 'model' = 'image'
      if (file.type.startsWith('video/')) fileType = 'video'
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) fileType = 'model'
      console.log('🏷️ File type determined:', fileType)

      // Get current version
      let currentVersion = 1
      if (existingFileId) {
        const existingFile = get().files.find(f => f.id === existingFileId)
        if (existingFile) {
          currentVersion = existingFile.currentVersion + 1
        }
      }
      console.log('🔢 Version:', currentVersion)

      // Upload to Storage
      const storagePath = `projects/${projectId}/${fileId}/v${currentVersion}/${file.name}`
      console.log('☁️ Storage path:', storagePath)
      
      const storageRef = ref(storage, storagePath)
      console.log('⬆️ Starting upload to storage...')
      const snapshot = await uploadBytes(storageRef, file)
      console.log('✅ Upload completed, getting download URL...')
      const url = await getDownloadURL(snapshot.ref)
      console.log('🔗 Download URL obtained:', url)

      // Create version metadata
      const newVersion: FileVersion = {
        url,
        version: currentVersion,
        uploadedAt: Timestamp.now(),
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        }
      }
      console.log('📝 Version metadata created:', newVersion)

      // Update or create Firestore doc
      if (existingFileId) {
        console.log('🔄 Updating existing file...')
        const fileRef = doc(db, 'projects', projectId, 'files', fileId)
        const existingFile = get().files.find(f => f.id === existingFileId)
        await updateDoc(fileRef, {
          versions: [...(existingFile?.versions || []), newVersion],
          currentVersion
        })
        console.log('✅ Existing file updated')
        toast.success(`Đã tải phiên bản ${currentVersion} của ${existingFile?.name}`)
      } else {
        console.log('📄 Creating new file document...')
        const fileRef = doc(db, 'projects', projectId, 'files', fileId)
        const newFileData = {
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          type: fileType,
          versions: [newVersion],
          currentVersion,
          createdAt: Timestamp.now()
        }
        console.log('📋 New file data:', newFileData)
        await setDoc(fileRef, newFileData)
        console.log('✅ New file created')
        toast.success(`Đã tải lên ${file.name}`)
        
        // Create notification for new file upload
        const projectDoc = await getDoc(doc(db, 'projects', projectId))
        if (projectDoc.exists()) {
          const projectData = projectDoc.data()
          await createNotification({
            type: 'upload',
            projectId,
            fileId,
            message: `File mới "${newFileData.name}" đã được tải lên`,
            adminEmail: projectData.adminEmail
          })
        }
      }
      
      console.log('🎉 Upload process completed successfully!')
    } catch (error: any) {
      console.error('❌ Upload failed:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      
      const errorMessage = 'Tải file thất bại: ' + (error.message || 'Lỗi không xác định')
      set({ error: errorMessage })
      toast.error(errorMessage)
      throw error
    } finally {
      set({ uploading: false })
    }
  },

  selectFile: (file: FileType | null) => {
    set({ selectedFile: file })
  },

  deleteFile: async (projectId: string, fileId: string) => {
    set({ deleting: true, error: null })
    
    try {
      const file = get().files.find(f => f.id === fileId)
      if (!file) {
        throw new Error('File không tồn tại')
      }

      // Delete all file versions from Storage
      for (const version of file.versions) {
        try {
          const storagePath = `projects/${projectId}/${fileId}/v${version.version}/${version.metadata.name}`
          const storageRef = ref(storage, storagePath)
          await deleteObject(storageRef)
          console.log(`🗑️ Deleted storage file: ${storagePath}`)
        } catch (storageError: any) {
          // Continue even if storage deletion fails (file might not exist)
          console.warn(`⚠️ Failed to delete storage file: ${storageError.message}`)
        }
      }

      // Delete all comments associated with this file
      const commentsQuery = query(
        collection(db, 'projects', projectId, 'comments'),
        where('fileId', '==', fileId)
      )
      const commentsSnapshot = await getDocs(commentsQuery)
      const deleteCommentPromises = commentsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      await Promise.all(deleteCommentPromises)
      console.log(`🗑️ Deleted ${commentsSnapshot.size} comments`)

      // Delete the file document from Firestore
      await deleteDoc(doc(db, 'projects', projectId, 'files', fileId))
      console.log(`✅ File deleted successfully: ${fileId}`)

      toast.success(`Đã xóa file "${file.name}"`)
    } catch (error: any) {
      console.error('❌ Delete failed:', error)
      const errorMessage = 'Xóa file thất bại: ' + (error.message || 'Lỗi không xác định')
      set({ error: errorMessage })
      toast.error(errorMessage)
      throw error
    } finally {
      set({ deleting: false })
    }
  },

  switchVersion: async (fileId: string, version: number) => {
    const file = get().files.find(f => f.id === fileId)
    if (!file) return

    try {
      await updateDoc(doc(db, 'projects', file.projectId, 'files', fileId), {
        currentVersion: version
      })
      toast.success(`Chuyển sang v${version}`)
    } catch (error: any) {
      toast.error('Lỗi chuyển version: ' + error.message)
    }
  },

  cleanup: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      unsubscribe()
      set({ unsubscribe: null, files: [], selectedFile: null })
    }
  },
}))
