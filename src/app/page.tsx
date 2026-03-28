'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, Users, User, Settings, LogOut, Loader2, 
  GraduationCap, Mail, Lock, UserPlus, Eye, EyeOff,
  Image as ImageIcon, ArrowLeft, MessageCircle, ShoppingCart, Plus
} from 'lucide-react'

import { MainLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Feed } from '@/components/post/feed'
import { CreatePost } from '@/components/post/create-post'
import { 
  ProfileHeader, ProfileTabs, ProfileStats, CVSection,
  EditProfileDialog, EducationDialog, ExperienceDialog,
  AchievementDialog, PortfolioDialog, PortfolioCard
} from '@/components/profile'
import { FriendsList, FriendRequests, FriendSuggestions, UserSearch, UserFriendsList } from '@/components/friends'
import { GroupsList, CreateGroupDialog, GroupHeader, GroupMembers } from '@/components/groups'
import { PostCard } from '@/components/post/post-card'
import type { PostData } from '@/components/post/post-card'
import { useNavigationStore } from '@/stores/navigation-store'
import { useMessagePolling, useConversationsPolling } from '@/hooks/use-polling'
import { cn } from '@/lib/utils'
import { 
  ConversationsList, 
  ConversationView, 
  NewChatDialog,
  type ConversationData 
} from '@/components/messages'
import { 
  EventsList, 
  EventCard, 
  EventDetail, 
  CreateEventDialog,
  type EventData 
} from '@/components/events'

// Types
interface UserProfile {
  id: string
  name: string
  username: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  bio: string | null
  headline: string | null
  skills: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  birthday?: Date | null
  gender?: string | null
  createdAt: Date
  friendsCount?: number
  postsCount?: number
}

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
  images: string[]
  technologies: string[]
}

// Helper function to safely parse JSON arrays
const safeParseArray = (value: string[] | string | null | undefined): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Search result type
interface SearchResultUser {
  id: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
  friendshipStatus: {
    status: string
    isSender: boolean
  } | null
}

interface GroupData {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  avatar: string | null
  privacy: string
  createdById: string
  createdAt: Date
  updatedAt: Date
  memberCount: number
  isMember: boolean
  isCreator: boolean
  memberRole: string | null
}

interface GroupMemberData {
  id: string
  userId: string
  groupId: string
  role: string
  joinedAt: Date
  user: {
    id: string
    name: string
    username: string
    avatar: string | null
    headline: string | null
  }
}

interface MessageData {
  id: string
  content: string
  images: string[]
  sender: {
    id: string
    name: string
    username?: string
    avatar: string | null
  }
  createdAt: Date
  read: boolean
  isOwn: boolean
}

interface FriendData {
  id: string
  name: string
  username: string
  avatar: string | null
  headline: string | null
}

// View types for SPA navigation
type ViewType = 'feed' | 'profile' | 'friends' | 'groups' | 'messages' | 'events' | 'settings'

