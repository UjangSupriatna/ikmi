'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Crown, Shield, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface GroupMemberData {
  id: string
  userId: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
  role: string
  isCreator: boolean
  joinedAt: Date | string
}

interface GroupMembersProps {
  members: GroupMemberData[]
  isLoading?: boolean
  currentUserId?: string
  isAdmin?: boolean
  onMemberClick?: (userId: string) => void
  onRoleChange?: (memberId: string, newRole: string) => void
}

export function GroupMembers({
  members,
  isLoading = false,
  currentUserId,
  isAdmin = false,
  onMemberClick,
  onRoleChange,
}: GroupMembersProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    admins: true,
    moderators: true,
    members: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Group members by role
  const admins = members.filter((m) => m.isCreator || m.role === 'admin')
  const moderators = members.filter((m) => m.role === 'moderator' && !m.isCreator)
  const regularMembers = members.filter((m) => m.role === 'member' && !m.isCreator)

  const renderMemberList = (
    memberList: GroupMemberData[],
    sectionKey: string,
    icon: React.ReactNode,
    title: string,
    badgeVariant: 'default' | 'secondary' | 'outline' = 'secondary'
  ) => {
    if (memberList.length === 0) return null

    return (
      <div className="border-b border-border last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
            <Badge variant={badgeVariant} className="text-xs">
              {memberList.length}
            </Badge>
          </div>
          {expandedSections[sectionKey] ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections[sectionKey] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-2 pb-2 space-y-1">
                {memberList.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onMemberClick?.(member.userId)}
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {member.name}
                          </span>
                          {member.isCreator && (
                            <Crown className="size-3 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            @{member.username}
                          </span>
                          {member.headline && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {member.headline}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="size-5" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="size-5" />
          Members
          <Badge variant="outline" className="ml-auto">
            {members.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No members yet</p>
            </div>
          ) : (
            <>
              {renderMemberList(
                admins,
                'admins',
                <Shield className="size-4 text-primary" />,
                'Admins',
                'default'
              )}
              {renderMemberList(
                moderators,
                'moderators',
                <Shield className="size-4 text-blue-500" />,
                'Moderators'
              )}
              {renderMemberList(
                regularMembers,
                'members',
                <User className="size-4 text-muted-foreground" />,
                'Members'
              )}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
