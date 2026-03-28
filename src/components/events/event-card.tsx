'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Clock, Video, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Helper function to convert Google Drive share links to direct image URLs
function getDirectImageUrl(url: string): string {
  if (!url) return url
  
  const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (googleDriveMatch) {
    return `https://drive.google.com/thumbnail?id=${googleDriveMatch[1]}&sz=w1000`
  }
  
  const googleDriveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (googleDriveOpenMatch) {
    return `https://drive.google.com/thumbnail?id=${googleDriveOpenMatch[1]}&sz=w1000`
  }
  
  return url
}

export interface EventData {
  id: string
  title: string
  description: string | null
  image: string | null
  startDate: Date | string
  endDate: Date | string | null
  location: string | null
  locationType: string
  onlineUrl: string | null
  category: string
  maxAttendees: number | null
  isFree: boolean
  price: string | null
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: {
    id: string
    name: string
    username: string
    avatar: string | null
  }
  userAttendance: string | null
  attendeesCount: number
}

interface EventCardProps {
  event: EventData
  onSelect: (event: EventData) => void
}

const categoryLabels: Record<string, string> = {
  seminar: 'Seminar',
  workshop: 'Workshop',
  competition: 'Competition',
  gathering: 'Gathering',
  webinar: 'Webinar',
  other: 'Lainnya',
}

const categoryColors: Record<string, string> = {
  seminar: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/20',
  workshop: 'bg-green-500/15 text-green-500 dark:text-green-400 border-green-500/20',
  competition: 'bg-orange-500/15 text-orange-500 dark:text-orange-400 border-orange-500/20',
  gathering: 'bg-purple-500/15 text-purple-500 dark:text-purple-400 border-purple-500/20',
  webinar: 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border-cyan-500/20',
  other: 'bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/20',
}

const locationTypeIcons: Record<string, React.ReactNode> = {
  online: <Video className="size-3" />,
  offline: <MapPin className="size-3" />,
  hybrid: <Video className="size-3" />,
}

export function EventCard({ event, onSelect }: EventCardProps) {
  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null

  const formatDateRange = () => {
    const start = format(startDate, 'd MMM', { locale: id })
    if (!endDate) return start
    const end = format(endDate, 'd MMM', { locale: id })
    if (start === end) return start
    return `${start} - ${end}`
  }

  const formatTimeRange = () => {
    const startTime = format(startDate, 'HH:mm', { locale: id })
    if (!endDate) return startTime
    const endTime = format(endDate, 'HH:mm', { locale: id })
    return `${startTime}-${endTime}`
  }

  const formatDay = () => {
    return format(startDate, 'EEE', { locale: id })
  }

  const formatDayNum = () => {
    return format(startDate, 'd', { locale: id })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isPast = new Date() > startDate
  const isOnline = event.locationType === 'online'

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 group",
        isPast && "opacity-70"
      )}
      onClick={() => onSelect(event)}
    >
      {/* Event Image or Date Card */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-muted to-muted/50">
        {event.image ? (
          <>
            <img
              src={getDirectImageUrl(event.image)}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.classList.add('flex', 'items-center', 'justify-center')
                }
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            {/* Date Card Design */}
            <div className="flex flex-col items-center bg-card rounded-lg shadow-sm border p-2 sm:p-3">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">
                {formatDay()}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {formatDayNum()}
              </span>
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <Badge 
          variant="outline"
          className={cn(
            "absolute top-2 left-2 text-[10px] sm:text-xs px-2 py-0.5 font-medium backdrop-blur-sm",
            categoryColors[event.category] || categoryColors.other
          )}
        >
          {categoryLabels[event.category] || event.category}
        </Badge>

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {event.status === 'cancelled' && (
            <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 py-0.5">
              Dibatalkan
            </Badge>
          )}
          {!event.isFree && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5 bg-amber-500/80 text-white">
              {event.price || 'Berbayar'}
            </Badge>
          )}
        </div>

        {/* Attendance Status */}
        {event.userAttendance && (
          <div className="absolute bottom-2 left-2">
            <Badge 
              variant="secondary"
              className={cn(
                "text-[10px] sm:text-xs px-2 py-0.5 backdrop-blur-sm",
                event.userAttendance === 'going' && "bg-green-500/90 text-white",
                event.userAttendance === 'interested' && "bg-amber-500/90 text-white",
                event.userAttendance === 'not_going' && "bg-gray-500/90 text-white"
              )}
            >
              {event.userAttendance === 'going' && '✓ Hadir'}
              {event.userAttendance === 'interested' && '★ Tertarik'}
              {event.userAttendance === 'not_going' && '✗ Tidak Hadir'}
            </Badge>
          </div>
        )}

        {/* Online Badge */}
        {isOnline && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5 bg-cyan-500/90 text-white gap-1">
              <Video className="size-2.5" />
              Online
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Date & Time Row */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3 text-primary/70" />
            <span>{formatDateRange()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3 text-primary/70" />
            <span>{formatTimeRange()}</span>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            {locationTypeIcons[event.locationType]}
            <span className="truncate">
              {isOnline ? 'Online Event' : event.location}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t">
          {/* Creator */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="size-6 sm:size-7 shrink-0">
              <AvatarImage src={event.createdBy.avatar || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(event.createdBy.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {event.createdBy.name}
            </span>
          </div>

          {/* Attendees */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Users className="size-3.5 text-primary/70" />
            <span className="font-medium">{event.attendeesCount}</span>
            {event.maxAttendees && (
              <span className="text-[10px] text-muted-foreground/70">
                /{event.maxAttendees}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
