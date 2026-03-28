'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  id: string
  content: string
  images?: string[]
  sender: {
    id: string
    name: string
    username?: string
    avatar: string | null
  }
  createdAt: Date
  read?: boolean
  isOwn: boolean
  showAvatar?: boolean
}

export function MessageBubble({
  content,
  images = [],
  createdAt,
  read = false,
  isOwn,
}: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-1 max-w-[80%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Message Content */}
      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          {/* Text content */}
          {content && (
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          )}

          {/* Images */}
          {images && images.length > 0 && (
            <div className={cn('mt-2 grid gap-1', images.length > 1 && 'grid-cols-2')}>
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(img, '_blank')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Time and read status */}
        <div className={cn('flex items-center gap-1 px-1', isOwn && 'flex-row-reverse')}>
          <span className="text-[10px] text-muted-foreground">
            {formatTime(createdAt)}
          </span>
          {isOwn && (
            <span className="text-muted-foreground">
              {read ? (
                <CheckCheck className="size-3 text-primary" />
              ) : (
                <Check className="size-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
