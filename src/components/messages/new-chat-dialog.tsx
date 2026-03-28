'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface FriendData {
  id: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
}

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  friends: FriendData[]
  isLoading?: boolean
  onStartConversation: (friendId: string) => void
}

export function NewChatDialog({
  open,
  onOpenChange,
  friends,
  isLoading = false,
  onStartConversation,
}: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredFriends = friends.filter((friend) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      friend.name.toLowerCase().includes(searchLower) ||
      friend.username.toLowerCase().includes(searchLower)
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

  const handleSelectFriend = (friendId: string) => {
    onStartConversation(friendId)
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pesan Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari teman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Friends List */}
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="size-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Tidak ada teman ditemukan' : 'Belum ada teman'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((friend, index) => (
                  <motion.button
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => handleSelectFriend(friend.id)}
                    className={cn(
                      'w-full p-2 flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors text-left'
                    )}
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.name}</p>
                      {friend.headline && (
                        <p className="text-xs text-muted-foreground truncate">
                          {friend.headline}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
