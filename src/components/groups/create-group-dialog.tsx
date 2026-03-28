'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Image as ImageIcon, X, Globe, Lock } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated?: (group: unknown) => void
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [privacy, setPrivacy] = React.useState<'public' | 'private'>('public')
  const [coverImage, setCoverImage] = React.useState<string | null>(null)
  const [avatar, setAvatar] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { toast } = useToast()

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'cover' | 'avatar'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (type === 'cover') {
        setCoverImage(result)
      } else {
        setAvatar(result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (type: 'cover' | 'avatar') => {
    if (type === 'cover') {
      setCoverImage(null)
    } else {
      setAvatar(null)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Group name is required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          privacy,
          coverImage,
          avatar,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create group')
      }

      const group = await response.json()
      toast({
        title: 'Group created',
        description: `"${group.name}" has been created successfully`,
      })

      // Reset form
      setName('')
      setDescription('')
      setPrivacy('public')
      setCoverImage(null)
      setAvatar(null)
      
      onGroupCreated?.(group)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating group:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create group',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buat Group Baru</DialogTitle>
          <DialogDescription>
            Buat group untuk terhubung dengan orang lain yang memiliki minat sama.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Group Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatar ? (
                <div className="relative size-20 rounded-full overflow-hidden">
                  <img
                    src={avatar}
                    alt="Group avatar"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage('avatar')}
                    className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <label className="size-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                  />
                  <ImageIcon className="size-6 text-muted-foreground" />
                </label>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="name">Nama Group *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama group"
                maxLength={100}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {name.length}/100 karakter
              </p>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverImage ? (
              <div className="relative h-32 rounded-lg overflow-hidden">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage('cover')}
                  className="absolute top-2 right-2 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'cover')}
                />
                <ImageIcon className="size-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Klik untuk upload cover
                </span>
              </label>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group ini tentang apa?"
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 karakter
            </p>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <Label>Privasi</Label>
            <RadioGroup
              value={privacy}
              onValueChange={(value) => setPrivacy(value as 'public' | 'private')}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <label
                  htmlFor="public"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Globe className="size-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Publik</p>
                    <p className="text-xs text-muted-foreground">
                      Semua orang bisa join
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <label
                  htmlFor="private"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="size-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Private</p>
                    <p className="text-xs text-muted-foreground">
                      Hanya undangan
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Membuat...
              </>
            ) : (
              'Buat Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
