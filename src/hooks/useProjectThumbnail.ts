import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { File as FileType } from '@/types'

export function useProjectThumbnail(projectId: string) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

    async function fetchLatestImage() {
      try {
        setLoading(true)
        
        // Fetch all files from the project (no index required)
        const filesRef = collection(db, 'projects', projectId, 'files')
        const snapshot = await getDocs(filesRef)
        
        if (!snapshot.empty) {
          // Filter and sort on client side
          const files = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as FileType))
            .filter(file => file.type === 'image' || file.type === 'sequence')
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0
              const bTime = b.createdAt?.toMillis?.() || 0
              return bTime - aTime
            })
          
          if (files.length > 0) {
            const latestFile = files[0]
            const currentVersionData = latestFile.versions?.[latestFile.currentVersion - 1]
            
            if (currentVersionData?.url) {
              setThumbnailUrl(currentVersionData.url)
            } else {
              setThumbnailUrl(null)
            }
          } else {
            setThumbnailUrl(null)
          }
        } else {
          setThumbnailUrl(null)
        }
      } catch (error: any) {
        console.error('Error fetching thumbnail:', error)
        setThumbnailUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestImage()
  }, [projectId])

  return { thumbnailUrl, loading }
}
