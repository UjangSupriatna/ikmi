"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { RightSidebar } from "./right-sidebar"
import { MobileNav } from "./mobile-nav"

interface UserProfile {
  id: string
  name: string
  username: string
  avatar: string | null
}

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  user?: UserProfile | null
  currentView?: string
  onNavigate?: (view: string) => void
  unreadMessagesCount?: number
  onGroupClick?: (groupId: string) => void
  onJoinGroup?: (groupId: string) => void
  onEventClick?: (eventId: string) => void
  onViewAllPeople?: () => void
  onViewAllGroups?: () => void
  onViewAllEvents?: () => void
}

export function MainLayout({ 
  children, 
  className,
  user,
  currentView = 'feed',
  onNavigate,
  unreadMessagesCount = 0,
  onGroupClick,
  onJoinGroup,
  onEventClick,
  onViewAllPeople,
  onViewAllGroups,
  onViewAllEvents
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main container with flex layout */}
      <div className="flex flex-1">
        {/* Left Sidebar - Desktop only */}
        <aside
          className={cn(
            "hidden md:flex flex-col w-64 lg:w-72 border-r border-border",
            "bg-sidebar sticky top-0 h-screen"
          )}
        >
          <Sidebar user={user} currentView={currentView} onNavigate={onNavigate} unreadMessagesCount={unreadMessagesCount} />
        </aside>

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 min-w-0",
            "pb-20 md:pb-0", // Bottom padding for mobile nav
            className
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Right Sidebar - Desktop only */}
        <aside
          className={cn(
            "hidden lg:flex flex-col w-72 xl:w-80 border-l border-border",
            "bg-sidebar sticky top-0 h-screen"
          )}
        >
          <RightSidebar 
            onGroupClick={onGroupClick}
            onJoinGroup={onJoinGroup}
            onEventClick={onEventClick}
            onViewAllPeople={onViewAllPeople}
            onViewAllGroups={onViewAllGroups}
            onViewAllEvents={onViewAllEvents}
          />
        </aside>
      </div>

      {/* Mobile Navigation */}
      <MobileNav user={user} currentView={currentView} onNavigate={onNavigate} unreadMessagesCount={unreadMessagesCount} />
    </div>
  )
}
