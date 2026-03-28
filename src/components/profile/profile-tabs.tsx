'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { FileText, User, Briefcase, FolderOpen, Users } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ProfileTabsProps {
  tabContent: {
    posts: React.ReactNode
    about: React.ReactNode
    cv: React.ReactNode
    portfolio: React.ReactNode
    friends?: React.ReactNode
  }
  defaultTab?: string
  onChange?: (value: string) => void
  className?: string
  showFriendsTab?: boolean
}

export function ProfileTabs({
  tabContent,
  defaultTab = 'posts',
  onChange,
  className,
  showFriendsTab = true,
}: ProfileTabsProps) {
  const tabs = [
    { value: 'posts', label: 'Posts', icon: FileText },
    { value: 'about', label: 'About', icon: User },
    { value: 'cv', label: 'CV', icon: Briefcase },
    { value: 'portfolio', label: 'Work', icon: FolderOpen },
    ...(showFriendsTab ? [{ value: 'friends', label: 'Friends', icon: Users }] : []),
  ]

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={className}
    >
      <Tabs defaultValue={defaultTab} onValueChange={onChange}>
        <TabsList className="w-full justify-start bg-muted/50 p-0.5 sm:p-1 h-auto overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                'flex-shrink-0'
              )}
            >
              <tab.icon className="size-3.5 sm:size-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="posts" className="mt-4 sm:mt-6 focus-visible:outline-none">
          {tabContent.posts}
        </TabsContent>

        <TabsContent value="about" className="mt-4 sm:mt-6 focus-visible:outline-none">
          {tabContent.about}
        </TabsContent>

        <TabsContent value="cv" className="mt-4 sm:mt-6 focus-visible:outline-none">
          {tabContent.cv}
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4 sm:mt-6 focus-visible:outline-none">
          {tabContent.portfolio}
        </TabsContent>

        {showFriendsTab && tabContent.friends && (
          <TabsContent value="friends" className="mt-4 sm:mt-6 focus-visible:outline-none">
            {tabContent.friends}
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  )
}
