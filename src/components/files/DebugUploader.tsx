import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { auth, storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

export function DebugUploader() {
  const [testing, setTesting] = useState(false)

  const testFirebaseConnection = async () => {
    setTesting(true)
    try {
      console.log('🔍 Testing Firebase connection...')
      
      // Test Auth
      console.log('👤 Auth user:', auth.currentUser?.email || 'Not signed in')
      
      // Test Storage
      console.log('🗄️ Storage app:', storage.app.name)
      console.log('🗄️ Storage bucket:', storage.app.options.storageBucket)
      
      // Test if we can access storage bucket
      try {
        const testData = 'Hello Firebase Storage!'
        const testBlob = new Blob([testData], { type: 'text/plain' })
        const testRef = ref(storage, 'test/hello.txt')
        
        console.log('⬆️ Testing storage upload...')
        await uploadBytes(testRef, testBlob)
        console.log('✅ Storage upload successful')
        
        const downloadURL = await getDownloadURL(testRef)
        console.log('🔗 Download URL:', downloadURL)
        
        toast.success('✅ Storage test passed!')
      } catch (storageError: any) {
        console.error('❌ Storage test failed:', storageError)
        
        if (storageError.code === 'storage/object-not-found' || 
            storageError.code === 'storage/bucket-not-found' ||
            storageError.message?.includes('CORS')) {
          toast.error('❌ Storage bucket not initialized. Please enable Storage in Firebase Console.')
          console.log('🚨 Go to: https://console.firebase.google.com/project/review-99901/storage')
        } else {
          toast.error('❌ Storage error: ' + storageError.message)
        }
        return
      }
      
      // Test Firestore write  
      const testDoc = doc(db, 'test', 'hello')
      await setDoc(testDoc, {
        message: 'Hello Firestore!',
        timestamp: Timestamp.now()
      })
      console.log('✅ Firestore write successful')
      
      toast.success('🎉 All Firebase tests passed!')
      
    } catch (error: any) {
      console.error('❌ Firebase test failed:', error)
      toast.error('Firebase test failed: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-medium mb-2">Firebase Debug Tools</h3>
      <div className="space-y-2">
        <Button 
          onClick={testFirebaseConnection} 
          disabled={testing}
          variant="outline"
          size="sm"
        >
          {testing ? 'Testing...' : '🔍 Test Firebase Connection'}
        </Button>
        <div className="text-xs text-muted-foreground">
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  )
}