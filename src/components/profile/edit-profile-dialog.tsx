'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2, X, Plus, Camera, Image as ImageIcon } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string
  username: string
  avatar: string | null
  coverPhoto: string | null
  bio: string | null
  headline: string | null
  skills: string | null
  phone: string | null
  address: string | null
  website: string | null
}

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile | null
  onSave: (data: Partial<UserProfile>) => Promise<void>
  isLoading?: boolean
}

// Image compression utility
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        let { width, height } = img
        const maxDimension = 800
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        const quality = 0.7
        const base64 = canvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSave,
  isLoading = false,
}: EditProfileDialogProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    bio: '',
    headline: '',
    phone: '',
    address: '',
    website: '',
    skills: [] as string[],
    avatar: null as string | null,
    coverPhoto: null as string | null,
  })
  const [newSkill, setNewSkill] = React.useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [isUploadingCover, setIsUploadingCover] = React.useState(false)

  // Initialize form data when profile changes
  React.useEffect(() => {
    if (profile) {
      let skills: string[] = []
      try {
        skills = profile.skills ? JSON.parse(profile.skills) : []
      } catch {
        skills = []
      }

      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        headline: profile.headline || '',
        phone: profile.phone || '',
        address: profile.address || '',
        website: profile.website || '',
        skills,
        avatar: profile.avatar,
        coverPhoto: profile.coverPhoto,
      })
    }
  }, [profile])

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      return
    }

    setIsUploadingAvatar(true)
    try {
      const compressedImage = await compressImage(file)
      setFormData(prev => ({ ...prev, avatar: compressedImage }))
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setIsUploadingAvatar(false)
    }
    e.target.value = ''
  }

  // Handle cover photo upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      return
    }

    setIsUploadingCover(true)
    try {
      const compressedImage = await compressImage(file)
      setFormData(prev => ({ ...prev, coverPhoto: compressedImage }))
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setIsUploadingCover(false)
    }
    e.target.value = ''
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      name: formData.name,
      bio: formData.bio,
      headline: formData.headline,
      phone: formData.phone,
      address: formData.address,
      website: formData.website,
      skills: JSON.stringify(formData.skills),
      avatar: formData.avatar,
      coverPhoto: formData.coverPhoto,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex-1">
                Photos
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex-1">
                Contact
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex-1">
                Skills
              </TabsTrigger>
            </TabsList>

            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-4 mt-4">
              {/* Avatar Upload */}
              <div className="space-y-3">
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="size-20 border-2 border-border">
                    <AvatarImage src={formData.avatar || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {formData.name ? getInitials(formData.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <label htmlFor="avatar-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 cursor-pointer"
                        disabled={isUploadingAvatar}
                        asChild
                      >
                        <span>
                          {isUploadingAvatar ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Camera className="size-4" />
                          )}
                          Change Photo
                        </span>
                      </Button>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Photo Upload */}
              <div className="space-y-3">
                <Label>Cover Photo</Label>
                <div className="relative">
                  <div className="h-32 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden border border-border">
                    {formData.coverPhoto && (
                      <img
                        src={formData.coverPhoto}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <label htmlFor="cover-upload">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-2 right-2 gap-2 cursor-pointer"
                      disabled={isUploadingCover}
                      asChild
                    >
                      <span>
                        {isUploadingCover ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ImageIcon className="size-4" />
                        )}
                        Change Cover
                      </span>
                    </Button>
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 1500x500px. JPG, PNG. Max 5MB.
                </p>
              </div>
            </TabsContent>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  placeholder="e.g., Software Developer at Company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 234 567 8900"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Location</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://yourwebsite.com"
                  type="url"
                />
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Add Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g., JavaScript, React, Node.js"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSkill()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddSkill}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Skills</Label>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg border border-border bg-muted/30">
                  {formData.skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  ) : (
                    formData.skills.map((skill) => (
                      <motion.div
                        key={skill}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Badge
                          variant="secondary"
                          className="gap-1 pr-1 bg-primary/10 text-primary"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Education Dialog
interface Education {
  id?: string
  institution: string
  degree: string
  field: string | null
  startDate: string
  endDate: string | null
  description: string | null
}

interface EducationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  education: Education | null
  onSave: (data: Education) => Promise<void>
  isLoading?: boolean
}

export function EducationDialog({
  open,
  onOpenChange,
  education,
  onSave,
  isLoading = false,
}: EducationDialogProps) {
  const [formData, setFormData] = React.useState<Education>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    description: '',
  })

  React.useEffect(() => {
    if (education) {
      // Convert date to YYYY-MM format for month input
      const formatDateToMonth = (date: string | Date) => {
        const d = new Date(date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      }
      setFormData({
        institution: education.institution || '',
        degree: education.degree || '',
        field: education.field || '',
        startDate: education.startDate ? formatDateToMonth(education.startDate) : '',
        endDate: education.endDate ? formatDateToMonth(education.endDate) : '',
        description: education.description || '',
      })
    } else {
      setFormData({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: '',
      })
    }
  }, [education, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{education?.id ? 'Edit Education' : 'Add Education'}</DialogTitle>
          <DialogDescription>
            Add your educational background to your profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Input
              id="institution"
              value={formData.institution}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, institution: e.target.value }))
              }
              placeholder="University name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree">Degree *</Label>
            <Input
              id="degree"
              value={formData.degree}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, degree: e.target.value }))
              }
              placeholder="e.g., Bachelor's, Master's"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field">Field of Study</Label>
            <Input
              id="field"
              value={formData.field || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, field: e.target.value }))
              }
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="month"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="month"
                value={formData.endDate || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              {education?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Experience Dialog
interface Experience {
  id?: string
  company: string
  position: string
  location: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

interface ExperienceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experience: Experience | null
  onSave: (data: Experience) => Promise<void>
  isLoading?: boolean
}

export function ExperienceDialog({
  open,
  onOpenChange,
  experience,
  onSave,
  isLoading = false,
}: ExperienceDialogProps) {
  const [formData, setFormData] = React.useState<Experience>({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  })

  React.useEffect(() => {
    if (experience) {
      // Convert date to YYYY-MM format for month input
      const formatDateToMonth = (date: string | Date) => {
        const d = new Date(date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      }
      setFormData({
        company: experience.company || '',
        position: experience.position || '',
        location: experience.location || '',
        startDate: experience.startDate ? formatDateToMonth(experience.startDate) : '',
        endDate: experience.endDate ? formatDateToMonth(experience.endDate) : '',
        current: experience.current || false,
        description: experience.description || '',
      })
    } else {
      setFormData({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      })
    }
  }, [experience, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{experience?.id ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          <DialogDescription>
            Add your work experience to your profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, company: e.target.value }))
              }
              placeholder="Company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, position: e.target.value }))
              }
              placeholder="Job title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="City, Country"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-startDate">Start Date *</Label>
              <Input
                id="exp-startDate"
                type="month"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-endDate">End Date</Label>
              <Input
                id="exp-endDate"
                type="month"
                value={formData.endDate || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                disabled={formData.current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="current"
              checked={formData.current}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, current: checked, endDate: checked ? '' : prev.endDate }))
              }
            />
            <Label htmlFor="current">I currently work here</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-description">Description</Label>
            <Textarea
              id="exp-description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe your responsibilities..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              {experience?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Achievement Dialog
