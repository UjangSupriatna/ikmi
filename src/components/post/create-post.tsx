'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Smile, 
  MapPin,
  Plus,
  Users,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Common emojis for the picker
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  'Objects': ['🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
}

interface ImageWithStatus {
  id: string // unique ID
  localUrl: string // For preview (blob URL)
  serverPath: string | null // Server path after upload
  file: File
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
}

interface CreatePostProps {
  onPostCreated?: () => void
  currentUser?: {
    id: string
    name: string
    username: string
    avatar: string | null
  } | null
  groupId?: string
  groupName?: string
  placeholder?: string
}

export function CreatePost({ 
  onPostCreated, 
  currentUser, 
  groupId,
  groupName,
  placeholder = "What's on your mind?"
}: CreatePostProps) {
  const [content, setContent] = React.useState('')
  const [images, setImages] = React.useState<ImageWithStatus[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [location, setLocation] = React.useState('')
  const [showLocationInput, setShowLocationInput] = React.useState(false)
  const [emojiPopoverOpen, setEmojiPopoverOpen] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Upload a single image to server
  const uploadImageToServer = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'posts')

      console.log('Starting upload for:', file.name, 'size:', file.size)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Upload error:', error)
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      console.log('Upload success, path:', data.path)
      return data.path
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > 4) {
      toast({
        title: 'Terlalu banyak gambar',
        description: 'Maksimal 4 gambar per postingan',
        variant: 'destructive',
      })
      return
    }

    const newImages: ImageWithStatus[] = []

    // Process each file
    for (const file of Array.from(files)) {
      if (images.length + newImages.length >= 4) break
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Gambar terlalu besar',
          description: 'Ukuran gambar maksimal 5MB',
          variant: 'destructive',
        })
        continue
      }

      // Create local preview URL immediately
      const localUrl = URL.createObjectURL(file)
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      newImages.push({
        id,
        localUrl,
        serverPath: null,
        file,
        isUploading: true,
        uploadProgress: 0,
        uploadError: null,
      })
    }

    // Add images to state immediately for preview
    setImages((prev) => [...prev, ...newImages])

    // Upload each image to server sequentially
    for (let i = 0; i < newImages.length; i++) {
      const imageId = newImages[i].id
      const file = newImages[i].file

      // Update progress
      setImages((prev) => prev.map(img => 
        img.id === imageId ? { ...img, uploadProgress: 20 } : img
      ))

      try {
        const serverPath = await uploadImageToServer(file)
        
        if (serverPath) {
          // Success - update with server path
          setImages((prev) => prev.map(img => 
            img.id === imageId 
              ? { ...img, serverPath, isUploading: false, uploadProgress: 100, uploadError: null }
              : img
          ))
        } else {
          // Failed - show error
          setImages((prev) => prev.map(img => 
            img.id === imageId 
              ? { ...img, isUploading: false, uploadProgress: 0, uploadError: 'Gagal upload' }
              : img
          ))
        }
      } catch (error) {
        console.error('Upload error:', error)
        setImages((prev) => prev.map(img => 
          img.id === imageId 
            ? { ...img, isUploading: false, uploadProgress: 0, uploadError: 'Gagal upload' }
            : img
        ))
      }
    }

    // Reset input
    e.target.value = ''
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find(i => i.id === id)
      if (img) {
        URL.revokeObjectURL(img.localUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const retryUpload = async (id: string) => {
    const image = images.find(img => img.id === id)
    if (!image) return

    // Reset state for retry
    setImages((prev) => prev.map(img => 
      img.id === id 
        ? { ...img, isUploading: true, uploadProgress: 0, uploadError: null }
        : img
    ))

    try {
      const serverPath = await uploadImageToServer(image.file)
      
      if (serverPath) {
        setImages((prev) => prev.map(img => 
          img.id === id 
            ? { ...img, serverPath, isUploading: false, uploadProgress: 100, uploadError: null }
            : img
        ))
      } else {
        setImages((prev) => prev.map(img => 
          img.id === id 
            ? { ...img, isUploading: false, uploadProgress: 0, uploadError: 'Gagal upload' }
            : img
        ))
      }
    } catch (error) {
      setImages((prev) => prev.map(img => 
        img.id === id 
          ? { ...img, isUploading: false, uploadProgress: 0, uploadError: 'Gagal upload' }
          : img
      ))
    }
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + emoji + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent(prev => prev + emoji)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return
    if (isSubmitting) return

    // Check if any image is still uploading
    const hasUploadingImages = images.some(img => img.isUploading)
    if (hasUploadingImages) {
      toast({
        title: 'Tunggu sebentar',
        description: 'Ada gambar yang sedang diupload',
        variant: 'destructive',
      })
      return
    }

    // Check if any image failed to upload
    const failedImages = images.filter(img => !img.serverPath)
    if (failedImages.length > 0) {
      toast({
        title: 'Gagal mengupload gambar',
        description: 'Hapus atau retry gambar yang gagal',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Get server paths for images
      const imagePaths = images
        .filter(img => img.serverPath)
        .map(img => img.serverPath as string)

      const url = groupId ? `/api/groups/${groupId}/posts` : '/api/posts'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          images: imagePaths,
          location: location.trim() || null,
          visibility: 'public',
          ...(groupId && { groupId }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal membuat postingan')
      }

      // Cleanup blob URLs
      images.forEach(img => URL.revokeObjectURL(img.localUrl))

      setContent('')
      setImages([])
      setLocation('')
      setShowLocationInput(false)
      toast({
        title: 'Postingan dibuat',
        description: groupId ? `Diposting di ${groupName}` : 'Postingan Anda berhasil dibagikan',
      })
      onPostCreated?.()
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal membuat postingan',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.localUrl))
    }
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const uploadingCount = images.filter(img => img.isUploading).length
  const uploadedCount = images.filter(img => img.serverPath && !img.isUploading).length
  const failedCount = images.filter(img => img.uploadError && !img.isUploading).length
  const canPost = images.length > 0 ? images.every(img => img.serverPath && !img.isUploading) : content.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 border-b rounded-none shadow-none">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="size-10 flex-shrink-0">
              <AvatarImage src={currentUser?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {currentUser ? getInitials(currentUser.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {/* Group badge if posting in group */}
              {groupId && groupName && (
                <div className="mb-2">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="size-3" />
                    Posting di {groupName}
                  </Badge>
                </div>
              )}
              
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none border-0 bg-muted/50 focus-visible:ring-1 p-3"
                maxLength={5000}
              />
              
              {/* Location Input */}
              <AnimatePresence>
                {showLocationInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Tambahkan lokasi..."
                        className="flex-1 h-8 text-sm"
                        maxLength={100}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setLocation('')
                          setShowLocationInput(false)
                        }}
                      >
                        <XCircle className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Location display */}
              {location && !showLocationInput && (
                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3" />
                  <span>{location}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={() => {
                      setLocation('')
                      setShowLocationInput(false)
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )}
              
              {/* Image Preview */}
              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((image) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                        >
                          {/* Always show preview from local URL */}
                          <img
                            src={image.localUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Upload overlay with progress */}
                          {image.isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                              <Loader2 className="size-6 animate-spin text-white" />
                              <span className="text-xs text-white">Mengupload...</span>
                              <div className="w-3/4">
                                <Progress 
                                  value={image.uploadProgress} 
                                  className="h-1.5 bg-white/30" 
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Success indicator */}
                          {!image.isUploading && image.serverPath && (
                            <div className="absolute top-2 left-2 bg-green-500 rounded-full p-0.5">
                              <CheckCircle2 className="size-4 text-white" />
                            </div>
                          )}
                          
                          {/* Error state */}
                          {image.uploadError && !image.isUploading && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2">
                              <AlertCircle className="size-6 text-red-400" />
                              <span className="text-xs text-white text-center">{image.uploadError}</span>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => retryUpload(image.id)}
                              >
                                Retry
                              </Button>
                            </div>
                          )}
                          
                          {/* Remove button */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 size-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(image.id)}
                          >
                            <X className="size-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Upload status summary */}
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                      {uploadingCount > 0 && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Loader2 className="size-3 animate-spin" />
                          {uploadingCount} sedang upload...
                        </span>
                      )}
                      {uploadedCount > 0 && !uploadingCount && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="size-3" />
                          {uploadedCount} gambar siap
                        </span>
                      )}
                      {failedCount > 0 && !uploadingCount && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="size-3" />
                          {failedCount} gagal
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <label htmlFor="image-upload">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 text-muted-foreground cursor-pointer",
                        images.length >= 4 && "opacity-50 cursor-not-allowed"
                      )}
                      asChild
                    >
                      <span>
                        <ImageIcon className="size-4" />
                        <span className="text-xs hidden sm:inline">Foto</span>
                      </span>
                    </Button>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={images.length >= 4}
                  />
                  
                  {/* Emoji Picker */}
                  <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <Smile className="size-4" />
                        <span className="text-xs hidden sm:inline">Emoji</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="start">
                      <div className="space-y-2">
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <div key={category}>
                            <p className="text-xs text-muted-foreground mb-1">{category}</p>
                            <div className="grid grid-cols-8 gap-0.5">
                              {emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="size-7 flex items-center justify-center hover:bg-muted rounded text-base"
                                  onClick={() => {
                                    insertEmoji(emoji)
                                    setEmojiPopoverOpen(false)
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-muted-foreground"
                    onClick={() => setShowLocationInput(!showLocationInput)}
                  >
                    <MapPin className={cn("size-4", location && "text-primary")} />
                    <span className="text-xs hidden sm:inline">Lokasi</span>
                  </Button>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canPost}
                  className="gap-2"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-xs">Posting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      <span className="text-xs">Post</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
