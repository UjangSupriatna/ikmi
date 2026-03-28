'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users, Check, X, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FriendRequestUser {
  id: string
  name: string
  username: string
  avatar: string | null
  headline?: string | null
}

export interface FriendRequestItemProps {
  id: string
  user: FriendRequestUser
  createdAt: string | Date
  type: 'incoming' | 'outgoing'
  mutualFriendsCount?: number
  onAccept?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  onCancel?: (id: string) => Promise<void>
  className?: string
}

export function FriendRequestItem({
  id,
  user,
  createdAt,
  type,
  mutualFriendsCount,
  onAccept,
  onReject,
  onCancel,
  className
}: FriendRequestItemProps) {
  const [isLoading, setIsLoading] = useState<'accept' | 'reject' | 'cancel' | null>(null)
  const [isRemoved, setIsRemoved] = useState(false)

  const handleAction = async (
    action: 'accept' | 'reject' | 'cancel',
    handler: ((id: string) => Promise<void>) | undefined
  ) => {
    if (!handler) return
    setIsLoading(action)
    try {
      await handler(id)
      if (action !== 'accept') {
        setIsRemoved(true)
      }
    } catch (error) {
      console.error(`${action} failed:`, error)
    } finally {
      setIsLoading(null)
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

  const getTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  if (isRemoved) {
    return (
      <motion.div
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <Card className={cn('opacity-0', className)}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 text-center">Request removed</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <Link href={`/profile/${user.username}`} className="flex-shrink-0">
              <Avatar className="size-10 sm:size-12 border-2 border-teal-100 hover:border-teal-300 transition-colors">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-teal-100 text-teal-700 font-medium text-xs sm:text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.username}`}>
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate text-sm sm:text-base">
                  {user.name}
                </h3>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username}</p>
              
              {/* Mutual Friends & Time */}
              <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                {mutualFriendsCount !== undefined && mutualFriendsCount > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Users className="size-2.5 sm:size-3" />
                    {mutualFriendsCount} mutual
                  </span>
                )}
                <span className="text-xs text-muted-foreground/70 flex items-center gap-0.5">
                  <Clock className="size-2.5 sm:size-3" />
                  {getTimeAgo(createdAt)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              {type === 'incoming' ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white h-8 sm:h-9 px-2 sm:px-3"
                    onClick={() => handleAction('accept', onAccept)}
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'accept' ? (
                      <Loader2 className="size-3.5 sm:size-4 animate-spin" />
                    ) : (
                      <Check className="size-3.5 sm:size-4" />
                    )}
                    <span className="hidden sm:inline ml-1">Accept</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3"
                    onClick={() => handleAction('reject', onReject)}
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'reject' ? (
                      <Loader2 className="size-3.5 sm:size-4 animate-spin" />
                    ) : (
                      <X className="size-3.5 sm:size-4" />
                    )}
                    <span className="hidden sm:inline ml-1">Reject</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:bg-accent h-8 sm:h-9"
                  onClick={() => handleAction('cancel', onCancel)}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'cancel' ? (
                    <Loader2 className="size-3.5 sm:size-4 animate-spin" />
                  ) : (
                    <X className="size-3.5 sm:size-4" />
                  )}
                  <span className="text-xs sm:text-sm">Cancel</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
