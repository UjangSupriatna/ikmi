"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Home, Users, MessageCircle, Calendar, Bell, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MobileNavItem {
  title: string
  view: string
  icon: React.ComponentType<{ className?: string }>
}

const mobileNavItems: MobileNavItem[] = [
  {
    title: "Home",
    view: "feed",
    icon: Home,
  },
  {
    title: "Teman",
    view: "friends",
    icon: Users,
  },
  {
    title: "Pesan",
    view: "messages",
    icon: MessageCircle,
  },
  {
    title: "Events",
    view: "events",
    icon: Calendar,
  },
]

interface UserProfile {
  id: string
  name: string
  username: string
  avatar: string | null
}

interface MobileNavProps {
  className?: string
  user?: UserProfile | null
  currentView?: string
  onNavigate?: (view: string) => void
  unreadMessagesCount?: number
}

export function MobileNav({ 
  className,
  user,
  currentView = 'feed',
  onNavigate,
  unreadMessagesCount = 0
}: MobileNavProps) {
  const handleNavClick = (view: string) => {
    if (onNavigate) {
      onNavigate(view)
    }
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-background/95 backdrop-blur-md border-t border-border",
        "pb-safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {mobileNavItems.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon
          const isMessages = item.view === 'messages'

          return (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className="flex-1 flex flex-col items-center justify-center py-2 relative"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "size-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {/* Unread badge for messages */}
                {isMessages && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeMobileNav"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}

        {/* Notifications - Icon Only */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 relative">
          <NotificationDropdown iconOnly />
        </div>

        {/* More Options - Icon Only */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center py-2 relative">
              <MoreHorizontal
                className={cn(
                  "size-6 transition-colors",
                  currentView === 'settings' || currentView === 'profile' || currentView === 'groups'
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            <DropdownMenuItem onClick={() => handleNavClick('profile')}>
              <Users className="size-4 mr-2" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavClick('groups')}>
              <Users className="size-4 mr-2" />
              Grup
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavClick('settings')} className="text-destructive">
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
