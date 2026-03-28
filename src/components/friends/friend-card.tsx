'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddFriendButton, FriendshipStatus } from './add-friend-button'
import { useNavigationStore } from '@/stores/navigation-store'

export interface FriendCardUser {
  id: string
  name: string
  username: string
  avatar: string | null
  headline?: string | null
  mutualFriendsCount?: number
}

interface FriendCardProps {
  user: FriendCardUser
  friendshipStatus: FriendshipStatus
  requestId?: string
  onAddFriend?: () => Promise<void>
  onAcceptFriend?: () => Promise<void>
  onRejectFriend?: () => Promise<void>
  onUnfriend?: () => Promise<void>
  onCancelRequest?: () => Promise<void>
  showMutualFriends?: boolean
  className?: string
}

export function FriendCard({
  user,
  friendshipStatus,
  requestId,
  onAddFriend,
  onAcceptFriend,
  onRejectFriend,
  onUnfriend,
  onCancelRequest,
  showMutualFriends = true,
  className
}: FriendCardProps) {
  const [currentStatus, setCurrentStatus] = useState<FriendshipStatus>(friendshipStatus)
  const { navigate } = useNavigationStore()

  const handleAddFriend = async () => {
    if (onAddFriend) {
      await onAddFriend()
      setCurrentStatus('pending_sent')
    }
  }

  const handleAcceptFriend = async () => {
    if (onAcceptFriend) {
      await onAcceptFriend()
      setCurrentStatus('friends')
    }
  }

  const handleRejectFriend = async () => {
    if (onRejectFriend) {
      await onRejectFriend()
      setCurrentStatus('none')
    }
  }

  const handleUnfriend = async () => {
    if (onUnfriend) {
      await onUnfriend()
      setCurrentStatus('none')
    }
  }

  const handleCancelRequest = async () => {
    if (onCancelRequest) {
      await onCancelRequest()
      setCurrentStatus('none')
    }
  }

  const handleViewProfile = () => {
    navigate({ type: 'profile', userId: user.id })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={className}>
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Avatar */}
            <button onClick={handleViewProfile} className="focus:outline-none flex-shrink-0">
              <Avatar className="size-10 sm:size-14 border-2 border-teal-100 hover:border-teal-300 transition-colors">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-teal-100 text-teal-700 font-medium text-xs sm:text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* User Info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <button 
                onClick={handleViewProfile}
                className="focus:outline-none text-left w-full"
              >
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate text-sm sm:text-base">
                  {user.name}
                </h3>
              </button>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username}</p>
              {user.headline && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">{user.headline}</p>
              )}
              
              {/* Mutual Friends */}
              {showMutualFriends && user.mutualFriendsCount !== undefined && user.mutualFriendsCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="size-3" />
                  <span>{user.mutualFriendsCount} mutual</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <AddFriendButton
                friendshipStatus={currentStatus}
                requestId={requestId}
                onAddFriend={handleAddFriend}
                onAcceptFriend={handleAcceptFriend}
                onRejectFriend={handleRejectFriend}
                onUnfriend={handleUnfriend}
                onCancelRequest={handleCancelRequest}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
