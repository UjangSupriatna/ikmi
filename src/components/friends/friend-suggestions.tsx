'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FriendCard, FriendCardUser } from './friend-card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SuggestedFriend extends FriendCardUser {
  mutualFriendsCount: number
}

interface FriendSuggestionsProps {
  className?: string
  limit?: number
}

export function FriendSuggestions({ className, limit = 5 }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/suggestions')
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      const data = await response.json()
      setSuggestions(data.suggestions.slice(0, limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = async (userId: string) => {
    setPendingRequests(prev => new Set(prev).add(userId))
    
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId: userId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send request')
      }

      // Update the suggestion to show "pending" state
      setSuggestions(prev =>
        prev.map(s =>
          s.id === userId ? { ...s, _status: 'pending' } : s
        )
      )
    } catch (err) {
      console.error('Add friend error:', err)
      throw err
    } finally {
      setPendingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const renderLoading = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderEmpty = () => (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center">
        <Users className="size-10 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="font-medium text-muted-foreground mb-1">No suggestions</h3>
        <p className="text-sm text-muted-foreground/70">
          We'll suggest people you may know here
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 sm:size-5 text-primary" />
          <h2 className="text-base sm:text-xl font-semibold text-foreground">
            People You May Know
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 w-8 p-0"
          onClick={fetchSuggestions}
          disabled={isLoading}
        >
          <RefreshCw className={cn('size-3.5 sm:size-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        renderLoading()
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchSuggestions}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : suggestions.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <FriendCard
                  user={suggestion}
                  friendshipStatus={(suggestion as any)._status === 'pending' ? 'pending_sent' : 'none'}
                  onAddFriend={() => handleAddFriend(suggestion.id)}
                  showMutualFriends={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
