'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Users, 
  AtSign,
  Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNavigationStore } from '@/stores/navigation-store'

export type NotificationType = 
  | 'friend_request'
  | 'friend_accepted'
  | 'like'
  | 'comment'
  | 'group_invite'
  | 'mention'

export interface NotificationItemData {
  fromUserId?: string
  postId?: string
  commentId?: string
  groupId?: string
  friendshipId?: string
}

export interface NotificationItemType {
  id: string
  type: NotificationType
  title: string
  message: string
  data: NotificationItemData | null
  read: boolean
  createdAt: string | Date
  actor?: {
    id: string
    name: string
    username: string
    avatar: string | null
  }
}

export interface NotificationItemProps {
  notification: NotificationItemType
  onMarkAsRead?: (id: string) => Promise<void>
  onClose?: () => void
  className?: string
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  like: Heart,
  comment: MessageCircle,
  group_invite: Users,
  mention: AtSign,
}

const notificationColors: Record<NotificationType, string> = {
  friend_request: 'bg-blue-500',
  friend_accepted: 'bg-teal-500',
  like: 'bg-red-500',
  comment: 'bg-purple-500',
  group_invite: 'bg-amber-500',
  mention: 'bg-cyan-500',
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
  className,
}: NotificationItemProps) {
  const { navigate } = useNavigationStore()

  const Icon = notificationIcons[notification.type] || Bell
  const iconBgColor = notificationColors[notification.type] || 'bg-gray-500'

  const handleClick = async () => {
    // Mark as read
    if (!notification.read && onMarkAsRead) {
      await onMarkAsRead(notification.id)
    }
    
    // Navigate based on notification type
    const { data } = notification
    if (data) {
      switch (notification.type) {
        case 'friend_request':
          navigate({ type: 'friends', tab: 'requests' })
          break
        case 'friend_accepted':
          if (data.fromUserId) {
            navigate({ type: 'profile', userId: data.fromUserId })
          } else {
            navigate({ type: 'friends' })
          }
          break
        case 'like':
        case 'comment':
        case 'mention':
          if (data.postId) {
            navigate({ type: 'post', postId: data.postId })
          }
          break
        case 'group_invite':
          if (data.groupId) {
            navigate({ type: 'groups', groupId: data.groupId })
          } else {
            navigate({ type: 'groups' })
          }
          break
      }
    }

    onClose?.()
  }

  const getTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins}m lalu`
    if (diffHours < 24) return `${diffHours}j lalu`
    if (diffDays < 7) return `${diffDays}h lalu`
    return then.toLocaleDateString('id-ID')
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={cn('relative', className)}
    >
      <button 
        onClick={handleClick}
        className={cn(
          'flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors w-full text-left',
          !notification.read && 'bg-primary/5'
        )}
      >
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          iconBgColor
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Actor Avatar if available */}
        {notification.actor && (
          <Avatar className="size-10 flex-shrink-0">
            <AvatarImage src={notification.actor.avatar || undefined} alt={notification.actor.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(notification.actor.name)}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium',
            !notification.read && 'text-foreground',
            notification.read && 'text-muted-foreground'
          )}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {getTimeAgo(notification.createdAt)}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
        )}
      </button>
    </motion.div>
  )
}
