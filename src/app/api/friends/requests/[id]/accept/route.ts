import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/friends/requests/[id]/accept - Accept a friend request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find the friend request
    const friendship = await db.friendship.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      }
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Verify this request is for the current user
    if (friendship.friendId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Not authorized to accept this request' },
        { status: 403 }
      )
    }

    // Check if already processed
    if (friendship.status !== 'pending') {
      return NextResponse.json(
        { error: `Friend request already ${friendship.status}` },
        { status: 400 }
      )
    }

    // Accept the friend request
    const updated = await db.friendship.update({
      where: { id },
      data: { status: 'accepted' },
      include: {
        user: {
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

    // Create notification for the requester
    await db.notification.create({
      data: {
        userId: updated.userId,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${currentUser.name} accepted your friend request`,
        data: JSON.stringify({
          friendId: currentUser.id,
          friendshipId: updated.id
        })
      }
    })

    return NextResponse.json({
      message: 'Friend request accepted',
      friend: {
        id: updated.id,
        friendId: updated.user.id,
        name: updated.user.name,
        username: updated.user.username,
        avatar: updated.user.avatar,
        headline: updated.user.headline,
      }
    })
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
