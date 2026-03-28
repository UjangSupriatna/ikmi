import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/friends - List all friends for a user (current user or specified user)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if requesting friends for a specific user
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    const userId = targetUserId || currentUser.id

    // Get all accepted friendships where user is either userId or friendId
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to always return the friend's data
    const friends = friendships.map(friendship => {
      const friend = friendship.userId === userId 
        ? friendship.friend 
        : friendship.user
      return {
        id: friendship.id,
        friendId: friend.id,
        name: friend.name,
        username: friend.username,
        avatar: friend.avatar,
        headline: friend.headline,
        friendsSince: friendship.updatedAt // When friendship was accepted
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
