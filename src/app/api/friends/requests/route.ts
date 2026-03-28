import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/friends/requests - List pending friend requests
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get pending requests sent TO the current user
    const incomingRequests = await db.friendship.findMany({
      where: {
        friendId: currentUser.id,
        status: 'pending'
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get pending requests sent BY the current user
    const outgoingRequests = await db.friendship.findMany({
      where: {
        userId: currentUser.id,
        status: 'pending'
      },
      include: {
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

    // Transform incoming requests
    const incoming = incomingRequests.map(request => ({
      id: request.id,
      from: request.user,
      createdAt: request.createdAt
    }))

    // Transform outgoing requests
    const outgoing = outgoingRequests.map(request => ({
      id: request.id,
      to: request.friend,
      createdAt: request.createdAt
    }))

    return NextResponse.json({ 
      incoming,
      outgoing,
      totalIncoming: incoming.length,
      totalOutgoing: outgoing.length
    })
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/friends/requests - Send a friend request
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { friendId } = body

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      )
    }

    // Can't send friend request to yourself
    if (friendId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if the target user exists
    const targetUser = await db.user.findUnique({
      where: { id: friendId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if a friendship already exists (in either direction)
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUser.id, friendId },
          { userId: friendId, friendId: currentUser.id }
        ]
      }
    })

    if (existingFriendship) {
      // Return appropriate message based on status
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends' },
          { status: 400 }
        )
      }

      if (existingFriendship.status === 'pending') {
        // If the other person sent the request, they should accept
        if (existingFriendship.userId === friendId) {
          return NextResponse.json(
            { error: 'This user already sent you a friend request. Accept it instead.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Friend request already sent' },
          { status: 400 }
        )
      }

      // If blocked, cannot send request
      if (existingFriendship.status === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot send friend request to this user' },
          { status: 400 }
        )
      }
    }

    // Create new friend request
    const friendship = await db.friendship.create({
      data: {
        userId: currentUser.id,
        friendId,
        status: 'pending'
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      }
    })

    // Create notification for the recipient
    await db.notification.create({
      data: {
        userId: friendId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${currentUser.name} sent you a friend request`,
        data: JSON.stringify({
          fromUserId: currentUser.id,
          friendshipId: friendship.id
        })
      }
    })

    return NextResponse.json({
      message: 'Friend request sent',
      request: {
        id: friendship.id,
        to: friendship.friend,
        status: friendship.status
      }
    })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
