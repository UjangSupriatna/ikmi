'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Loader2,
  MessageCircle,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useNavigationStore } from '@/stores/navigation-store'

interface CommentUser {
  id: string
  name: string
  username: string
  avatar: string | null
}

interface Reply {
  id: string
  content: string
  images: string[]
  createdAt: string
  author: CommentUser
  isLiked: boolean
  likeCount: number
  replies: Reply[]
}

interface Comment {
  id: string
  content: string
  images: string[]
  createdAt: string
  author: CommentUser
  isLiked: boolean
  likeCount: number
  replies: Reply[]
}

interface CommentSectionProps {
  postId: string
  currentUserId?: string
  onCommentCountChange?: (count: number) => void
}

export function CommentSection({ 
  postId, 
  currentUserId,
  onCommentCountChange 
}: CommentSectionProps) {
  const [comments, setComments] = React.useState<Comment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [newComment, setNewComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [replyTo, setReplyTo] = React.useState<{ id: string; name: string } | null>(null)
  const [replyContent, setReplyContent] = React.useState('')
  const [isSubmittingReply, setIsSubmittingReply] = React.useState(false)
  const [expandedReplies, setExpandedReplies] = React.useState<Set<string>>(new Set())
  const [deleteCommentId, setDeleteCommentId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const { toast } = useToast()

  const fetchComments = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [postId, toast])

  React.useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const data = await response.json()
      setComments((prev) => [data, ...prev])
      setNewComment('')
      onCommentCountChange?.(comments.length + 1)
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added',
      })
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmittingReply) return

    setIsSubmittingReply(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyContent.trim(),
          parentId,
        }),
      })

      if (!response.ok) throw new Error('Failed to post reply')

      const data = await response.json()
      
      // Update the comment with the new reply
      setComments((prev) => 
        prev.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...comment.replies, data],
            }
          }
          return comment
        })
      )
      
      setReplyContent('')
      setReplyTo(null)
      toast({
        title: 'Reply posted',
        description: 'Your reply has been added',
      })
    } catch (error) {
      console.error('Error posting reply:', error)
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })

      if (!response.ok) throw new Error('Failed to update like')

      // Helper function to update like state in nested structure
      const updateLikeInReplies = (replies: Reply[]): Reply[] => {
        return replies.map((reply) => {
          if (reply.id === commentId) {
            return {
              ...reply,
              isLiked: !isLiked,
              likeCount: isLiked ? reply.likeCount - 1 : reply.likeCount + 1,
            }
          }
          if (reply.replies && reply.replies.length > 0) {
            return {
              ...reply,
              replies: updateLikeInReplies(reply.replies),
            }
          }
          return reply
        })
      }

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              isLiked: !isLiked,
              likeCount: isLiked ? comment.likeCount - 1 : comment.likeCount + 1,
            }
          }
          // Check nested replies
          return {
            ...comment,
            replies: updateLikeInReplies(comment.replies),
          }
        })
      )
    } catch (error) {
      console.error('Error updating like:', error)
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/comments/${deleteCommentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete comment')

      // Remove the comment from state
      setComments((prev) => {
        return prev
          .filter((comment) => comment.id !== deleteCommentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies.filter((reply) => reply.id !== deleteCommentId),
          }))
      })

      onCommentCountChange?.(comments.length - 1)
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted',
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteCommentId(null)
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimestamp = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const CommentItem = ({ 
    comment, 
    isReply = false,
    parentCommentId 
  }: { 
    comment: Comment | Reply
    isReply?: boolean
    parentCommentId?: string
  }) => {
    const [showReplyInput, setShowReplyInput] = React.useState(false)
    const [localReplyContent, setLocalReplyContent] = React.useState('')
    const [isSubmittingLocalReply, setIsSubmittingLocalReply] = React.useState(false)
    const { navigate } = useNavigationStore()

    const handleUserClick = () => {
      navigate({ type: 'profile', userId: comment.author.id })
    }

    const handleLocalReplySubmit = async () => {
      if (!localReplyContent.trim() || isSubmittingLocalReply) return

      setIsSubmittingLocalReply(true)
      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: localReplyContent.trim(),
            parentId: parentCommentId || comment.id,
          }),
        })

        if (!response.ok) throw new Error('Failed to post reply')

        const data = await response.json()
        
        setComments((prev) => 
          prev.map((c) => {
            if (c.id === (parentCommentId || comment.id)) {
              return {
                ...c,
                replies: [...c.replies, data],
              }
            }
            return c
          })
        )
        
        setLocalReplyContent('')
        setShowReplyInput(false)
        toast({
          title: 'Reply posted',
          description: 'Your reply has been added',
        })
      } catch (error) {
        console.error('Error posting reply:', error)
        toast({
          title: 'Error',
          description: 'Failed to post reply',
          variant: 'destructive',
        })
      } finally {
        setIsSubmittingLocalReply(false)
      }
    }

    return (
      <div className={cn("flex gap-2", isReply && "ml-8 mt-2")}>
        <button 
          onClick={handleUserClick}
          className="focus:outline-none flex-shrink-0"
        >
          <Avatar className="size-8 border border-transparent hover:border-primary/50 transition-colors">
            <AvatarImage src={comment.author.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(comment.author.name)}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={handleUserClick}
                  className="font-medium text-xs hover:text-primary transition-colors focus:outline-none"
                >
                  {comment.author.name}
                </button>
                <span className="text-muted-foreground text-xs">@{comment.author.username}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs">{formatTimestamp(comment.createdAt)}</span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
              
              {/* Comment images */}
              {comment.images && comment.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {comment.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Comment image ${idx + 1}`}
                      className="h-20 w-auto rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Comment actions */}
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs gap-1",
                    comment.isLiked ? "text-red-500" : "text-muted-foreground"
                  )}
                  onClick={() => handleLikeComment(comment.id, comment.isLiked)}
                >
                  <Heart className={cn("size-3", comment.isLiked && "fill-current")} />
                  {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                </Button>
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setShowReplyInput(!showReplyInput)}
                  >
                    Reply
                  </Button>
                )}
              </div>

              {/* Reply input */}
              {showReplyInput && (
                <div className="mt-2 flex gap-2">
                  <Textarea
                    value={localReplyContent}
                    onChange={(e) => setLocalReplyContent(e.target.value)}
                    placeholder={`Reply to @${comment.author.username}...`}
                    className="min-h-[60px] resize-none text-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={handleLocalReplySubmit}
                      disabled={!localReplyContent.trim() || isSubmittingLocalReply}
                    >
                      {isSubmittingLocalReply ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Send className="size-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowReplyInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Comment dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
                  <MoreHorizontal className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUserId === comment.author.id ? (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteCommentId(comment.id)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
                    <Flag className="size-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Nested replies */}
          {'replies' in comment && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.slice(0, expandedReplies.has(comment.id) ? undefined : 1).map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply parentCommentId={comment.id} />
              ))}
              {comment.replies.length > 1 && !expandedReplies.has(comment.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary mt-1"
                  onClick={() => toggleReplies(comment.id)}
                >
                  View {comment.replies.length - 1} more {comment.replies.length === 2 ? 'reply' : 'replies'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const commentSectionContent = (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 pt-3 border-t border-border"
    >
      {/* Comment input */}
      <div className="flex gap-2 mb-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[60px] resize-none"
        />
        <div className="flex flex-col justify-end">
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 pr-2">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )

  // Delete confirmation dialog
  const deleteDialog = (
    <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this comment? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteComment}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <>
      {commentSectionContent}
      {deleteDialog}
    </>
  )
}
