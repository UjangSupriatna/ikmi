'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, MapPin, Users, Clock, ArrowLeft, 
  Link2, Check, Star, X, ExternalLink, Video, Globe,
  Pencil, Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
import { useToast } from '@/hooks/use-toast'
import { useNavigationStore } from '@/stores/navigation-store'
import { cn } from '@/lib/utils'

import type { EventData } from './event-card'

interface EventDetailProps {
  event: EventData
  currentUserId?: string
  onBack: () => void
  onEdit: (event: EventData) => void
  onDelete: (eventId: string) => void
  onAttendanceChange: () => void
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

export function EventDetail({ 
  event, 
  currentUserId,
  onBack, 
  onEdit, 
  onDelete, 
  onAttendanceChange 
}: EventDetailProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [attendees, setAttendees] = React.useState<Array<{
    status: string
    user: { id: string; name: string; username: string; avatar: string | null }
  }>>([])
  const { toast } = useToast()
  const { navigate } = useNavigationStore()

  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null
  const isPast = new Date() > startDate
  const isCreator = currentUserId === event.createdBy.id

  const formatFullDate = (date: Date) => {
    return format(date, "EEEE, d MMMM yyyy", { locale: id })
  }

  const formatTimeRange = () => {
    const startTime = format(startDate, 'HH:mm', { locale: id })
    if (!endDate) return `${startTime} WIB`
    const endTime = format(endDate, 'HH:mm', { locale: id })
    return `${startTime} - ${endTime} WIB`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Fetch attendees
  React.useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const response = await fetch(`/api/events/${event.id}/attendees?status=going`)
        if (response.ok) {
          const data = await response.json()
          setAttendees(data.attendees)
        }
      } catch (error) {
        console.error('Error fetching attendees:', error)
      }
    }
    fetchAttendees()
  }, [event.id])

  const handleAttendance = async (status: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${event.id}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        onAttendanceChange()
        toast({ title: 'Status kehadiran diperbarui' })
      } else {
        const data = await response.json()
        toast({ 
          title: 'Error', 
          description: data.error || 'Gagal memperbarui status', 
          variant: 'destructive' 
        })
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Event berhasil dihapus' })
        onDelete(event.id)
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal menghapus event', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 bg-card rounded-xl border p-2 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="size-8 sm:size-9 shrink-0">
            <ArrowLeft className="size-4 sm:size-5" />
          </Button>
          <h2 className="text-base sm:text-lg font-semibold truncate">Detail Event</h2>
        </div>
        {isCreator && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(event)}
              className="h-8 sm:h-9 text-xs sm:text-sm gap-1"
            >
              <Pencil className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 sm:h-9 text-xs sm:text-sm gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Hapus</span>
            </Button>
          </div>
        )}
      </div>

      {/* Event Card */}
      <Card className="overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[16/10] sm:aspect-video bg-gradient-to-br from-muted to-muted/50">
          {event.image ? (
            <img 
              src={getDirectImageUrl(event.image)} 
              alt={event.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="size-12 sm:size-16 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground/50">No image</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Category Badge */}
          <Badge 
            variant="outline"
            className={cn(
              "absolute top-3 left-3 sm:top-4 sm:left-4 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-medium backdrop-blur-sm",
              categoryColors[event.category] || categoryColors.other
            )}
          >
            {categoryLabels[event.category] || event.category}
          </Badge>

          {/* Status Badges */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-1.5">
            {event.status === 'cancelled' && (
              <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 sm:px-2.5">
                Dibatalkan
              </Badge>
            )}
            {!event.isFree && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 sm:px-2.5 bg-amber-500/90 text-white">
                {event.price || 'Berbayar'}
              </Badge>
            )}
          </div>

          {/* Location Type Badge */}
          {event.locationType !== 'offline' && (
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 bg-background/90 text-foreground gap-1">
                {event.locationType === 'online' ? <Video className="size-2.5 sm:size-3" /> : <Globe className="size-2.5 sm:size-3" />}
                {event.locationType === 'online' ? 'Online' : 'Hybrid'}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          {/* Title & Creator */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold mb-2 leading-tight">{event.title}</h1>
            <button 
              onClick={() => navigate({ type: 'profile', userId: event.createdBy.id })}
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Avatar className="size-5 sm:size-6">
                <AvatarImage src={event.createdBy.avatar || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(event.createdBy.name)}
                </AvatarFallback>
              </Avatar>
              <span>Oleh <span className="font-medium">{event.createdBy.name}</span></span>
            </button>
          </div>

          {/* Date & Time Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Calendar className="size-3.5 sm:size-4 text-primary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Tanggal</span>
              </div>
              <p className="text-xs sm:text-sm font-medium">{formatFullDate(startDate)}</p>
              {endDate && startDate.toDateString() !== endDate.toDateString() && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  s/d {formatFullDate(endDate)}
                </p>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Clock className="size-3.5 sm:size-4 text-primary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Waktu</span>
              </div>
              <p className="text-xs sm:text-sm font-medium">{formatTimeRange()}</p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="size-4 sm:size-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium">{event.location}</p>
                  <Badge variant="outline" className="mt-1.5 text-[10px] sm:text-xs">
                    {event.locationType === 'online' ? 'Online' : 
                     event.locationType === 'hybrid' ? 'Hybrid' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Online URL */}
          {event.onlineUrl && (
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Link2 className="size-4 sm:size-5 text-cyan-600 shrink-0" />
                <a 
                  href={event.onlineUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-cyan-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Buka Link Event <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}

          {/* Attendees */}
          <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <Users className="size-4 sm:size-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium">
                  {event.attendeesCount} orang akan hadir
                  {event.maxAttendees && <span className="text-muted-foreground"> / {event.maxAttendees} maks</span>}
                </p>
                {attendees.length > 0 && (
                  <div className="flex -space-x-2 mt-2">
                    {attendees.slice(0, 5).map((a) => (
                      <Avatar key={a.user.id} className="size-6 sm:size-7 border-2 border-background">
                        <AvatarImage src={a.user.avatar || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(a.user.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {attendees.length > 5 && (
                      <div className="size-6 sm:size-7 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs border-2 border-background font-medium">
                        +{attendees.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-2">Deskripsi</h3>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            {event.status !== 'cancelled' && !isPast && (
              <div className="flex gap-2">
                <Button
                  variant={event.userAttendance === 'going' ? 'default' : 'outline'}
                  className="flex-1 gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                  onClick={() => handleAttendance('going')}
                  disabled={isUpdating}
                >
                  <Check className="size-3.5 sm:size-4" />
                  <span>Hadir</span>
                </Button>
                <Button
                  variant={event.userAttendance === 'interested' ? 'default' : 'outline'}
                  className="flex-1 gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                  onClick={() => handleAttendance('interested')}
                  disabled={isUpdating}
                >
                  <Star className="size-3.5 sm:size-4" />
                  <span>Tertarik</span>
                </Button>
                {event.userAttendance && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 sm:size-10 shrink-0"
                    onClick={() => handleAttendance('not_going')}
                    disabled={isUpdating}
                    title="Tidak hadir"
                  >
                    <X className="size-3.5 sm:size-4" />
                  </Button>
                )}
              </div>
            )}
            
            {isPast && (
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Event ini sudah selesai
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Event</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus event ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
