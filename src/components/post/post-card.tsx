'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Trash2,
  Flag,
  Link2,
  Loader2,
  MapPin,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
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
import { CommentSection } from './comment-section'
import { useNavigationStore } from '@/stores/navigation-store'

export interface PostData {
  id: string
  content: string
  images: string[]
  location?: string | null
  visibility: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    username: string
    avatar: string | null
  }
  isLiked: boolean
  likeCount: number
  commentCount: number
}

interface PostCardProps {
  post: PostData
  currentUserId?: string
  onPostDeleted?: (postId: string) => void
  onLikeChange?: (postId: string, isLiked: boolean, likeCount: number) => void
  onCommentChange?: (postId: string, commentCount: number) => void
}

// Helper function to get proper image URL
function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null
  
  // If it's already a full URL or base64, return as is
  if (imagePath.startsWith('http://') || 
      imagePath.startsWith('https://') || 
      imagePath.startsWith('data:')) {
    return imagePath
  }
  
  // If it's a relative path starting with /, return as is (will be served from public)
  if (imagePath.startsWith('/')) {
    return imagePath
  }
  
  // Otherwise, assume it's a relative path and prepend /
  return `/${imagePath}`
}

export function PostCard({ 
  post, 
  currentUserId,
  onPostDeleted,
  onLikeChange,
  onCommentChange
}: PostCardProps) {
  const [isLiked, setIsLiked] = React.useState(post.isLiked)
  const [likeCount, setLikeCount] = React.useState(post.likeCount)
  const [commentCount, setCommentCount] = React.useState(post.commentCount)
  const [showComments, setShowComments] = React.useState(false)
  const [isLiking, setIsLiking] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [imageErrors, setImageErrors] = React.useState<Set<number>>(new Set())
  const { toast } = useToast()
  const { navigate } = useNavigationStore()

  const isOwnPost = currentUserId === post.author.id

  // Filter out invalid images and get proper URLs
  const validImages = React.useMemo(() => {
    if (!post.images || !Array.isArray(post.images)) return []
    
    return post.images
      .map((img, index) => ({
        url: getImageUrl(img),
        originalIndex: index
      }))
      .filter(img => img.url !== null)
  }, [post.images])

  const handleViewProfile = () => {
    navigate({ type: 'profile', userId: post.author.id })
  }

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method,
      })

      if (!response.ok) {
        throw new Error('Failed to update like')
      }

      const data = await response.json()
      setIsLiked(data.isLiked)
      setLikeCount(data.likeCount)
      onLikeChange?.(post.id, data.isLiked, data.likeCount)
    } catch (error) {
      console.error('Error updating like:', error)
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully',
      })
      onPostDeleted?.(post.id)
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/?post=${post.id}`
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link disalin',
        description: 'Link postingan berhasil disalin ke clipboard',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal menyalin link',
        variant: 'destructive',
      })
    }
  }

  const handleCommentAdded = (count: number) => {
    setCommentCount(count)
    onCommentChange?.(post.id, count)
  }

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index))
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

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-4">
            {/* Post Header */}
            <div className="flex items-start gap-3">
              <button onClick={handleViewProfile} className="focus:outline-none flex-shrink-0">
                <Avatar className="size-10 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                  <AvatarImage src={post.author.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(post.author.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={handleViewProfile}
                    className="font-semibold text-sm hover:text-primary transition-colors text-left"
                  >
                    {post.author.name}
                  </button>
                  <span className="text-muted-foreground text-xs">@{post.author.username}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs">{formatTimestamp(post.createdAt)}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Link2 className="size-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                  {isOwnPost ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete post
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
                        <Flag className="size-4 mr-2" />
                        Report post
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Post Content */}
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
            
            {/* Location */}
            {post.location && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span>{post.location}</span>
              </div>
            )}

            {/* Post Images */}
            {validImages.length > 0 && (
              <div className={`mt-3 grid gap-2 ${
                validImages.length === 1 ? 'grid-cols-1' :
                validImages.length === 2 ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {validImages.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative rounded-lg overflow-hidden bg-muted group cursor-pointer ${
                      validImages.length === 3 && index === 0 ? 'col-span-2' : ''
                    }`}
                    onClick={() => !imageErrors.has(image.originalIndex) && setSelectedImage(image.url)}
                  >
                    {!imageErrors.has(image.originalIndex) ? (
                      <>
                        <img
                          src={image.url!}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-auto max-h-[400px] object-cover"
                          onError={() => handleImageError(image.originalIndex)}
                          loading="lazy"
                        />
                        {/* Zoom overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                      </>
                    ) : (
                      <div className="aspect-square flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <ImageIcon className="size-8" />
                        <span className="text-xs">Gagal memuat gambar</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                {isLiking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Heart className={`size-4 ${isLiked ? 'fill-current' : ''}`} />
                )}
                <span className="text-xs">{likeCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-primary"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="size-4" />
                <span className="text-xs">{commentCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-primary"
                onClick={handleShare}
              >
                <Share2 className="size-4" />
              </Button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <CommentSection
                postId={post.id}
                currentUserId={currentUserId}
                onCommentCountChange={handleCommentAdded}
              />
            )}
          </CardContent>
        </Card>
      </motion.article>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size image"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
    </>
  )
}
