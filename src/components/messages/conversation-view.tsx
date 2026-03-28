'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Image as ImageIcon, Loader2, RefreshCw, MoreVertical, Trash2, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageBubble } from './message-bubble'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MessageData {
  id: string
  content: string
  images: string[]
  sender: {
    id: string
    name: string
    username?: string
    avatar: string | null
  }
  createdAt: Date
  read: boolean
  isOwn: boolean
}

interface ParticipantData {
  id: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
}

interface ConversationViewProps {
  conversation: {
    id: string
    createdAt: Date
    updatedAt: Date
    participants: ParticipantData[]
  }
  messages: MessageData[]
  currentUserId?: string
  isLoading?: boolean
  isSending?: boolean
  onBack: () => void
  onSendMessage: (content: string, images?: string[]) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  onClearChat?: () => Promise<void> | void
  onViewProfile?: (userId: string) => void
}

export function ConversationView({
  conversation,
  messages,
  currentUserId,
  isLoading = false,
  isSending = false,
  onBack,
  onSendMessage,
  onRefresh,
  isRefreshing = false,
  onClearChat,
  onViewProfile,
}: ConversationViewProps) {
  const [messageInput, setMessageInput] = React.useState('')
  const [showClearDialog, setShowClearDialog] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Get conversation display name
  const conversationName = conversation.participants.length === 1
    ? conversation.participants[0].name
    : conversation.participants.map((p) => p.name).join(', ')

  const conversationAvatar = conversation.participants.length === 1
    ? conversation.participants[0].avatar
    : null
  
  const otherUser = conversation.participants[0]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!messageInput.trim() || isSending) return
    onSendMessage(messageInput.trim())
    setMessageInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = async () => {
    try {
      await onClearChat?.()
    } catch (error) {
      console.error('Failed to clear chat:', error)
    } finally {
      setShowClearDialog(false)
    }
  }

  // Group messages by date
  const groupMessagesByDate = (msgs: MessageData[]) => {
    const groups: { date: string; messages: MessageData[] }[] = []
    let currentDate = ''

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="size-9 shrink-0 md:hidden">
          <ArrowLeft className="size-5" />
        </Button>

        <Avatar className="size-10 shrink-0">
          <AvatarImage src={conversationAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {conversation.participants.length === 1
              ? getInitials(conversation.participants[0].name)
              : conversationName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{conversationName}</h3>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh Button */}
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-9" 
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("size-5", isRefreshing && "animate-spin")} />
            </Button>
          )}
          
          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewProfile?.(otherUser.id)}>
                <User className="size-4 mr-2" />
                Lihat Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowClearDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Hapus Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesan akan dihapus hanya untuk Anda. Lawan chat tetap bisa melihat pesan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleClearChat()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Messages - flex-1 with overflow */}
      <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Belum ada pesan. Mulai percakapan!
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messageGroups.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                      {group.date}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-2">
                    {group.messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        {...msg}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Input - Fixed at bottom, always visible */}
      <div className="p-3 border-t bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            disabled={isSending}
          >
            <ImageIcon className="size-5 text-muted-foreground" />
          </Button>

          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            disabled={isSending}
            className="flex-1 h-10"
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageInput.trim() || isSending}
            className="size-10 shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
