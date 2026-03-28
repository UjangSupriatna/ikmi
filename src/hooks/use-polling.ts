'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UsePollingOptions {
  interval?: number // Polling interval in milliseconds (default: 3000)
  enabled?: boolean // Whether polling is enabled
  onPoll: () => Promise<void> | void // Function to call on each poll
}

/**
 * A simple polling hook that calls a function at regular intervals.
 * Used for real-time updates without WebSocket/Socket.io
 */
export function usePolling({
  interval = 3000,
  enabled = true,
  onPoll,
}: UsePollingOptions) {
  const onPollRef = useRef(onPoll)
  
  // Keep the callback ref up to date
  useEffect(() => {
    onPollRef.current = onPoll
  }, [onPoll])
  
  useEffect(() => {
    if (!enabled) return
    
    const poll = async () => {
      try {
        await onPollRef.current()
      } catch (error) {
        console.error('[Polling] Error:', error)
      }
    }
    
    // Initial poll
    poll()
    
    // Set up interval
    const intervalId = setInterval(poll, interval)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [interval, enabled])
}

/**
 * Hook for polling messages in a conversation
 */
export function useMessagePolling({
  conversationId,
  enabled = true,
  interval = 2000,
  onNewMessages,
}: {
  conversationId: string | null
  enabled?: boolean
  interval?: number
  onNewMessages: (messages: any[]) => void
}) {
  const onNewMessagesRef = useRef(onNewMessages)
  const lastMessageIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    onNewMessagesRef.current = onNewMessages
  }, [onNewMessages])
  
  useEffect(() => {
    if (!conversationId || !enabled) return
    
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          const messages = data.messages || []
          
          // Check if there are new messages
          if (messages.length > 0) {
            const latestMessageId = messages[messages.length - 1].id
            if (latestMessageId !== lastMessageIdRef.current) {
              lastMessageIdRef.current = latestMessageId
              onNewMessagesRef.current(messages)
            }
          }
        }
      } catch (error) {
        console.error('[MessagePolling] Error fetching messages:', error)
      }
    }
    
    // Initial fetch
    fetchMessages()
    
    // Set up polling
    const intervalId = setInterval(fetchMessages, interval)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [conversationId, enabled, interval])
}

/**
 * Hook for polling conversations list
 */
export function useConversationsPolling({
  enabled = true,
  interval = 5000,
  onUpdate,
}: {
  enabled?: boolean
  interval?: number
  onUpdate: (data: { conversations: any[]; totalUnread: number }) => void
}) {
  const onUpdateRef = useRef(onUpdate)
  
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])
  
  useEffect(() => {
    if (!enabled) return
    
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages')
        if (response.ok) {
          const data = await response.json()
          onUpdateRef.current({
            conversations: data.conversations || [],
            totalUnread: data.totalUnread || 0,
          })
        }
      } catch (error) {
        console.error('[ConversationsPolling] Error:', error)
      }
    }
    
    // Initial fetch
    fetchConversations()
    
    // Set up polling
    const intervalId = setInterval(fetchConversations, interval)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, interval])
}
