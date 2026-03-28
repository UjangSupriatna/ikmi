'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, Loader2, Filter, Search, Sparkles } from 'lucide-react'

import { EventCard, EventData } from './event-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface EventsListProps {
  onSelectEvent: (event: EventData) => void
  onCreateEvent: () => void
  refreshKey?: number // Add refreshKey to trigger refresh
}

const categories = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'gathering', label: 'Gathering' },
  { value: 'webinar', label: 'Webinar' },
]

export function EventsList({ onSelectEvent, onCreateEvent, refreshKey }: EventsListProps) {
  const [events, setEvents] = React.useState<EventData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [status, setStatus] = React.useState('upcoming')
  const [category, setCategory] = React.useState('all')

  const fetchEvents = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', status)
      if (category && category !== 'all') {
        params.set('category', category)
      }

      const response = await fetch(`/api/events?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status, category])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents, refreshKey]) // Add refreshKey dependency

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 sm:p-5 border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Calendar className="size-4 sm:size-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Events</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-1">
              Temukan dan ikuti event menarik di kampus
            </p>
          </div>
          <Button size="sm" onClick={onCreateEvent} className="gap-1.5 h-8 sm:h-9 shrink-0 shadow-sm">
            <Plus className="size-4" />
            <span className="hidden xs:inline sm:inline">Buat Event</span>
            <span className="xs:hidden sm:hidden">Buat</span>
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-card rounded-xl border p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Status Tabs */}
          <Tabs value={status} onValueChange={setStatus} className="w-full">
            <TabsList className="h-9 w-full sm:w-auto grid grid-cols-2 sm:grid-cols-2">
              <TabsTrigger value="upcoming" className="h-7 text-xs sm:text-sm px-3">
                Mendatang
              </TabsTrigger>
              <TabsTrigger value="completed" className="h-7 text-xs sm:text-sm px-3">
                Selesai
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 flex-1 sm:w-[180px] text-xs sm:text-sm">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs sm:text-sm">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!isLoading && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''} ditemukan
          </span>
          {events.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Sparkles className="size-3" />
              <span>{status === 'upcoming' ? 'Coming soon' : 'Completed'}</span>
            </div>
          )}
        </div>
      )}

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border overflow-hidden">
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-4">
            <Calendar className="size-8 sm:size-10 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base mb-1">Belum ada event</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-5 max-w-xs mx-auto">
            {status === 'upcoming' 
              ? 'Tidak ada event mendatang. Jadilah yang pertama membuat event!' 
              : 'Belum ada event yang selesai'}
          </p>
          {status === 'upcoming' && (
            <Button size="sm" onClick={onCreateEvent} className="gap-1.5 shadow-sm">
              <Plus className="size-4" />
              Buat Event Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard
                  event={event}
                  onSelect={onSelectEvent}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