export default function IKMISocial() {
  const { toast } = useToast()
  const { pendingNavigation, clearNavigation } = useNavigationStore()
  
  // Auth state
  const [user, setUser] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  
  // View state
  const [currentView, setCurrentView] = React.useState<ViewType>('feed')
  
  // Profile state
  const [profileUser, setProfileUser] = React.useState<UserProfile | null>(null)
  const [educations, setEducations] = React.useState<Education[]>([])
  const [experiences, setExperiences] = React.useState<Experience[]>([])
  const [achievements, setAchievements] = React.useState<Achievement[]>([])
  const [portfolios, setPortfolios] = React.useState<Portfolio[]>([])
  const [profilePosts, setProfilePosts] = React.useState<PostData[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false)
  
  // Dialog states
  const [editProfileOpen, setEditProfileOpen] = React.useState(false)
  const [educationDialogOpen, setEducationDialogOpen] = React.useState(false)
  const [experienceDialogOpen, setExperienceDialogOpen] = React.useState(false)
  const [achievementDialogOpen, setAchievementDialogOpen] = React.useState(false)
  const [portfolioDialogOpen, setPortfolioDialogOpen] = React.useState(false)
  
  // Edit item states
  const [editingEducation, setEditingEducation] = React.useState<Education | null>(null)
  const [editingExperience, setEditingExperience] = React.useState<Experience | null>(null)
  const [editingAchievement, setEditingAchievement] = React.useState<Achievement | null>(null)
  const [editingPortfolio, setEditingPortfolio] = React.useState<Portfolio | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Groups state
  const [groups, setGroups] = React.useState<GroupData[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = React.useState(false)
  const [selectedGroup, setSelectedGroup] = React.useState<GroupData | null>(null)
  const [groupMembers, setGroupMembers] = React.useState<GroupMemberData[]>([])
  const [groupPosts, setGroupPosts] = React.useState<PostData[]>([])
  const [createGroupOpen, setCreateGroupOpen] = React.useState(false)
  const [joiningGroupId, setJoiningGroupId] = React.useState<string | null>(null)
  
  // Messages state
  const [conversations, setConversations] = React.useState<ConversationData[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false)
  const [selectedConversation, setSelectedConversation] = React.useState<ConversationData | null>(null)
  const [messages, setMessages] = React.useState<MessageData[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [isSendingMessage, setIsSendingMessage] = React.useState(false)
  const [isRefreshingMessages, setIsRefreshingMessages] = React.useState(false)
  const [newChatOpen, setNewChatOpen] = React.useState(false)
  const [friends, setFriends] = React.useState<FriendData[]>([])
  const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0)
  
  // Events state
  const [selectedEvent, setSelectedEvent] = React.useState<EventData | null>(null)
  const [createEventOpen, setCreateEventOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<EventData | null>(null)
  const [eventsRefreshKey, setEventsRefreshKey] = React.useState(0)
  
  // Friends tab state
  const [friendsTab, setFriendsTab] = React.useState<'friends' | 'requests' | 'suggestions'>('friends')
  
  // Viewing other user's profile
  const [viewingUserId, setViewingUserId] = React.useState<string | null>(null)
  const [viewingUser, setViewingUser] = React.useState<UserProfile | null>(null)
  const [viewingUserEducation, setViewingUserEducation] = React.useState<Education[]>([])
  const [viewingUserExperience, setViewingUserExperience] = React.useState<Experience[]>([])
  const [viewingUserAchievements, setViewingUserAchievements] = React.useState<Achievement[]>([])
  const [viewingUserPortfolios, setViewingUserPortfolios] = React.useState<Portfolio[]>([])
  const [viewingUserPosts, setViewingUserPosts] = React.useState<PostData[]>([])
  const [isLoadingViewingUser, setIsLoadingViewingUser] = React.useState(false)
  const [friendshipStatus, setFriendshipStatus] = React.useState<{status: string, isSender: boolean} | null>(null)

  // Fetch current user
  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial auth check
  React.useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  // Fetch profile data when viewing profile
  const fetchProfileData = React.useCallback(async () => {
    if (!user?.id) return
    
    setIsLoadingProfile(true)
    try {
      const [userRes, eduRes, expRes, achRes, portRes, postsRes] = await Promise.all([
        fetch(`/api/users/${user.id}`),
        fetch('/api/users/me/education'),
        fetch('/api/users/me/experience'),
        fetch('/api/users/me/achievement'),
        fetch('/api/users/me/portfolio'),
        fetch(`/api/users/${user.id}/posts?limit=20`),
      ])
      
      if (userRes.ok) {
        setProfileUser(await userRes.json())
      }
      if (eduRes.ok) setEducations(await eduRes.json())
      if (expRes.ok) setExperiences(await expRes.json())
      if (achRes.ok) setAchievements(await achRes.json())
      if (portRes.ok) setPortfolios(await portRes.json())
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setProfilePosts(postsData.posts || [])
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [user?.id])

  // Fetch groups
  const fetchGroups = React.useCallback(async () => {
    setIsLoadingGroups(true)
    try {
      const response = await fetch('/api/groups?limit=20')
      if (response.ok) {
        setGroups((await response.json()).groups)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }, [])

  // Fetch group details
  const fetchGroupDetails = React.useCallback(async (groupId: string) => {
    try {
      const [groupRes, membersRes, postsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/members?limit=50`),
        fetch(`/api/groups/${groupId}/posts?limit=10`),
      ])
      
      if (groupRes.ok) setSelectedGroup(await groupRes.json())
      if (membersRes.ok) setGroupMembers((await membersRes.json()).members)
      if (postsRes.ok) setGroupPosts((await postsRes.json()).posts)
    } catch (error) {
      console.error('Failed to fetch group details:', error)
    }
  }, [])

  // Fetch conversations
  const fetchConversations = React.useCallback(async () => {
    setIsLoadingConversations(true)
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
        setUnreadMessagesCount(data.totalUnread || 0)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  // Fetch messages for a conversation
  const fetchMessages = React.useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/messages/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  // Fetch friends for new chat dialog
  const fetchFriends = React.useCallback(async () => {
    try {
      const response = await fetch('/api/friends')
      if (response.ok) {
        const data = await response.json()
        // Map friends to the expected format with 'id' field
        const formattedFriends = (data.friends || []).map((f: { friendId: string; name: string; username: string; avatar: string | null; headline: string | null }) => ({
          id: f.friendId,
          name: f.name,
          username: f.username,
          avatar: f.avatar,
          headline: f.headline,
        }))
        setFriends(formattedFriends)
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    }
  }, [])

  // Fetch another user's profile for viewing
  const viewUserProfile = React.useCallback(async (userId: string) => {
    if (!user?.id) return
    
    setIsLoadingViewingUser(true)
    setViewingUserId(userId)
    try {
      // Fetch user info with all CV data in one call
      const [userRes, postsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/posts?limit=20`),
      ])
      if (!userRes.ok) {
        toast({ title: 'Error', description: 'User not found', variant: 'destructive' })
        return
      }
      const userData = await userRes.json()
      setViewingUser(userData)
      
      // Set friendship status from response
      setFriendshipStatus(userData.friendshipStatus)
      
      // Set CV data from response
      setViewingUserEducation(userData.educations || [])
      setViewingUserExperience(userData.experiences || [])
      setViewingUserAchievements(userData.achievements || [])
      setViewingUserPortfolios(userData.portfolios || [])
      
      // Set posts from response
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setViewingUserPosts(postsData.posts || [])
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' })
    } finally {
      setIsLoadingViewingUser(false)
    }
  }, [user?.id, toast])

  // Handle user selection from search
  const handleUserSelect = (selectedUser: SearchResultUser) => {
    if (selectedUser.id === user?.id) {
      // Viewing own profile
      setCurrentView('profile')
    } else {
      // Viewing another user's profile
      viewUserProfile(selectedUser.id)
    }
  }

  // Handle view changes
  React.useEffect(() => {
    if (!isAuthenticated) return
    
    if (currentView === 'profile') {
      fetchProfileData()
    } else if (currentView === 'groups') {
      fetchGroups()
    } else if (currentView === 'messages') {
      fetchConversations()
      fetchFriends()
    }
  }, [currentView, isAuthenticated, fetchProfileData, fetchGroups, fetchConversations, fetchFriends])

  // Handle navigation from notifications/other components via store
  React.useEffect(() => {
    if (!pendingNavigation || !isAuthenticated || !user?.id) return

    const handleNavigation = async () => {
      switch (pendingNavigation.type) {
        case 'feed':
          setViewingUserId(null)
          setCurrentView('feed')
          break
        case 'profile':
          if (pendingNavigation.userId) {
            if (pendingNavigation.userId === user.id) {
              setViewingUserId(null)
              setCurrentView('profile')
            } else {
              viewUserProfile(pendingNavigation.userId)
            }
          } else {
            setViewingUserId(null)
            setCurrentView('profile')
          }
          break
        case 'friends':
          setViewingUserId(null)
          setCurrentView('friends')
          if (pendingNavigation.tab) {
            setFriendsTab(pendingNavigation.tab)
          } else {
            setFriendsTab('friends')
          }
          break
        case 'groups':
          setViewingUserId(null)
          if (pendingNavigation.groupId) {
            setCurrentView('groups')
            fetchGroupDetails(pendingNavigation.groupId)
          } else {
            setSelectedGroup(null)
            setCurrentView('groups')
          }
          break
        case 'post':
          // For now, just show a toast - posts are shown in feed
          toast({ title: 'Post', description: 'Post navigation coming soon!' })
          setViewingUserId(null)
          setCurrentView('feed')
          break
        case 'messages':
          setViewingUserId(null)
          setSelectedConversation(null)
          if (pendingNavigation.conversationId) {
            setCurrentView('messages')
            // Fetch the specific conversation
            const conv = conversations.find(c => c.id === pendingNavigation.conversationId)
            if (conv) {
              setSelectedConversation(conv)
              fetchMessages(pendingNavigation.conversationId)
            }
          } else {
            setCurrentView('messages')
          }
          break
      }
      
      clearNavigation()
    }

    handleNavigation()
  }, [pendingNavigation, isAuthenticated, user?.id, viewUserProfile, fetchGroupDetails, clearNavigation, toast, conversations, fetchMessages])

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setIsAuthenticated(false)
      setCurrentView('feed')
      toast({ title: 'Logged out', description: 'See you soon!' })
    } catch {
      toast({ title: 'Error', description: 'Failed to logout', variant: 'destructive' })
    }
  }

  // Handle navigation
  const handleNavigate = (view: ViewType) => {
    if (view === 'settings') {
      handleLogout()
      return
    }
    setCurrentView(view)
    setSelectedGroup(null)
    setViewingUserId(null) // Clear viewing user when navigating
  }

  // Handle group actions
  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroupId(groupId)
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' })
      if (response.ok) {
        toast({ title: 'Joined group', description: 'You are now a member!' })
        fetchGroups()
        if (selectedGroup?.id === groupId) fetchGroupDetails(groupId)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to join group', variant: 'destructive' })
    } finally {
      setJoiningGroupId(null)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    setJoiningGroupId(groupId)
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Left group', description: 'You are no longer a member' })
        fetchGroups()
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null)
          setGroupMembers([])
          setGroupPosts([])
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to leave group', variant: 'destructive' })
    } finally {
      setJoiningGroupId(null)
    }
  }

  // Handle delete group
  const handleDeleteGroup = async (groupId: string) => {
    setJoiningGroupId(groupId)
    try {
      const response = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Group deleted', description: 'The group has been permanently deleted' })
        fetchGroups()
        setSelectedGroup(null)
        setGroupMembers([])
        setGroupPosts([])
      } else {
        const data = await response.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete group', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete group', variant: 'destructive' })
    } finally {
      setJoiningGroupId(null)
    }
  }

  // Handle group post deletion
  const handleGroupPostDeleted = (postId: string) => {
    setGroupPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  // Handle profile post deletion
  const handleProfilePostDeleted = (postId: string) => {
    setProfilePosts((prev) => prev.filter((post) => post.id !== postId))
  }

  // Handle viewing user post deletion
  const handleViewingUserPostDeleted = (postId: string) => {
    setViewingUserPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  // ========== POLLING FOR REAL-TIME MESSAGING ==========
  // Poll for new messages in the selected conversation
  useMessagePolling({
    conversationId: selectedConversation?.id || null,
    enabled: isAuthenticated && currentView === 'messages' && !!selectedConversation,
    interval: 2000, // Poll every 2 seconds
    onNewMessages: (newMessages) => {
      setMessages(newMessages)
    },
  })

  // Poll for conversations list updates
  useConversationsPolling({
    enabled: isAuthenticated && currentView === 'messages',
    interval: 5000, // Poll every 5 seconds
    onUpdate: ({ conversations: newConversations, totalUnread }) => {
      setConversations(newConversations)
      setUnreadMessagesCount(totalUnread)
    },
  })

  // Refresh messages manually
  const handleRefreshMessages = async () => {
    if (!selectedConversation) return
    setIsRefreshingMessages(true)
    await fetchMessages(selectedConversation.id)
    setIsRefreshingMessages(false)
  }

  // Clear chat messages
  const handleClearChat = async () => {
    if (!selectedConversation) {
      toast({ title: 'Error', description: 'No conversation selected', variant: 'destructive' })
      return
    }
    try {
      console.log('Clearing chat for conversation:', selectedConversation.id)
      const response = await fetch(`/api/messages/${selectedConversation.id}/clear`, {
        method: 'DELETE'
      })
      console.log('Clear response status:', response.status)
      if (response.ok) {
        setMessages([])
        toast({ title: 'Chat cleared', description: 'All messages have been deleted' })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Clear error:', errorData)
        toast({ title: 'Error', description: errorData.error || 'Failed to clear chat', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Clear exception:', error)
      toast({ title: 'Error', description: 'Failed to clear chat', variant: 'destructive' })
    }
  }

  // ========== MESSAGE HANDLERS ==========
  const handleSelectConversation = async (conversation: ConversationData) => {
    setSelectedConversation(conversation)
    await fetchMessages(conversation.id)
  }

  const handleSendMessage = async (content: string, images?: string[]) => {
    if (!selectedConversation || !user?.id) return
    
    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: MessageData = {
      id: tempId,
      content,
      images: images || [],
      sender: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      },
      createdAt: new Date(),
      read: false,
      isOwn: true,
    }
    setMessages((prev) => [...prev, optimisticMessage])
    
    setIsSendingMessage(true)
    try {
      // Send via API
      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images }),
      })
      
      if (response.ok) {
        const data = await response.json()
        // Replace optimistic message with real one
        setMessages((prev) => 
          prev.map((msg) => msg.id === tempId ? data.message : msg)
        )
        // Update conversation list
        fetchConversations()
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
      }
    } catch {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleStartNewConversation = async (friendId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [friendId] }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setNewChatOpen(false)
        fetchConversations()
        
        // Navigate to the conversation
        if (data.conversation) {
          const newConv: ConversationData = {
            id: data.conversation.id,
            createdAt: data.conversation.createdAt,
            updatedAt: data.conversation.updatedAt,
            participants: friends.filter(f => f.id === friendId),
            lastMessage: null,
            unreadCount: 0,
          }
          setSelectedConversation(newConv)
          setMessages([])
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to start conversation', variant: 'destructive' })
    }
  }

  // ========== EDUCATION HANDLERS ==========
  const handleSaveEducation = async (data: {
    institution: string
    degree: string
    field: string | null
    startDate: string
    endDate: string | null
    description: string | null
  }) => {
    setIsSaving(true)
    try {
      const url = editingEducation 
        ? `/api/users/me/education/${editingEducation.id}`
        : '/api/users/me/education'
      const method = editingEducation ? 'PUT' : 'POST'
      
      // Convert YYYY-MM to YYYY-MM-01 for proper date parsing
      const parseMonthDate = (dateStr: string) => {
        if (!dateStr) return null
        return new Date(dateStr + '-01T00:00:00.000Z')
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: parseMonthDate(data.startDate),
          endDate: data.endDate ? parseMonthDate(data.endDate) : null,
        }),
      })
      
      if (response.ok) {
        toast({ title: 'Success', description: editingEducation ? 'Education updated!' : 'Education added!' })
        setEducationDialogOpen(false)
        setEditingEducation(null)
        fetchProfileData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save education', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEducation = async (id: string) => {
    try {
      const response = await fetch(`/api/users/me/education/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Education removed' })
        fetchProfileData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  // ========== EXPERIENCE HANDLERS ==========
  const handleSaveExperience = async (data: {
    company: string
    position: string
    location: string | null
    startDate: string
    endDate: string | null
    current: boolean
    description: string | null
  }) => {
    setIsSaving(true)
    try {
      const url = editingExperience 
        ? `/api/users/me/experience/${editingExperience.id}`
        : '/api/users/me/experience'
      const method = editingExperience ? 'PUT' : 'POST'
      
      // Convert YYYY-MM to YYYY-MM-01 for proper date parsing
      const parseMonthDate = (dateStr: string) => {
        if (!dateStr) return null
        return new Date(dateStr + '-01T00:00:00.000Z')
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: parseMonthDate(data.startDate),
          endDate: data.endDate ? parseMonthDate(data.endDate) : null,
        }),
      })
      
      if (response.ok) {
        toast({ title: 'Success', description: editingExperience ? 'Experience updated!' : 'Experience added!' })
        setExperienceDialogOpen(false)
        setEditingExperience(null)
        fetchProfileData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save experience', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteExperience = async (id: string) => {
    try {
      const response = await fetch(`/api/users/me/experience/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Experience removed' })
        fetchProfileData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  // ========== ACHIEVEMENT HANDLERS ==========
  const handleSaveAchievement = async (data: {
    title: string
    description: string | null
    date: string | null
    issuer: string | null
  }) => {
    setIsSaving(true)
    try {
      const url = editingAchievement 
        ? `/api/users/me/achievement/${editingAchievement.id}`
        : '/api/users/me/achievement'
      const method = editingAchievement ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: data.date ? new Date(data.date) : null,
        }),
      })
      
      if (response.ok) {
        toast({ title: 'Success', description: editingAchievement ? 'Achievement updated!' : 'Achievement added!' })
        setAchievementDialogOpen(false)
        setEditingAchievement(null)
        fetchProfileData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save achievement', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAchievement = async (id: string) => {
    try {
      const response = await fetch(`/api/users/me/achievement/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Achievement removed' })
        fetchProfileData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  // ========== PORTFOLIO HANDLERS ==========
  const handleSavePortfolio = async (data: {
    title: string
    description: string | null
    link: string | null
    images: string[]
    technologies: string[]
  }) => {
    setIsSaving(true)
    try {
      const url = editingPortfolio 
        ? `/api/users/me/portfolio/${editingPortfolio.id}`
        : '/api/users/me/portfolio'
      const method = editingPortfolio ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: JSON.stringify(data.images),
          technologies: JSON.stringify(data.technologies),
        }),
      })
      
      if (response.ok) {
        toast({ title: 'Success', description: editingPortfolio ? 'Portfolio updated!' : 'Portfolio added!' })
        setPortfolioDialogOpen(false)
        setEditingPortfolio(null)
        fetchProfileData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save portfolio', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePortfolio = async (id: string) => {
    try {
      const response = await fetch(`/api/users/me/portfolio/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Deleted', description: 'Portfolio removed' })
        fetchProfileData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <img 
              src="/logo-ikmi.png" 
              alt="IKMI Logo" 
              className="size-24 sm:size-32 mx-auto object-contain drop-shadow-lg"
            />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-primary">IKMI SOCIAL</h1>
          <p className="text-muted-foreground mb-6">Sekolah Tinggi Manajemen Informatika dan Komputer</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Auth pages
  if (!isAuthenticated) {
    return <AuthPages onLoginSuccess={fetchCurrentUser} />
  }

  // Main app
  return (
    <MainLayout 
      user={user} 
      currentView={currentView} 
      onNavigate={handleNavigate} 
      unreadMessagesCount={unreadMessagesCount}
      onGroupClick={(groupId) => {
        setCurrentView('groups')
        fetchGroupDetails(groupId)
      }}
      onEventClick={(eventId) => {
        setCurrentView('events')
        fetch(`/api/events/${eventId}`).then(res => res.json()).then(data => {
          if (data) setSelectedEvent(data)
        })
      }}
      onViewAllPeople={() => {
        setViewingUserId(null)
        setCurrentView('friends')
        setFriendsTab('suggestions')
      }}
      onViewAllGroups={() => {
        setViewingUserId(null)
        setSelectedGroup(null)
        setCurrentView('groups')
      }}
      onViewAllEvents={() => {
        setViewingUserId(null)
        setSelectedEvent(null)
        setCurrentView('events')
      }}
    >
      <AnimatePresence mode="wait">
        {/* FEED VIEW */}
        {currentView === 'feed' && !viewingUserId && (
          <motion.div key="feed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto p-3 sm:p-4">
            <Feed currentUser={user} />
          </motion.div>
        )}

        {/* PROFILE VIEW */}
        {currentView === 'profile' && !viewingUserId && (
          <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto p-3 sm:p-4">
            {isLoadingProfile ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : profileUser ? (
              <div className="space-y-4 sm:space-y-6">
                <ProfileHeader
                  user={profileUser}
                  isOwnProfile={true}
                  onEditProfile={() => setEditProfileOpen(true)}
                />
                
                <ProfileStats
                  friendsCount={profileUser?.friendsCount || 0}
                  postsCount={profilePosts.length}
                  experiencesCount={experiences.length}
                  achievementsCount={achievements.length}
                />
                
                <ProfileTabs
                  tabContent={{
                    posts: profilePosts.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">No posts yet</div>
                    ) : (
                      <div className="space-y-4">
                        {profilePosts.map((post) => (
                          <PostCard key={post.id} post={post} currentUserId={user?.id} onPostDeleted={handleProfilePostDeleted} />
                        ))}
                      </div>
                    ),
                    about: (
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          {profileUser.bio ? (
                            <div>
                              <h3 className="font-semibold mb-3 text-sm sm:text-base">Bio</h3>
                              <p className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-pre-wrap">{profileUser.bio}</p>
                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                              No bio yet. Edit your profile to add one!
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ),
                    cv: (
                      <CVSection
                        education={educations}
                        experiences={experiences}
                        achievements={achievements}
                        portfolios={portfolios}
                        isOwnProfile={true}
                        onAddEducation={() => { setEditingEducation(null); setEducationDialogOpen(true); }}
                        onEditEducation={(id) => { setEditingEducation(educations.find(e => e.id === id) || null); setEducationDialogOpen(true); }}
                        onDeleteEducation={handleDeleteEducation}
                        onAddExperience={() => { setEditingExperience(null); setExperienceDialogOpen(true); }}
                        onEditExperience={(id) => { setEditingExperience(experiences.find(e => e.id === id) || null); setExperienceDialogOpen(true); }}
                        onDeleteExperience={handleDeleteExperience}
                        onAddAchievement={() => { setEditingAchievement(null); setAchievementDialogOpen(true); }}
                        onEditAchievement={(id) => { setEditingAchievement(achievements.find(a => a.id === id) || null); setAchievementDialogOpen(true); }}
                        onDeleteAchievement={handleDeleteAchievement}
                        onAddPortfolio={() => { setEditingPortfolio(null); setPortfolioDialogOpen(true); }}
                        onEditPortfolio={(id) => { setEditingPortfolio(portfolios.find(p => p.id === id) || null); setPortfolioDialogOpen(true); }}
                        onDeletePortfolio={handleDeletePortfolio}
                      />
                    ),
                    portfolio: portfolios.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No portfolio projects yet.</p>
                        <Button variant="outline" className="mt-4" onClick={() => { setEditingPortfolio(null); setPortfolioDialogOpen(true); }}>
                          Add Portfolio
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {portfolios.map((portfolio) => (
                          <PortfolioCard
                            key={portfolio.id}
                            {...portfolio}
                            isOwnProfile={true}
                            onEdit={(id) => { setEditingPortfolio(portfolios.find(p => p.id === id) || null); setPortfolioDialogOpen(true); }}
                            onDelete={handleDeletePortfolio}
                          />
                        ))}
                      </div>
                    ),
                    friends: (
                      <UserFriendsList userId={profileUser.id} />
                    ),
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-20">
                <User className="size-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEWING USER PROFILE */}
        {viewingUserId && (
          <motion.div key="viewing-user" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto p-3 sm:p-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewingUserId(null)} 
              className="mb-3 sm:mb-4 gap-2 h-8 sm:h-9"
            >
              <ArrowLeft className="size-4" />
              <span className="text-sm">Back</span>
            </Button>
            
            {isLoadingViewingUser ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : viewingUser ? (
              <div className="space-y-4 sm:space-y-6">
                <ProfileHeader
                  user={viewingUser}
                  isOwnProfile={false}
                  friendshipStatus={friendshipStatus}
                  onAddFriend={() => {
                    // Handle send friend request
                    fetch(`/api/friends/requests`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ friendId: viewingUser.id }),
                    }).then(res => {
                      if (res.ok) {
                        toast({ title: 'Friend request sent!' })
                        // Refresh friendship status
                        fetch(`/api/friends/status/${viewingUser.id}`).then(r => r.json()).then(setFriendshipStatus)
                      }
                    })
                  }}
                  onMessage={async () => {
                    // Create or get conversation with this user
                    try {
                      const response = await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ participantIds: [viewingUser.id] }),
                      })
                      if (response.ok) {
                        const data = await response.json()
                        // Navigate to messages
                        setViewingUserId(null)
                        setCurrentView('messages')
                        // Set the conversation
                        if (data.conversation) {
                          const newConv: ConversationData = {
                            id: data.conversation.id,
                            createdAt: data.conversation.createdAt,
                            updatedAt: data.conversation.updatedAt,
                            participants: [{
                              id: viewingUser.id,
                              name: viewingUser.name,
                              username: viewingUser.username,
                              avatar: viewingUser.avatar,
                              headline: viewingUser.headline,
                            }],
                            lastMessage: null,
                            unreadCount: 0,
                          }
                          setSelectedConversation(newConv)
                          setMessages([])
                          fetchMessages(data.conversation.id)
                        }
                      }
                    } catch (error) {
                      console.error('Failed to start conversation:', error)
                      toast({ title: 'Error', description: 'Failed to start conversation', variant: 'destructive' })
                    }
                  }}
                />
                
                <ProfileStats
                  friendsCount={viewingUser?.friendsCount || 0}
                  postsCount={viewingUserPosts.length}
                  experiencesCount={viewingUserExperience?.length || 0}
                  achievementsCount={viewingUserAchievements?.length || 0}
                />
                
                <ProfileTabs
                  tabContent={{
                    posts: viewingUserPosts.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">No posts yet</div>
                    ) : (
                      <div className="space-y-4">
                        {viewingUserPosts.map((post) => (
                          <PostCard key={post.id} post={post} currentUserId={user?.id} onPostDeleted={handleViewingUserPostDeleted} />
                        ))}
                      </div>
                    ),
                    about: (
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          {viewingUser?.bio ? (
                            <div>
                              <h3 className="font-semibold mb-3 text-sm sm:text-base">Bio</h3>
                              <p className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-pre-wrap">{viewingUser.bio}</p>
                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                              No bio yet.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ),
                    cv: (
                      <CVSection
                        education={viewingUserEducation || []}
                        experiences={viewingUserExperience || []}
                        achievements={viewingUserAchievements || []}
                        portfolios={viewingUserPortfolios || []}
                        isOwnProfile={false}
                      />
                    ),
                    portfolio: (viewingUserPortfolios || []).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No portfolio projects yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(viewingUserPortfolios || []).map((portfolio) => (
                          <PortfolioCard
                            key={portfolio.id}
                            {...portfolio}
                            isOwnProfile={false}
                          />
                        ))}
                      </div>
                    ),
                    friends: viewingUser ? (
                      <UserFriendsList userId={viewingUser.id} />
                    ) : null,
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-20">
                <User className="size-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">User not found</h2>
              </div>
            )}
          </motion.div>
        )}

        {/* FRIENDS VIEW */}
        {currentView === 'friends' && !viewingUserId && (
          <motion.div key="friends" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Users className="size-5 sm:size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Friends</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Connect with your campus community</p>
              </div>
            </div>
            
            {/* User Search */}
            <div className="mb-4 sm:mb-6">
              <UserSearch 
                placeholder="Search for friends..." 
                onUserSelect={(searchUser) => handleUserSelect(searchUser)}
              />
            </div>
            
            <Tabs value={friendsTab} onValueChange={(v) => setFriendsTab(v as 'friends' | 'requests' | 'suggestions')} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-10 sm:h-11">
                <TabsTrigger value="friends" className="text-xs sm:text-sm">My Friends</TabsTrigger>
                <TabsTrigger value="requests" className="text-xs sm:text-sm">Requests</TabsTrigger>
                <TabsTrigger value="suggestions" className="text-xs sm:text-sm">Suggestions</TabsTrigger>
              </TabsList>
              <TabsContent value="friends"><FriendsList currentUserId={user?.id} /></TabsContent>
              <TabsContent value="requests"><FriendRequests currentUserId={user?.id} /></TabsContent>
              <TabsContent value="suggestions"><FriendSuggestions currentUserId={user?.id} /></TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* GROUPS VIEW */}
        {currentView === 'groups' && !selectedGroup && !viewingUserId && (
          <motion.div key="groups" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                  <Users className="size-5 sm:size-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Groups</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Terhubung dengan komunitas</p>
                </div>
              </div>
              <Button onClick={() => setCreateGroupOpen(true)} size="sm" className="gap-1.5 h-8 sm:h-9">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Buat Group</span>
                <span className="sm:hidden">Buat</span>
              </Button>
            </div>
            
            {isLoadingGroups ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
              </div>
            ) : (
              <GroupsList
                groups={groups}
                isLoading={false}
                hasMore={false}
                onLoadMore={() => {}}
                onJoinGroup={handleJoinGroup}
                onLeaveGroup={handleLeaveGroup}
                onGroupClick={(id) => fetchGroupDetails(id)}
                joiningGroupId={joiningGroupId}
              />
            )}
          </motion.div>
        )}

        {/* GROUP DETAIL VIEW */}
        {currentView === 'groups' && selectedGroup && !viewingUserId && (
          <motion.div key="group-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto p-3 sm:p-4">
            <GroupHeader
              group={selectedGroup}
              onJoin={() => handleJoinGroup(selectedGroup.id)}
              onLeave={() => handleLeaveGroup(selectedGroup.id)}
              onDelete={() => handleDeleteGroup(selectedGroup.id)}
              onShare={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Link copied' }); }}
              isJoiningOrLeaving={joiningGroupId === selectedGroup.id}
              isDeleting={joiningGroupId === selectedGroup.id}
            />
            
            <Tabs defaultValue="posts" className="mt-4 sm:mt-6">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-11">
                <TabsTrigger value="posts" className="text-xs sm:text-sm">Posts</TabsTrigger>
                <TabsTrigger value="members" className="text-xs sm:text-sm">Members</TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                {/* Create Post in Group - Only if member */}
                {selectedGroup.isMember && (
                  <CreatePost 
                    currentUser={user}
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                    placeholder={`Post in ${selectedGroup.name}...`}
                    onPostCreated={() => fetchGroupDetails(selectedGroup.id)}
                  />
                )}
                
                {groupPosts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-muted-foreground">
                    No posts yet. {selectedGroup.isMember ? 'Be the first to post!' : 'Join the group to start posting!'}
                  </div>
                ) : (
                  <div className="space-y-4">{groupPosts.map((post) => <PostCard key={post.id} post={post} currentUserId={user?.id} onPostDeleted={handleGroupPostDeleted} />)}</div>
                )}
              </TabsContent>
              <TabsContent value="members">
                <GroupMembers members={groupMembers} isLoading={false} currentUserId={user?.id} isAdmin={selectedGroup.isCreator || selectedGroup.memberRole === 'admin'} />
              </TabsContent>
            </Tabs>
            
            <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
              <Button variant="secondary" onClick={() => setSelectedGroup(null)}>Back to Groups</Button>
            </div>
          </motion.div>
        )}

        {/* MESSAGES VIEW */}
        {currentView === 'messages' && !viewingUserId && (
          <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-[calc(100vh-60px)] md:h-[calc(100vh-20px)] p-2 sm:p-3 md:p-4">
            <div className="flex h-full max-w-5xl mx-auto bg-card rounded-lg border shadow-sm overflow-hidden">
              {/* Conversations List - Hidden on mobile when viewing a conversation */}
              <div className={cn(
                "w-full md:w-80 lg:w-96 border-r flex-shrink-0 bg-card",
                selectedConversation && "hidden md:block"
              )}>
                <ConversationsList
                  conversations={conversations}
                  isLoading={isLoadingConversations}
                  selectedId={selectedConversation?.id}
                  onSelectConversation={handleSelectConversation}
                  onStartNewChat={() => setNewChatOpen(true)}
                  currentUserId={user?.id}
                />
              </div>

              {/* Conversation View - Full width on mobile, hidden when no conversation selected */}
              <div className={cn(
                "flex-1 flex flex-col bg-card min-h-0",
                !selectedConversation && "hidden md:flex md:items-center md:justify-center"
              )}>
                {selectedConversation ? (
                  <ConversationView
                    conversation={selectedConversation}
                    messages={messages}
                    currentUserId={user?.id}
                    isLoading={isLoadingMessages}
                    isSending={isSendingMessage}
                    onBack={() => setSelectedConversation(null)}
                    onSendMessage={handleSendMessage}
                    onRefresh={handleRefreshMessages}
                    isRefreshing={isRefreshingMessages}
                    onClearChat={handleClearChat}
                    onViewProfile={(userId) => {
                      setSelectedConversation(null)
                      viewUserProfile(userId)
                    }}
                  />
                ) : (
                  <div className="text-center p-8">
                    <MessageCircle className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Pilih percakapan untuk mulai mengobrol</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* EVENTS VIEW */}
        {currentView === 'events' && !viewingUserId && !selectedEvent && (
          <motion.div key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto p-3 sm:p-4">
            <EventsList
              onSelectEvent={(event) => setSelectedEvent(event)}
              onCreateEvent={() => setCreateEventOpen(true)}
              refreshKey={eventsRefreshKey}
            />
          </motion.div>
        )}

        {/* EVENT DETAIL VIEW */}
        {currentView === 'events' && selectedEvent && !viewingUserId && (
          <motion.div key="event-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto p-3 sm:p-4">
            <EventDetail
              event={selectedEvent}
              currentUserId={user?.id}
              onBack={() => setSelectedEvent(null)}
              onEdit={(event) => {
                setEditingEvent(event)
                setCreateEventOpen(true)
              }}
              onDelete={(eventId) => {
                setSelectedEvent(null)
              }}
              onAttendanceChange={() => {
                // Refresh the event data
                fetch(`/api/events/${selectedEvent.id}`).then(res => res.json()).then(data => {
                  if (data) setSelectedEvent(data)
                })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== DIALOGS ========== */}
      
      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={profileUser}
        onSave={async (data) => {
          try {
            const response = await fetch('/api/users/me', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (response.ok) {
              toast({ title: 'Success', description: 'Profile updated!' })
              setEditProfileOpen(false)
              fetchProfileData()
              fetchCurrentUser()
            } else {
              toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
            }
          } catch {
            toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
          }
        }}
      />
      
      {/* Education Dialog */}
      <EducationDialog
        open={educationDialogOpen}
        onOpenChange={(open) => { setEducationDialogOpen(open); if (!open) setEditingEducation(null); }}
        education={editingEducation ? {
          id: editingEducation.id,
          institution: editingEducation.institution,
          degree: editingEducation.degree,
          field: editingEducation.field,
          startDate: new Date(editingEducation.startDate).toISOString().split('T')[0].slice(0, 7),
          endDate: editingEducation.endDate ? new Date(editingEducation.endDate).toISOString().split('T')[0].slice(0, 7) : null,
          description: editingEducation.description,
        } : null}
        onSave={handleSaveEducation}
        isLoading={isSaving}
      />
      
      {/* Experience Dialog */}
      <ExperienceDialog
        open={experienceDialogOpen}
        onOpenChange={(open) => { setExperienceDialogOpen(open); if (!open) setEditingExperience(null); }}
        experience={editingExperience ? {
          id: editingExperience.id,
          company: editingExperience.company,
          position: editingExperience.position,
          location: editingExperience.location,
          startDate: new Date(editingExperience.startDate).toISOString().split('T')[0].slice(0, 7),
          endDate: editingExperience.endDate ? new Date(editingExperience.endDate).toISOString().split('T')[0].slice(0, 7) : null,
          current: editingExperience.current,
          description: editingExperience.description,
        } : null}
        onSave={handleSaveExperience}
        isLoading={isSaving}
      />
      
      {/* Achievement Dialog */}
      <AchievementDialog
        open={achievementDialogOpen}
        onOpenChange={(open) => { setAchievementDialogOpen(open); if (!open) setEditingAchievement(null); }}
        achievement={editingAchievement ? {
          id: editingAchievement.id,
          title: editingAchievement.title,
          description: editingAchievement.description,
          date: editingAchievement.date ? new Date(editingAchievement.date).toISOString().split('T')[0] : null,
          issuer: editingAchievement.issuer,
        } : null}
        onSave={handleSaveAchievement}
        isLoading={isSaving}
      />
      
      {/* Portfolio Dialog */}
      <PortfolioDialog
        open={portfolioDialogOpen}
        onOpenChange={(open) => { setPortfolioDialogOpen(open); if (!open) setEditingPortfolio(null); }}
        portfolio={editingPortfolio ? {
          id: editingPortfolio.id,
          title: editingPortfolio.title,
          description: editingPortfolio.description,
          link: editingPortfolio.link,
          images: safeParseArray(editingPortfolio.images),
          technologies: safeParseArray(editingPortfolio.technologies),
        } : null}
        onSave={handleSavePortfolio}
        isLoading={isSaving}
      />
      
      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={() => fetchGroups()}
      />
      
      {/* New Chat Dialog */}
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        friends={friends}
        isLoading={false}
        onStartConversation={handleStartNewConversation}
      />
      
      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={(open) => { 
          setCreateEventOpen(open)
          if (!open) setEditingEvent(null)
        }}
        eventToEdit={editingEvent}
        onEventCreated={() => {
          setEditingEvent(null)
          setSelectedEvent(null)
          setEventsRefreshKey(prev => prev + 1) // Refresh events list
        }}
      />
    </MainLayout>
  )
}

// ==================== AUTH PAGES COMPONENT ====================
function AuthPages({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = React.useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: formData.email,
            password: formData.password,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({ title: 'Welcome back!', description: 'Login successful' })
          onLoginSuccess()
        } else {
          toast({ title: 'Login failed', description: data.error || 'Invalid credentials', variant: 'destructive' })
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({ title: 'Account created!', description: 'Please login with your credentials' })
          setIsLogin(true)
          setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }))
        } else {
          toast({ title: 'Registration failed', description: data.error || 'Failed to create account', variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <img 
            src="/logo-ikmi.png" 
            alt="IKMI Logo" 
            className="size-32 mx-auto mb-6 object-contain drop-shadow-xl"
          />
          <h1 className="text-5xl font-bold mb-4 text-primary">IKMI SOCIAL</h1>
          <p className="text-xl text-muted-foreground mb-8">Sekolah Tinggi Manajemen Informatika dan Komputer</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-background/50 backdrop-blur">
              <Users className="size-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Connect</p>
              <p className="text-sm text-muted-foreground">With friends</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 backdrop-blur">
              <User className="size-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Profile</p>
              <p className="text-sm text-muted-foreground">Build your CV</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 backdrop-blur">
              <ImageIcon className="size-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Share</p>
              <p className="text-sm text-muted-foreground">Your moments</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <img 
              src="/logo-ikmi.png" 
              alt="IKMI Logo" 
              className="size-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-primary">IKMI SOCIAL</h1>
            <p className="text-muted-foreground">STMIK IKMI Cirebon</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
              <CardDescription>{isLogin ? 'Login to continue to IKMI SOCIAL' : 'Join the IKMI community today'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" placeholder="johndoe" value={formData.username} onChange={handleInputChange} required />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="email@example.com" value={formData.email} onChange={handleInputChange} className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} className="pl-10" required />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : isLogin ? <><LogOut className="size-4 mr-2" />Login</> : <><UserPlus className="size-4 mr-2" />Register</>}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Separator className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', username: '', email: formData.email, password: '', confirmPassword: '' }); }} className="ml-2 text-primary hover:underline font-medium">
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
