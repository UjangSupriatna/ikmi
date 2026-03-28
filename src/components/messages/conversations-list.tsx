'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Plus, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface ConversationData {
  id: string
  createdAt: Date
  updatedAt: Date
  participants: {
    id: string
    name: string
    username: string
    avatar: string | null
    headline: string | null
    isOnline?: boolean
  }[]
  lastMessage: {
    id: string
    content: string
    sender: {
      id: string
      name: string
      avatar: string | null
    }
    createdAt: Date
    read: boolean
  } | null
  unreadCount: number
  isOnline?: boolean
}

interface ConversationsListProps {
  conversations: ConversationData[]
  isLoading?: boolean
  selectedId?: string | null
  onSelectConversation: (conversation: ConversationData) => void
  onStartNewChat: () => void
  currentUserId?: string
}

export function ConversationsList({
  conversations,
  isLoading = false,
  selectedId,
  onSelectConversation,
  onStartNewChat,
  currentUserId,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase()
    return conv.participants.some(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.username.toLowerCase().includes(searchLower)
    )
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const d = new Date(date)
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Kemarin'
    } else if (diffDays < 7) {
      return d.toLocaleDateString('id-ID', { weekday: 'short' })
    } else {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    }
  }

  const getConversationName = (conv: ConversationData) => {
    if (conv.participants.length === 1) {
      return conv.participants[0].name
    }
    return conv.participants.map((p) => p.name).join(', ')
  }

  const getConversationAvatar = (conv: ConversationData) => {
    // For single participant, use their avatar
    if (conv.participants.length === 1) {
      return conv.participants[0].avatar
    }
    // For group, return null (will show group icon)
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold">Pesan</h2>
          <Button size="sm" variant="ghost" onClick={onStartNewChat} className="size-8 p-0">
            <Plus className="size-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari percakapan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <MessageCircle className="size-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Tidak ada percakapan ditemukan' : 'Belum ada percakapan'}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onStartNewChat}>
                Mulai Percakapan Baru
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv, index) => {
              const isSelected = selectedId === conv.id
              const hasUnread = conv.unreadCount > 0

              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => onSelectConversation(conv)}
                  className={cn(
                    'w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left',
                    isSelected && 'bg-muted'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {conv.participants.length === 1 ? (
                      <Avatar className="size-10 sm:size-12">
                        <AvatarImage src={conv.participants[0].avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                          {getInitials(conv.participants[0].name)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="size-10 sm:size-12 rounded-full bg-muted flex items-center justify-center">
                        <MessageCircle className="size-5 sm:size-6 text-muted-foreground" />
                      </div>
                    )}
                    {/* Online status indicator */}
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 size-3 sm:size-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                    {/* Unread red dot indicator */}
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 size-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">
                          {conv.unreadCount > 9 ? '9' : conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        'text-sm truncate',
                        hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                      )}>
                        {getConversationName(conv)}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-auto">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'text-xs sm:text-sm truncate',
                          hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'
                        )}
                      >
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.sender.id === currentUserId ? (
                              <span className="text-muted-foreground">Anda: </span>
                            ) : null}
                            {conv.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic">Belum ada pesan</span>
                        )}
                      </p>
                      {/* Unread indicator */}
                      {hasUnread && (
                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                          <span className="text-[10px] sm:text-xs font-bold text-red-500">belum dibaca</span>
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
