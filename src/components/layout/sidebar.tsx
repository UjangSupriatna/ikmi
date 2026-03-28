"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Home,
  Users,
  MessageCircle,
  Calendar,
  Bell,
  MoreHorizontal,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "./theme-toggle"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  title: string
  view: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
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

interface SidebarProps {
  className?: string
  user?: UserProfile | null
  currentView?: string
  onNavigate?: (view: string) => void
  unreadMessagesCount?: number
}

export function Sidebar({ 
  className, 
  user,
  currentView = 'feed',
  onNavigate,
  unreadMessagesCount = 0
}: SidebarProps) {
  const handleNavClick = (view: string) => {
    if (onNavigate) {
      onNavigate(view)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Logo Header */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <img 
            src="/logo-ikmi.png" 
            alt="IKMI Logo" 
            className="size-10 object-contain"
          />
          <span className="font-bold text-base text-sidebar-foreground">
            IKMI SOCIAL
          </span>
        </motion.div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item, index) => {
            const isActive = currentView === item.view
            const Icon = item.icon
            const isMessages = item.view === 'messages'

            return (
              <motion.div
                key={item.view}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => handleNavClick(item.view)}
                  className={cn(
                    "w-full justify-start gap-3 relative h-10 px-3",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}
                >
                  <div className="relative">
                    <Icon className="size-5 shrink-0" />
                    {/* Unread badge for messages */}
                    {isMessages && unreadMessagesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-left">{item.title}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Button>
              </motion.div>
            )
          })}
          
          {/* Notifications */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: navItems.length * 0.05 }}
          >
            <NotificationDropdown showLabel className="w-full justify-start gap-3 h-10 px-3" />
          </motion.div>

          {/* More Options Dropdown */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: (navItems.length + 1) * 0.05 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 relative h-10 px-3",
                    currentView === 'settings' && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}
                >
                  <MoreHorizontal className="size-5 shrink-0" />
                  <span className="flex-1 text-left">Lainnya</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => handleNavClick('profile')}>
                  <Users className="size-4 mr-2" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavClick('groups')}>
                  <Users className="size-4 mr-2" />
                  Grup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavClick('settings')}>
                  <Settings className="size-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto border-t border-sidebar-border">
        <div className="p-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>

          <Separator className="mb-3" />

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer" onClick={() => handleNavClick('profile')}>
            <Avatar className="size-9">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{user?.username || 'user'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
