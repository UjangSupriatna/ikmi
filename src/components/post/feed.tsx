'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { CreatePost } from './create-post'
import { PostCard, PostData } from './post-card'

interface FeedProps {
  currentUser?: {
    id: string
    name: string
    username: string
    avatar: string | null
  } | null
}

export function Feed({ currentUser }: FeedProps) {
  const [posts, setPosts] = React.useState<PostData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const { toast } = useToast()

  const fetchPosts = React.useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch posts')

      const data = await response.json()
      
      if (append) {
        setPosts((prev) => [...prev, ...data.posts])
      } else {
        setPosts(data.posts)
      }
      setHasMore(data.pagination.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setIsLoadingMore(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleRefresh = () => {
    fetchPosts(1)
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchPosts(page + 1, true)
    }
  }

  const handlePostCreated = () => {
    // Refresh the feed to show the new post
    fetchPosts(1)
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handleLikeChange = (postId: string, isLiked: boolean, likeCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, isLiked, likeCount }
          : post
      )
    )
  }

  const handleCommentChange = (postId: string, commentCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, commentCount }
          : post
      )
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading feed...</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} currentUser={currentUser} />

      <Separator />

      {/* Posts Feed */}
      <AnimatePresence mode="popLayout">
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-4"
          >
            <div className="bg-muted/50 rounded-lg p-8">
              <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
              <p className="text-muted-foreground text-sm">
                Be the first to share something with the community!
              </p>
            </div>
          </motion.div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PostCard
                post={post}
                currentUserId={currentUser?.id}
                onPostDeleted={handlePostDeleted}
                onLikeChange={handleLikeChange}
                onCommentChange={handleCommentChange}
              />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 text-center">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load more posts'
            )}
          </Button>
        </div>
      )}

      {/* Refresh Button - At the bottom */}
      <div className="p-4 flex justify-center border-t">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              Refresh Feed
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
