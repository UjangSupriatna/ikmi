'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigationStore } from '@/stores/navigation-store'

interface UserFriend {
  id: string
  friendId: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
}

interface UserFriendsListProps {
  userId: string
  className?: string
}

export function UserFriendsList({ userId, className }: UserFriendsListProps) {
  const [friends, setFriends] = useState<UserFriend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { navigate } = useNavigationStore()

  useEffect(() => {
    fetchFriends()
  }, [userId])

  const fetchFriends = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/friends?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch friends')
      }
      const data = await response.json()
      setFriends(data.friends || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleUserClick = (friendId: string) => {
    navigate({ type: 'profile', userId: friendId })
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Skeleton className="size-10 sm:size-12 rounded-full" />
                  <div className="flex-1 space-y-1 sm:space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    <Skeleton className="h-2 sm:h-3 w-16 sm:w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (friends.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6 text-center">
          <Users className="size-10 sm:size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No friends yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Users className="size-4 sm:size-5 text-teal-600" />
        <span className="text-sm sm:text-base font-medium">{friends.length} Friends</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <AnimatePresence>
          {friends.map((friend, index) => (
            <motion.div
              key={friend.friendId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent 
                  className="p-2 sm:p-3"
                  onClick={() => handleUserClick(friend.friendId)}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="size-10 sm:size-12 border-2 border-teal-100">
                      <AvatarImage src={friend.avatar || undefined} alt={friend.name} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xs sm:text-sm font-medium">
                        {getInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate hover:text-primary transition-colors">
                        {friend.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
