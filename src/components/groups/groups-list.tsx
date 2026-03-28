'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Users, Search, Plus, Frown } from 'lucide-react'

import { GroupCard, GroupData } from './group-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface GroupsListProps {
  groups: GroupData[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onJoinGroup?: (groupId: string) => void
  onLeaveGroup?: (groupId: string) => void
  onGroupClick?: (groupId: string) => void
  onSearch?: (query: string) => void
  onCreateGroup?: () => void
  joiningGroupId?: string | null
  showCreateButton?: boolean
  showSearch?: boolean
  emptyMessage?: string
}

export function GroupsList({
  groups,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onJoinGroup,
  onLeaveGroup,
  onGroupClick,
  onSearch,
  onCreateGroup,
  joiningGroupId,
  showCreateButton = true,
  showSearch = true,
  emptyMessage = 'No groups found',
}: GroupsListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  // Loading skeleton
  if (isLoading && groups.length === 0) {
    return (
      <div className="space-y-6">
        {showSearch && (
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 flex-1" />
            {showCreateButton && <Skeleton className="h-10 w-32" />}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border overflow-hidden">
              <Skeleton className="h-24 w-full" />
              <div className="p-4 pt-8">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Create */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          {showCreateButton && onCreateGroup && (
            <Button onClick={onCreateGroup} className="gap-2 shrink-0">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Buat Group</span>
              <span className="sm:hidden">Buat</span>
            </Button>
          )}
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Users className="size-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {showCreateButton
              ? 'Jadilah yang pertama membuat group dan menghubungkan orang-orang!'
              : 'Coba ubah pencarian atau filter Anda.'}
          </p>
          {showCreateButton && onCreateGroup && (
            <Button onClick={onCreateGroup} className="gap-2">
              <Plus className="size-4" />
              Buat Group
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <GroupCard
                    group={group}
                    onJoin={onJoinGroup}
                    onLeave={onLeaveGroup}
                    onClick={onGroupClick}
                    isJoining={joiningGroupId === group.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  'Lihat Lebih Banyak'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
