'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Briefcase,
  Award,
  Plus,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Types
interface Education {
  id: string
  institution: string
  degree: string
  field: string | null
  startDate: Date
  endDate: Date | null
  description: string | null
}

interface Experience {
  id: string
  company: string
  position: string
  location: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}

interface Achievement {
  id: string
  title: string
  description: string | null
  date: Date | null
  issuer: string | null
}

interface Portfolio {
  id: string
  title: string
  description: string | null
  link: string | null
  images: string[] | string | null
  technologies: string[] | string | null
}

interface CVSectionProps {
  education?: Education[]
  experiences?: Experience[]
  achievements?: Achievement[]
  portfolios?: Portfolio[]
  isOwnProfile: boolean
  onAddEducation?: () => void
  onEditEducation?: (id: string) => void
  onDeleteEducation?: (id: string) => void
  onAddExperience?: () => void
  onEditExperience?: (id: string) => void
  onDeleteExperience?: (id: string) => void
  onAddAchievement?: () => void
  onEditAchievement?: (id: string) => void
  onDeleteAchievement?: (id: string) => void
  onAddPortfolio?: () => void
  onEditPortfolio?: (id: string) => void
  onDeletePortfolio?: (id: string) => void
  className?: string
}

// Helper function to format date range
function formatDateRange(start: Date, end: Date | null, current?: boolean): string {
  const startDate = new Date(start)
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  if (current) {
    return `${startStr} - Present`
  }

  if (end) {
    const endDate = new Date(end)
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  return startStr
}

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

export function CVSection({
  education = [],
  experiences = [],
  achievements = [],
  portfolios = [],
  isOwnProfile,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
  onAddAchievement,
  onEditAchievement,
  onDeleteAchievement,
  onAddPortfolio,
  onEditPortfolio,
  onDeletePortfolio,
  className,
}: CVSectionProps) {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Education Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="size-5 text-primary" />
            Education
          </CardTitle>
          {isOwnProfile && (
            <Button size="sm" variant="outline" onClick={onAddEducation} className="gap-1">
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <AnimatePresence mode="popLayout">
            {education.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No education added yet
              </p>
            ) : (
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <motion.div
                    key={edu.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <GraduationCap className="size-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{edu.institution}</h4>
                          <p className="text-sm text-muted-foreground">
                            {edu.degree}
                            {edu.field && ` - ${edu.field}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateRange(edu.startDate, edu.endDate)}
                          </p>
                          {expandedSection === `edu-${edu.id}` && edu.description && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {edu.description && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() =>
                              setExpandedSection(
                                expandedSection === `edu-${edu.id}` ? null : `edu-${edu.id}`
                              )
                            }
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        )}
                        {isOwnProfile && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => onEditEducation?.(edu.id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => onDeleteEducation?.(edu.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="size-5 text-primary" />
            Experience
          </CardTitle>
          {isOwnProfile && (
            <Button size="sm" variant="outline" onClick={onAddExperience} className="gap-1">
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <AnimatePresence mode="popLayout">
            {experiences.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No experience added yet
              </p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp, index) => (
                  <motion.div
                    key={exp.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            {exp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" />
                                {exp.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                            </span>
                          </div>
                          {exp.current && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Current
                            </Badge>
                          )}
                          {expandedSection === `exp-${exp.id}` && exp.description && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {exp.description && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() =>
                              setExpandedSection(
                                expandedSection === `exp-${exp.id}` ? null : `exp-${exp.id}`
                              )
                            }
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        )}
                        {isOwnProfile && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => onEditExperience?.(exp.id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => onDeleteExperience?.(exp.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="size-5 text-primary" />
            Achievements
          </CardTitle>
          {isOwnProfile && (
            <Button size="sm" variant="outline" onClick={onAddAchievement} className="gap-1">
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <AnimatePresence mode="popLayout">
            {achievements.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No achievements added yet
              </p>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <Award className="size-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{achievement.title}</h4>
                          {achievement.issuer && (
                            <p className="text-sm text-muted-foreground">{achievement.issuer}</p>
                          )}
                          {achievement.date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(achievement.date).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                          {achievement.description && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {achievement.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => onEditAchievement?.(achievement.id)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => onDeleteAchievement?.(achievement.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ExternalLink className="size-5 text-primary" />
            Portfolio
          </CardTitle>
          {isOwnProfile && (
            <Button size="sm" variant="outline" onClick={onAddPortfolio} className="gap-1">
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <AnimatePresence mode="popLayout">
            {portfolios.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No portfolio projects added yet
              </p>
            ) : (
              <div className="space-y-4">
                {portfolios.map((portfolio, index) => {
                  // Handle both array and JSON string formats
                  let techs: string[] = []
                  if (Array.isArray(portfolio.technologies)) {
                    techs = portfolio.technologies
                  } else if (portfolio.technologies) {
                    try {
                      techs = JSON.parse(portfolio.technologies)
                    } catch {
                      techs = []
                    }
                  }
                  
                  return (
                    <motion.div
                      key={portfolio.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      layout
                    >
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <ExternalLink className="size-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{portfolio.title}</h4>
                              {portfolio.link && (
                                <a
                                  href={portfolio.link.startsWith('http') ? portfolio.link : `https://${portfolio.link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                            {portfolio.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {portfolio.description}
                              </p>
                            )}
                            {techs.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {techs.map((tech) => (
                                  <Badge
                                    key={tech}
                                    variant="secondary"
                                    className="text-xs bg-primary/10 text-primary"
                                  >
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {isOwnProfile && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => onEditPortfolio?.(portfolio.id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => onDeletePortfolio?.(portfolio.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Print-friendly note */}
      <p className="text-xs text-muted-foreground text-center">
        Print this page for a professional CV layout
      </p>
    </div>
  )
}
