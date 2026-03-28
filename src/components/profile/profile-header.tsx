'use client'

import { motion } from 'framer-motion'
import { MapPin, Calendar, Link as LinkIcon, Edit2, UserPlus, MessageCircle } from 'lucide-react'
import Image from 'next/image'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  user: {
    id: string
    name: string
    username: string
    avatar: string | null
    coverPhoto: string | null
    bio: string | null
    headline: string | null
    address: string | null
    website: string | null
    skills: string | null
    createdAt: Date
  }
  isOwnProfile: boolean
  friendshipStatus?: {
    status: string
    isSender: boolean
  } | null
  onEditProfile?: () => void
  onAddFriend?: () => void
  onMessage?: () => void
}

export function ProfileHeader({
  user,
  isOwnProfile,
  friendshipStatus,
  onEditProfile,
  onAddFriend,
  onMessage,
}: ProfileHeaderProps) {
  // Parse skills from JSON
  let skills: string[] = []
  try {
    skills = user.skills ? JSON.parse(user.skills) : []
  } catch {
    skills = []
  }

  // Format join date
  const joinDate = new Date(user.createdAt)
  const formattedJoinDate = joinDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Get initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
        {user.coverPhoto && (
          <Image
            src={user.coverPhoto}
            alt="Cover photo"
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Profile Info Section */}
      <CardContent className="relative px-4 sm:px-6 pb-6">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute -top-12 sm:-top-14 md:-top-16 left-4 sm:left-6"
        >
          <Avatar className="size-20 sm:size-24 md:size-28 border-4 border-background shadow-xl">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-lg sm:text-xl md:text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-2 sm:pt-3 gap-2">
          {isOwnProfile ? (
            <Button onClick={onEditProfile} variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9">
              <Edit2 className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Edit Profil</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          ) : (
            <>
              {friendshipStatus?.status === 'accepted' ? (
                <Button variant="outline" size="sm" disabled className="gap-1.5 h-8 sm:h-9">
                  <UserPlus className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Teman</span>
                </Button>
              ) : friendshipStatus?.status === 'pending' ? (
                <Button variant="outline" size="sm" disabled className="gap-1.5 h-8 sm:h-9">
                  {friendshipStatus.isSender ? 'Terkirim' : 'Menunggu'}
                </Button>
              ) : (
                <Button onClick={onAddFriend} size="sm" className="gap-1.5 h-8 sm:h-9">
                  <UserPlus className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Tambah Teman</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              )}
              <Button onClick={onMessage} variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9">
                <MessageCircle className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Pesan</span>
              </Button>
            </>
          )}
        </div>

        {/* User Info */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-2 sm:mt-3"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{user.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">@{user.username}</p>
              {user.headline && (
                <p className="mt-1 text-xs sm:text-sm md:text-base text-foreground/80">{user.headline}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <Card className="mt-4 bg-muted/30">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
                  {user.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
            {user.address && (
              <div className="flex items-center gap-1">
                <MapPin className="size-3.5 sm:size-4" />
                <span>{user.address}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-1">
                <LinkIcon className="size-3.5 sm:size-4" />
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate max-w-[150px] sm:max-w-none"
                >
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5 sm:size-4" />
              <span>Bergabung {formattedJoinDate}</span>
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn(
                    'px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-normal',
                    'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}
