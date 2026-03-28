'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Send, Inbox, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FriendRequestItem, FriendRequestUser } from './friend-request-item'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface IncomingRequest {
  id: string
  from: FriendRequestUser
  createdAt: string | Date
}

interface OutgoingRequest {
  id: string
  to: FriendRequestUser
  createdAt: string | Date
}

interface FriendRequestsProps {
  className?: string
}

export function FriendRequests({ className }: FriendRequestsProps) {
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOutgoing, setShowOutgoing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/requests')
      if (!response.ok) {
        throw new Error('Failed to fetch friend requests')
      }
      const data = await response.json()
      setIncomingRequests(data.incoming)
      setOutgoingRequests(data.outgoing)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (id: string) => {
    const response = await fetch(`/api/friends/requests/${id}/accept`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error('Failed to accept request')
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== id))
  }

  const handleReject = async (id: string) => {
    const response = await fetch(`/api/friends/requests/${id}/reject`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error('Failed to reject request')
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== id))
  }

  const handleCancel = async (id: string) => {
    const response = await fetch(`/api/friends/requests/${id}/reject`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error('Failed to cancel request')
    }
    setOutgoingRequests(prev => prev.filter(r => r.id !== id))
  }

  const renderLoading = () => (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderEmptyIncoming = () => (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center">
        <Inbox className="size-10 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="font-medium text-muted-foreground mb-1">No pending requests</h3>
        <p className="text-sm text-muted-foreground/70">
          When someone sends you a friend request, it will appear here
        </p>
      </CardContent>
    </Card>
  )

  const renderEmptyOutgoing = () => (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center">
        <Send className="size-10 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="font-medium text-muted-foreground mb-1">No sent requests</h3>
        <p className="text-sm text-muted-foreground/70">
          Your pending friend requests will appear here
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      {/* Incoming Requests Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <UserPlus className="size-4 sm:size-5 text-primary" />
          <h2 className="text-base sm:text-xl font-semibold text-foreground">
            Friend Requests
          </h2>
          {!isLoading && incomingRequests.length > 0 && (
            <Badge className="bg-teal-600 text-white ml-1 sm:ml-2 text-xs">
              {incomingRequests.length}
            </Badge>
          )}
        </div>

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
                onClick={fetchRequests}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : incomingRequests.length === 0 ? (
          renderEmptyIncoming()
        ) : (
          <div className="space-y-2 sm:space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            <AnimatePresence>
              {incomingRequests.map(request => (
                <FriendRequestItem
                  key={request.id}
                  id={request.id}
                  user={request.from}
                  createdAt={request.createdAt}
                  type="incoming"
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Outgoing Requests Section */}
      <div>
        <Button
          variant="ghost"
          className="w-full justify-between mb-2 sm:mb-4 hover:bg-accent h-9 sm:h-10"
          onClick={() => setShowOutgoing(!showOutgoing)}
        >
          <div className="flex items-center gap-2">
            <Send className="size-3.5 sm:size-4 text-muted-foreground" />
            <span className="font-medium text-sm sm:text-base text-foreground">Sent Requests</span>
            {!isLoading && outgoingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                {outgoingRequests.length}
              </Badge>
            )}
          </div>
          {showOutgoing ? (
            <ChevronUp className="size-3.5 sm:size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 sm:size-4 text-muted-foreground" />
          )}
        </Button>

        <AnimatePresence>
          {showOutgoing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {isLoading ? (
                renderLoading()
              ) : outgoingRequests.length === 0 ? (
                renderEmptyOutgoing()
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {outgoingRequests.map(request => (
                      <FriendRequestItem
                        key={request.id}
                        id={request.id}
                        user={request.to}
                        createdAt={request.createdAt}
                        type="outgoing"
                        onCancel={handleCancel}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
