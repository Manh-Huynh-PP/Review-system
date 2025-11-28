import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface AddCommentProps {
  onSubmit: (userName: string, content: string, timestamp?: number) => Promise<void>
  currentTimestamp?: number
  showTimestamp?: boolean
  userName?: string
  onUserNameChange?: (name: string) => void
}

export function AddComment({ 
  onSubmit, 
  currentTimestamp, 
  showTimestamp = false,
  userName: initialUserName,
  onUserNameChange 
}: AddCommentProps) {
  const [userName, setUserName] = useState(initialUserName || '')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim() || !content.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(
        userName.trim(), 
        content.trim(), 
        showTimestamp ? currentTimestamp : undefined
      )
      // Clear immediately on success
      setContent('')
      if (onUserNameChange) {
        onUserNameChange(userName.trim())
      }
    } catch (error) {
      // Keep content on error so user can retry
      console.error('Failed to submit comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!initialUserName && (
        <Input
          placeholder="Tên của bạn"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          className="text-sm"
        />
      )}
      
      <div className="relative">
        <Textarea
          placeholder={showTimestamp && currentTimestamp !== undefined 
            ? `Bình luận tại ${formatTime(currentTimestamp)}...` 
            : 'Viết bình luận...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="text-sm resize-none pr-20"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !userName.trim() || !content.trim()}
          className="absolute bottom-2 right-2 gap-1"
        >
          <Send className="w-3 h-3" />
          Gửi
        </Button>
      </div>
      
      {showTimestamp && currentTimestamp !== undefined && (
        <div className="text-xs text-muted-foreground">
          Bình luận sẽ được gắn với thời điểm {formatTime(currentTimestamp)}
        </div>
      )}
    </form>
  )
}
