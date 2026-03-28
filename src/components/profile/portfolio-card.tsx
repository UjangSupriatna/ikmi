'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Pencil, Trash2, FolderOpen } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Helper function to convert Google Drive share links to direct image URLs
function getDirectImageUrl(url: string): string {
  if (!url) return url
  
  // Handle Google Drive share links
  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Use thumbnail endpoint which works better for embedding
  const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (googleDriveMatch) {
    // Try the thumbnail endpoint - more reliable for embedding
    return `https://drive.google.com/thumbnail?id=${googleDriveMatch[1]}&sz=w1000`
  }
  
  // Handle Google Drive open links
  const googleDriveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (googleDriveOpenMatch) {
    return `https://drive.google.com/thumbnail?id=${googleDriveOpenMatch[1]}&sz=w1000`
  }
  
  return url
}

// Check if URL is a Google Drive link
function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com')
}

interface PortfolioCardProps {
  id: string
  title: string
  description: string | null
  link: string | null
  images: string[] | string | null
  technologies: string[] | string | null
  isOwnProfile: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export function PortfolioCard({
  id,
  title,
  description,
  link,
  images,
  technologies,
  isOwnProfile,
  onEdit,
  onDelete,
  className,
}: PortfolioCardProps) {
  // Parse images and technologies - handle both array and JSON string formats
  const imageList: string[] = React.useMemo(() => {
    let imagesArray: string[] = []
    if (Array.isArray(images)) {
      imagesArray = images
    } else {
      try {
        imagesArray = images ? JSON.parse(images) : []
      } catch {
        imagesArray = []
      }
    }
    // Convert Google Drive links to direct image URLs
    return imagesArray.map(getDirectImageUrl)
  }, [images])

  const techList: string[] = React.useMemo(() => {
    if (Array.isArray(technologies)) return technologies
    try {
      return technologies ? JSON.parse(technologies) : []
    } catch {
      return []
    }
  }, [technologies])

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [imageError, setImageError] = React.useState(false)
  const hasImages = imageList.length > 0
  
  // Get original URL for fallback link
  const originalUrls: string[] = React.useMemo(() => {
    if (Array.isArray(images)) return images
    try {
      return images ? JSON.parse(images) : []
    } catch {
      return []
    }
  }, [images])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={className}
    >
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
        {/* Image Section */}
        <div className="relative aspect-video bg-muted">
          {hasImages && !imageError ? (
            <>
              <img
                src={imageList[currentImageIndex]}
                alt={title}
                className="w-full h-full object-cover"
                onError={() => {
                  // Fallback if image fails to load
                  setImageError(true)
                }}
              />
              {imageList.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {imageList.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'size-2 rounded-full transition-colors',
                        index === currentImageIndex
                          ? 'bg-white'
                          : 'bg-white/50 hover:bg-white/75'
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : hasImages && imageError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
              <FolderOpen className="size-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground text-center">Gambar tidak dapat dimuat</p>
              {originalUrls[currentImageIndex] && (
                <a
                  href={originalUrls[currentImageIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Buka di Google Drive
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <FolderOpen className="size-12 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{title}</h3>
            {isOwnProfile && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => onEdit?.(id)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete?.(id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex flex-col items-start gap-3 pt-0">
          {/* Technologies */}
          {techList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {techList.slice(0, 4).map((tech, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-normal bg-primary/10 text-primary"
                >
                  {tech}
                </Badge>
              ))}
              {techList.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{techList.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Link */}
          {link && (
            <a
              href={link.startsWith('http') ? link : `https://${link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              View Project
            </a>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Portfolio Grid Component
interface PortfolioGridProps {
  portfolios: Array<{
    id: string
    title: string
    description: string | null
    link: string | null
    images: string[] | string | null
    technologies: string[] | string | null
  }>
  isOwnProfile: boolean
  onAdd?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export function PortfolioGrid({
  portfolios,
  isOwnProfile,
  onAdd,
  onEdit,
  onDelete,
  className,
}: PortfolioGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        {isOwnProfile && (
          <Button size="sm" onClick={onAdd} className="gap-2">
            <ExternalLink className="size-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Grid */}
      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No portfolio projects yet</p>
            {isOwnProfile && (
              <Button variant="outline" onClick={onAdd} className="mt-4 gap-2">
                <ExternalLink className="size-4" />
                Add your first project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              {...portfolio}
              isOwnProfile={isOwnProfile}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
