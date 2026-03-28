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
  Upload,
  CheckCircle2
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
  const uploadImageToServer = async (imageIndex: number, file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'posts')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      return data.path
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (images.length + files.length > 4) {
      toast({
        title: 'Terlalu banyak gambar',
        description: 'Maksimal 4 gambar per postingan',
        variant: 'destructive',
      })
      return
    }

    const newImages: ImageWithStatus[] = []

    for (const file of Array.from(files)) {
      if (images.length + newImages.length >= 4) break
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Gambar terlalu besar',
          description: 'Ukuran gambar maksimal 10MB',
          variant: 'destructive',
        })
        continue
      }

      // Create local preview URL
      const localUrl = URL.createObjectURL(file)
      
      newImages.push({
        localUrl,
        serverPath: null,
        file,
        isUploading: true,
        uploadProgress: 0,
        uploadError: null,
      })
    }

    // Add images to state first
    setImages((prev) => [...prev, ...newImages])

    // Upload each image to server
    for (let i = 0; i < newImages.length; i++) {
      const imageIndex = images.length + i
      const file = newImages[i].file

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImages((prev) => {
          const updated = [...prev]
          if (updated[imageIndex]) {
            updated[imageIndex] = {
              ...updated[imageIndex],
              uploadProgress: Math.min(updated[imageIndex].uploadProgress + 20, 90),
            }
          }
          return updated
        })
      }, 100)

      try {
        const serverPath = await uploadImageToServer(imageIndex, file)
        
        clearInterval(progressInterval)

        setImages((prev) => {
          const updated = [...prev]
          if (updated[imageIndex]) {
            if (serverPath) {
              updated[imageIndex] = {
                ...updated[imageIndex],
                serverPath,
                isUploading: false,
                uploadProgress: 100,
                uploadError: null,
              }
            } else {
              updated[imageIndex] = {
                ...updated[imageIndex],
                isUploading: false,
                uploadProgress: 0,
                uploadError: 'Gagal mengupload gambar',
              }
            }
          }
          return updated
        })
      } catch (error) {
        clearInterval(progressInterval)
        setImages((prev) => {
          const updated = [...prev]
          if (updated[imageIndex]) {
            updated[imageIndex] = {
              ...updated[imageIndex],
              isUploading: false,
              uploadProgress: 0,
              uploadError: 'Gagal mengupload gambar',
            }
          }
          return updated
        })
      }
    }

    // Reset input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      // Revoke blob URL to prevent memory leak
      URL.revokeObjectURL(prev[index].localUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const retryUpload = async (index: number) => {
    const image = images[index]
    if (!image) return

    // Reset state for retry
    setImages((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        isUploading: true,
        uploadProgress: 0,
        uploadError: null,
      }
      return updated
    })

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImages((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            uploadProgress: Math.min(updated[index].uploadProgress + 20, 90),
          }
        }
        return updated
      })
    }, 100)

    try {
      const serverPath = await uploadImageToServer(index, image.file)
      clearInterval(progressInterval)

      setImages((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          if (serverPath) {
            updated[index] = {
              ...updated[index],
              serverPath,
              isUploading: false,
              uploadProgress: 100,
              uploadError: null,
            }
          } else {
            updated[index] = {
              ...updated[index],
              isUploading: false,
              uploadProgress: 0,
              uploadError: 'Gagal mengupload gambar',
            }
          }
        }
        return updated
      })
    } catch (error) {
      clearInterval(progressInterval)
      setImages((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            isUploading: false,
            uploadProgress: 0,
            uploadError: 'Gagal mengupload gambar',
          }
        }
        return updated
      })
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

  const allImagesUploaded = images.length > 0 && images.every(img => img.serverPath && !img.isUploading)
  const hasUploadingImages = images.some(img => img.isUploading)
  const hasFailedImages = images.some(img => img.uploadError && !img.isUploading)

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
                      {images.map((image, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                        >
                          <img
                            src={image.localUrl}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Upload overlay */}
                          {image.isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                              <Loader2 className="size-6 animate-spin text-white" />
                              <span className="text-xs text-white">Mengupload...</span>
                              <div className="w-3/4">
                                <Progress value={image.uploadProgress} className="h-1" />
                              </div>
                            </div>
                          )}
                          
                          {/* Success indicator */}
                          {!image.isUploading && image.serverPath && (
                            <div className="absolute top-1 left-1">
                              <CheckCircle2 className="size-5 text-green-500 drop-shadow-md" />
                            </div>
                          )}
                          
                          {/* Error state */}
                          {image.uploadError && !image.isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-2">
                              <span className="text-xs text-white text-center">{image.uploadError}</span>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => retryUpload(index)}
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
                            className="absolute top-1 right-1 size-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="size-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Upload status summary */}
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                      {hasUploadingImages && (
                        <span className="flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          Mengupload gambar...
                        </span>
                      )}
                      {allImagesUploaded && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="size-3" />
                          {images.length} gambar siap dipost
                        </span>
                      )}
                      {hasFailedImages && !hasUploadingImages && (
                        <span className="text-destructive">
                          Beberapa gambar gagal diupload
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
                  disabled={isSubmitting || (!content.trim() && images.length === 0) || hasUploadingImages}
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
