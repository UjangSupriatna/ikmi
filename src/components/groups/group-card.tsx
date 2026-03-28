'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Users, Lock, Globe, UserPlus, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface GroupData {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  avatar: string | null
  privacy: string
  memberCount: number
  postCount: number
  isMember: boolean
  memberRole: string | null
  isCreator: boolean
  createdBy: {
    id: string
    name: string
    username: string
    avatar: string | null
  }
  createdAt: Date | string
}

interface GroupCardProps {
  group: GroupData
  onJoin?: (groupId: string) => void
  onLeave?: (groupId: string) => void
  onClick?: (groupId: string) => void
  isJoining?: boolean
}

export function GroupCard({ 
  group, 
  onJoin, 
  onLeave, 
  onClick,
  isJoining = false 
}: GroupCardProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading || isJoining) return

    setIsLoading(true)
    try {
      if (group.isMember) {
        await onLeave?.(group.id)
      } else {
        await onJoin?.(group.id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimestamp = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const getRoleBadge = (role: string | null, isCreator: boolean) => {
    if (isCreator) return <Badge variant="default" className="text-xs">Creator</Badge>
    if (role === 'admin') return <Badge variant="secondary" className="text-xs">Admin</Badge>
    if (role === 'moderator') return <Badge variant="outline" className="text-xs">Moderator</Badge>
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border/50"
        onClick={() => onClick?.(group.id)}
      >
        {/* Cover Image */}
        <div className="relative h-24 bg-gradient-to-r from-teal-500/20 to-emerald-500/20">
          {group.coverImage ? (
            <img
              src={group.coverImage}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-teal-500/30 to-emerald-500/30" />
          )}
          
          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs gap-1">
              {group.privacy === 'private' ? (
                <>
                  <Lock className="size-3" />
                  Private
                </>
              ) : (
                <>
                  <Globe className="size-3" />
                  Public
                </>
              )}
            </Badge>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-6 left-4">
            <Avatar className="size-12 border-4 border-background shadow-lg">
              <AvatarImage src={group.avatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(group.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-8 pb-4 px-4">
          {/* Group Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Created {formatTimestamp(group.createdAt)}
                </p>
              </div>
              {getRoleBadge(group.memberRole, group.isCreator)}
            </div>

            {group.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>{group.memberCount.toLocaleString()} members</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{group.postCount.toLocaleString()} posts</span>
              </div>
            </div>

            {/* Action Button */}
            {!group.isCreator && (
              <div className="pt-2">
                <Button
                  variant={group.isMember ? 'outline' : 'default'}
                  size="sm"
                  className="w-full gap-1"
                  onClick={handleJoinLeave}
                  disabled={isLoading || isJoining}
                >
                  {isLoading || isJoining ? (
                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : group.isMember ? (
                    <>
                      <UserCheck className="size-4" />
                      Leave Group
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      Join Group
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
