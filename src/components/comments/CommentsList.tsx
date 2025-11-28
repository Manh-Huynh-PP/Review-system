import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useState } from 'react'
import type { Comment } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Circle, Clock, Reply, Send } from 'lucide-react'

interface CommentsListProps {
  comments: Comment[]
  onResolveToggle?: (commentId: string, isResolved: boolean) => void
  onTimestampClick?: (timestamp: number) => void
  onReply?: (parentCommentId: string, userName: string, content: string) => Promise<void>
  currentUserName?: string
}

export function CommentsList({ 
  comments, 
  onResolveToggle, 
  onTimestampClick,
  onReply,
  currentUserName = ''
}: CommentsListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // Organize comments into parent-child structure
  const rootComments = comments.filter(c => !c.parentCommentId)
  const repliesByParent = comments.reduce((acc, comment) => {
    if (comment.parentCommentId) {
      if (!acc[comment.parentCommentId]) {
        acc[comment.parentCommentId] = []
      }
      acc[comment.parentCommentId].push(comment)
    }
    return acc
  }, {} as Record<string, Comment[]>)

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !onReply) return
    
    setSubmittingReply(true)
    try {
      await onReply(parentId, currentUserName, replyContent)
      setReplyContent('')
      setReplyingTo(null)
    } finally {
      setSubmittingReply(false)
    }
  }

  const renderComment = (comment: Comment, depth = 0) => {
    const replies = repliesByParent[comment.id] || []
    const isReplying = replyingTo === comment.id
    const isNested = depth > 0

    return (
      <div key={comment.id} className={isNested ? 'ml-6 mt-2' : ''}>
        <div className={`group rounded-lg p-3 transition-colors ${
          comment.isResolved 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-muted/50 border border-border hover:bg-muted/70'
        }`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{comment.userName}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt.toDate(), {
                    addSuffix: true,
                    locale: vi
                  })}
                </span>
                {comment.isResolved && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolved
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {comment.timestamp !== undefined && comment.timestamp !== null && onTimestampClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTimestampClick(comment.timestamp!)}
                  className="h-7 px-2 text-xs gap-1"
                  title="Phát từ timestamp này"
                >
                  <Clock className="w-3 h-3" />
                  {Math.floor(comment.timestamp / 60)}:{String(Math.floor(comment.timestamp % 60)).padStart(2, '0')}
                </Button>
              )}
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                  className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Trả lời"
                >
                  <Reply className="w-3.5 h-3.5" />
                </Button>
              )}
              {onResolveToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResolveToggle(comment.id, !comment.isResolved)}
                  className={`h-7 px-2 ${comment.isResolved ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground hover:text-foreground'}`}
                  title={comment.isResolved ? 'Mở lại' : 'Đánh dấu resolved'}
                >
                  {comment.isResolved ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>

          {/* Reply input */}
          {isReplying && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Trả lời ${comment.userName}...`}
                  className="flex-1 min-h-[70px] text-sm"
                  disabled={submittingReply}
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim() || submittingReply}
                    className="h-8 px-3"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                    disabled={submittingReply}
                    className="h-8 px-3"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render replies recursively */}
        {replies.length > 0 && (
          <div className="space-y-2">
            {replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Chưa có bình luận nào
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rootComments.map(comment => renderComment(comment))}
    </div>
  )
}
