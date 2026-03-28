'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, UserPlus, UserCheck, Clock, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
  friendshipStatus: {
    status: string
    isSender: boolean
  } | null
}

interface UserSearchProps {
  onUserSelect?: (user: SearchResult) => void
  placeholder?: string
  className?: string
}

export function UserSearch({ onUserSelect, placeholder = "Search users...", className }: UserSearchProps) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const [sendingRequestId, setSendingRequestId] = React.useState<string | null>(null)
  const searchRef = React.useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers()
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchUsers = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setShowResults(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.users)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendRequest = async (userId: string) => {
    setSendingRequestId(userId)
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId }),
      })

      if (response.ok) {
        toast({ title: 'Friend request sent!' })
        // Update the local state
        setResults(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, friendshipStatus: { status: 'pending', isSender: true } }
            : user
        ))
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to send request', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send friend request', variant: 'destructive' })
    } finally {
      setSendingRequestId(null)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const renderButton = (user: SearchResult) => {
    const { friendshipStatus } = user
    
    // No friendship record - can send friend request (includes after rejection since record is deleted)
    if (!friendshipStatus) {
      return (
        <Button
          size="sm"
          onClick={() => handleSendRequest(user.id)}
          disabled={sendingRequestId === user.id}
          className="gap-1"
        >
          {sendingRequestId === user.id ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <UserPlus className="size-3" />
          )}
          Add
        </Button>
      )
    }

    if (friendshipStatus.status === 'accepted') {
      return (
        <Button size="sm" variant="outline" disabled className="gap-1">
          <UserCheck className="size-3" />
          Friends
        </Button>
      )
    }

    if (friendshipStatus.status === 'pending') {
      return (
        <Button size="sm" variant="outline" disabled className="gap-1">
          <Clock className="size-3" />
          {friendshipStatus.isSender ? 'Sent' : 'Pending'}
        </Button>
      )
    }

    // For blocked status, still show cannot connect
    if (friendshipStatus.status === 'blocked') {
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground border-muted-foreground/30">
          Blocked
        </Badge>
      )
    }

    return null
  }

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setShowResults(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {query.trim().length >= 2 ? 'No users found' : 'Type at least 2 characters'}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {results.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 cursor-pointer"
                    onClick={() => onUserSelect?.(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                          {user.headline && ` · ${user.headline}`}
                        </p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {renderButton(user)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
