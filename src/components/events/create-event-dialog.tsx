'use client'

import * as React from 'react'
import { Loader2, Calendar, MapPin, Link2, Video, Globe, Pencil } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import type { EventData } from './event-card'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated: () => void
  eventToEdit?: EventData | null
}

const categories = [
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'gathering', label: 'Gathering' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Lainnya' },
]

export function CreateEventDialog({ 
  open, 
  onOpenChange, 
  onEventCreated,
  eventToEdit 
}: CreateEventDialogProps) {
  const isEditMode = !!eventToEdit
  
  const getInitialFormData = () => {
    if (eventToEdit) {
      const startDate = new Date(eventToEdit.startDate)
      const endDate = eventToEdit.endDate ? new Date(eventToEdit.endDate) : null
      return {
        title: eventToEdit.title,
        description: eventToEdit.description || '',
        image: eventToEdit.image || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        endTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
        location: eventToEdit.location || '',
        locationType: eventToEdit.locationType || 'offline',
        onlineUrl: eventToEdit.onlineUrl || '',
        category: eventToEdit.category || 'seminar',
        maxAttendees: eventToEdit.maxAttendees?.toString() || '',
        isFree: eventToEdit.isFree,
        price: eventToEdit.price || '',
      }
    }
    return {
      title: '',
      description: '',
      image: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      locationType: 'offline',
      onlineUrl: '',
      category: 'seminar',
      maxAttendees: '',
      isFree: true,
      price: '',
    }
  }
  
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState(getInitialFormData)
  const { toast } = useToast()

  // Reset form when dialog opens/closes or eventToEdit changes
  React.useEffect(() => {
    if (open) {
      setFormData(getInitialFormData())
    }
  }, [open, eventToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.startDate || !formData.startTime) {
      toast({ 
        title: 'Error', 
        description: 'Judul, tanggal dan waktu mulai wajib diisi', 
        variant: 'destructive' 
      })
      return
    }

    setIsLoading(true)
    try {
      const startDate = new Date(`${formData.startDate}T${formData.startTime}`)
      let endDate = null
      if (formData.endDate && formData.endTime) {
        endDate = new Date(`${formData.endDate}T${formData.endTime}`)
      }

      const url = isEditMode ? `/api/events/${eventToEdit.id}` : '/api/events'
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          image: formData.image || null,
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString() || null,
          location: formData.location || null,
          locationType: formData.locationType,
          onlineUrl: formData.onlineUrl || null,
          category: formData.category,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
          isFree: formData.isFree,
          price: formData.price || null,
        })
      })

      if (response.ok) {
        toast({ title: isEditMode ? 'Event berhasil diperbarui!' : 'Event berhasil dibuat!' })
        setFormData({
          title: '',
          description: '',
          image: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          location: '',
          locationType: 'offline',
          onlineUrl: '',
          category: 'seminar',
          maxAttendees: '',
          isFree: true,
          price: '',
        })
        onEventCreated()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast({ 
          title: 'Error', 
          description: data.error || `Gagal ${isEditMode ? 'memperbarui' : 'membuat'} event`, 
          variant: 'destructive' 
        })
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const locationTypeIcon = {
    offline: <MapPin className="size-3.5" />,
    online: <Video className="size-3.5" />,
    hybrid: <Globe className="size-3.5" />,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              {isEditMode ? (
                <Pencil className="size-4 sm:size-5 text-primary" />
              ) : (
                <Calendar className="size-4 sm:size-5 text-primary" />
              )}
            </div>
            {isEditMode ? 'Edit Event' : 'Buat Event Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEditMode ? 'Perbarui informasi event' : 'Buat event untuk komunitas IKMI'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs sm:text-sm">Judul Event *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nama event"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs sm:text-sm">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi event..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="image" className="text-xs sm:text-sm">URL Poster/Gambar</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://..."
              className="h-9 sm:h-10 text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Gunakan URL gambar langsung (.jpg, .png). Google Drive mungkin tidak dapat ditampilkan.
            </p>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs sm:text-sm">Tanggal Mulai *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-xs sm:text-sm">Waktu Mulai *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs sm:text-sm">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-xs sm:text-sm">Waktu Selesai</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Kategori</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-sm">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Type */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Tipe Lokasi</Label>
            <Select 
              value={formData.locationType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, locationType: value }))}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <span className="flex items-center gap-2">
                  {locationTypeIcon[formData.locationType as keyof typeof locationTypeIcon]}
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline" className="text-sm">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5" /> Offline
                  </span>
                </SelectItem>
                <SelectItem value="online" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Video className="size-3.5" /> Online
                  </span>
                </SelectItem>
                <SelectItem value="hybrid" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Globe className="size-3.5" /> Hybrid
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          {(formData.locationType === 'offline' || formData.locationType === 'hybrid') && (
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs sm:text-sm flex items-center gap-1.5">
                <MapPin className="size-3" /> Lokasi
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Nama gedung/ruangan"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          )}

          {/* Online URL */}
          {(formData.locationType === 'online' || formData.locationType === 'hybrid') && (
            <div className="space-y-1.5">
              <Label htmlFor="onlineUrl" className="text-xs sm:text-sm flex items-center gap-1.5">
                <Link2 className="size-3" /> Link Online
              </Label>
              <Input
                id="onlineUrl"
                value={formData.onlineUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, onlineUrl: e.target.value }))}
                placeholder="Zoom/Meet link"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          )}

          {/* Max Attendees */}
          <div className="space-y-1.5">
            <Label htmlFor="maxAttendees" className="text-xs sm:text-sm">
              Maksimal Peserta <span className="text-muted-foreground">(kosongkan jika unlimited)</span>
            </Label>
            <Input
              id="maxAttendees"
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))}
              placeholder="100"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* Price */}
          <div className="space-y-2 sm:space-y-3 bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="isFree" className="text-xs sm:text-sm font-medium">Gratis</Label>
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFree: checked }))}
              />
            </div>
            {!formData.isFree && (
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs sm:text-sm">Harga</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Rp 50.000"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 sm:h-10 text-sm"
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="h-9 sm:h-10 text-sm gap-1.5">
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isEditMode ? 'Simpan Perubahan' : 'Buat Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
