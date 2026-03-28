import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/friends/suggestions - Get friend suggestions based on mutual friends
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user's friends
    const userFriendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: currentUser.id, status: 'accepted' },
          { friendId: currentUser.id, status: 'accepted' }
        ]
      },
      select: {
        userId: true,
        friendId: true
      }
    })

    // Extract friend IDs
    const friendIds = new Set<string>()
    userFriendships.forEach(f => {
      if (f.userId === currentUser.id) {
        friendIds.add(f.friendId)
      } else {
        friendIds.add(f.userId)
      }
    })

    // Get friends of friends (potential suggestions)
    const friendsOfFriends = await db.friendship.findMany({
      where: {
        OR: [
          { userId: { in: Array.from(friendIds) }, status: 'accepted' },
          { friendId: { in: Array.from(friendIds) }, status: 'accepted' }
        ],
        AND: [
          // Exclude existing relationships with current user
          {
            NOT: {
              OR: [
                { userId: currentUser.id },
                { friendId: currentUser.id }
              ]
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            headline: true,
          }
        },
        friend: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            headline: true,
          }
        }
      }
    })

    // Check for existing pending/rejected requests
    const existingRelationships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { friendId: currentUser.id }
        ]
      },
      select: {
        userId: true,
        friendId: true,
        status: true
      }
    })

    // Map of user ID to relationship status
    const relationshipMap = new Map<string, string>()
    existingRelationships.forEach(r => {
      const otherId = r.userId === currentUser.id ? r.friendId : r.userId
      relationshipMap.set(otherId, r.status)
    })

    // Count mutual friends and build suggestions
    const suggestionMap = new Map<string, {
      user: {
        id: string
        name: string
        username: string
        avatar: string | null
        headline: string | null
      }
      mutualFriendsCount: number
      mutualFriendIds: string[]
    }>()

    friendsOfFriends.forEach(fof => {
      // Determine which user is the potential suggestion
      let potentialFriendId: string
      let potentialFriend: typeof fof.user
      let mutualFriendId: string

      if (friendIds.has(fof.userId)) {
        // fof.user is a friend, fof.friend is the potential suggestion
        potentialFriendId = fof.friendId
        potentialFriend = fof.friend
        mutualFriendId = fof.userId
      } else {
        // fof.friend is a friend, fof.user is the potential suggestion
        potentialFriendId = fof.userId
        potentialFriend = fof.user
        mutualFriendId = fof.friendId
      }

      // Skip if this is the current user or already a friend
      if (potentialFriendId === currentUser.id || friendIds.has(potentialFriendId)) {
        return
      }

      // Skip if there's an existing relationship (pending, accepted, or blocked)
      // Note: rejected status is not used - rejection deletes the record
      const existingStatus = relationshipMap.get(potentialFriendId)
      if (existingStatus) {
        return
      }

      // Add or update in map
      const existing = suggestionMap.get(potentialFriendId)
      if (existing) {
        if (!existing.mutualFriendIds.includes(mutualFriendId)) {
          existing.mutualFriendsCount++
          existing.mutualFriendIds.push(mutualFriendId)
        }
      } else {
        suggestionMap.set(potentialFriendId, {
          user: potentialFriend,
          mutualFriendsCount: 1,
          mutualFriendIds: [mutualFriendId]
        })
      }
    })

    // Sort by mutual friends count and limit to top 10
    const suggestions = Array.from(suggestionMap.values())
      .sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount)
      .slice(0, 10)
      .map(s => ({
        id: s.user.id,
        name: s.user.name,
        username: s.user.username,
        avatar: s.user.avatar,
        headline: s.user.headline,
        mutualFriendsCount: s.mutualFriendsCount
      }))

    // If we don't have enough suggestions, add some random users
    // Exclude users with existing relationship (pending, accepted, blocked)
    if (suggestions.length < 5) {
      const excludeIds = [
        currentUser.id,
        ...friendIds,
        ...suggestions.map(s => s.id),
        ...Array.from(relationshipMap.keys()) // Exclude all users with any relationship status
      ]
      
      const additionalUsers = await db.user.findMany({
        where: {
          id: {
            notIn: excludeIds
          }
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
        take: 5 - suggestions.length
      })

      additionalUsers.forEach(user => {
        suggestions.push({
          ...user,
          mutualFriendsCount: 0
        })
      })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching friend suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
