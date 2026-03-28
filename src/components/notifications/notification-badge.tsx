'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
  showZero?: boolean
}

export function NotificationBadge({ 
  count, 
  className,
  showZero = false 
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) return null

  // Format count for display (e.g., 99+ for large numbers)
  const displayCount = count > 99 ? '99+' : count

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30 
        }}
      >
        <Badge
          variant="default"
          className={cn(
            'h-5 min-w-5 px-1.5 text-xs font-semibold',
            'bg-red-500 hover:bg-red-600 text-white border-transparent',
            'flex items-center justify-center',
            className
          )}
        >
          {displayCount}
        </Badge>
      </motion.div>
    </AnimatePresence>
  )
}
