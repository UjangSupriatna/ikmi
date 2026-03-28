'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, UserCheck, UserX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

interface AddFriendButtonProps {
  friendshipStatus: FriendshipStatus
  requestId?: string // For pending requests
  onAddFriend?: () => Promise<void>
  onAcceptFriend?: () => Promise<void>
  onRejectFriend?: () => Promise<void>
  onUnfriend?: () => Promise<void>
  onCancelRequest?: () => Promise<void>
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AddFriendButton({
  friendshipStatus,
  requestId,
  onAddFriend,
  onAcceptFriend,
  onRejectFriend,
  onUnfriend,
  onCancelRequest,
  className,
  size = 'default'
}: AddFriendButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleAction = async (action: () => Promise<void> | undefined) => {
    if (!action) return
    setIsLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  const renderButton = () => {
    switch (friendshipStatus) {
      case 'none':
        return (
          <Button
            variant="default"
            size={size}
            className={cn('bg-teal-600 hover:bg-teal-700 text-white', className)}
            onClick={() => handleAction(onAddFriend)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            <span>Add Friend</span>
          </Button>
        )

      case 'pending_sent':
        return (
          <Button
            variant="outline"
            size={size}
            className={cn('border-amber-500 text-amber-600 hover:bg-amber-50', className)}
            onClick={() => handleAction(onCancelRequest)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserX className="size-4" />
            )}
            <span>Cancel Request</span>
          </Button>
        )

      case 'pending_received':
        return (
          <div className={cn('flex gap-2', className)}>
            <Button
              variant="default"
              size={size}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => handleAction(onAcceptFriend)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserCheck className="size-4" />
              )}
              <span>Accept</span>
            </Button>
            <Button
              variant="outline"
              size={size}
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => handleAction(onRejectFriend)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserX className="size-4" />
              )}
              <span>Reject</span>
            </Button>
          </div>
        )

      case 'friends':
        return (
          <div className="relative">
            <AnimatePresence>
              {showConfirm ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn('flex gap-2', className)}
                >
                  <Button
                    variant="destructive"
                    size={size}
                    onClick={() => handleAction(onUnfriend)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserX className="size-4" />
                    )}
                    <span>Confirm</span>
                  </Button>
                  <Button
                    variant="outline"
                    size={size}
                    onClick={() => setShowConfirm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant="outline"
                    size={size}
                    className={cn('border-teal-500 text-teal-600 hover:bg-teal-50', className)}
                    onClick={() => setShowConfirm(true)}
                  >
                    <UserCheck className="size-4" />
                    <span>Friends</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )

      default:
        return null
    }
  }

  return renderButton()
}