interface Achievement {
  id?: string
  title: string
  description: string | null
  date: string | null
  issuer: string | null
}

interface AchievementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  achievement: Achievement | null
  onSave: (data: Achievement) => Promise<void>
  isLoading?: boolean
}

export function AchievementDialog({
  open,
  onOpenChange,
  achievement,
  onSave,
  isLoading = false,
}: AchievementDialogProps) {
  const [formData, setFormData] = React.useState<Achievement>({
    title: '',
    description: '',
    date: '',
    issuer: '',
  })

  React.useEffect(() => {
    if (achievement) {
      setFormData({
        title: achievement.title || '',
        description: achievement.description || '',
        date: achievement.date ? new Date(achievement.date).toISOString().split('T')[0] : '',
        issuer: achievement.issuer || '',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        issuer: '',
      })
    }
  }, [achievement, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{achievement?.id ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
          <DialogDescription>
            Add your achievements and certifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ach-title">Title *</Label>
            <Input
              id="ach-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Achievement title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ach-issuer">Issuing Organization</Label>
            <Input
              id="ach-issuer"
              value={formData.issuer || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issuer: e.target.value }))
              }
              placeholder="Organization name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ach-date">Date</Label>
            <Input
              id="ach-date"
              type="date"
              value={formData.date || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ach-description">Description</Label>
            <Textarea
              id="ach-description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe your achievement..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              {achievement?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Portfolio Dialog
interface Portfolio {
  id?: string
  title: string
  description: string | null
  link: string | null
  images: string[]
  technologies: string[]
}

interface PortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: Portfolio | null
  onSave: (data: Portfolio) => Promise<void>
  isLoading?: boolean
}

export function PortfolioDialog({
  open,
  onOpenChange,
  portfolio,
  onSave,
  isLoading = false,
}: PortfolioDialogProps) {
  const [formData, setFormData] = React.useState<Portfolio>({
    title: '',
    description: '',
    link: '',
    images: [],
    technologies: [],
  })
  const [newTech, setNewTech] = React.useState('')
  const [newImage, setNewImage] = React.useState('')

  React.useEffect(() => {
    if (portfolio) {
      setFormData({
        title: portfolio.title || '',
        description: portfolio.description || '',
        link: portfolio.link || '',
        images: portfolio.images || [],
        technologies: portfolio.technologies || [],
      })
    } else {
      setFormData({
        title: '',
        description: '',
        link: '',
        images: [],
        technologies: [],
      })
    }
    setNewTech('')
    setNewImage('')
  }, [portfolio, open])

  const handleAddTech = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, newTech.trim()],
      }))
      setNewTech('')
    }
  }

  const handleRemoveTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }))
  }

  const handleAddImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImage.trim()],
      }))
      setNewImage('')
    }
  }

  const handleRemoveImage = (image: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i !== image),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{portfolio?.id ? 'Edit Project' : 'Add Project'}</DialogTitle>
          <DialogDescription>
            Add your portfolio project to showcase your work.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="port-title">Title *</Label>
            <Input
              id="port-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port-description">Description</Label>
            <Textarea
              id="port-description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe your project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port-link">Project Link</Label>
            <Input
              id="port-link"
              value={formData.link || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, link: e.target.value }))
              }
              placeholder="https://... atau link Google Drive"
              type="url"
            />
            <p className="text-xs text-muted-foreground">Bisa gunakan link website atau Google Drive</p>
          </div>

          <div className="space-y-2">
            <Label>Technologies</Label>
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add technology"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTech()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTech}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="gap-1 bg-primary/10 text-primary"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Images (URLs)</Label>
            <div className="flex gap-2">
              <Input
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="URL gambar (misal: imgur, cloudinary)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddImage()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddImage}>
                <Plus className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gunakan URL gambar langsung (.jpg, .png). Google Drive mungkin tidak dapat ditampilkan.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.images.map((image) => (
                <Badge key={image} variant="outline" className="gap-1">
                  Image
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
              {portfolio?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
