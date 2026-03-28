import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/friends/requests/[id]/reject - Reject a friend request
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
      where: { id }
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
        { error: 'Not authorized to reject this request' },
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

    // Delete the friend request - this allows the sender to try again later
    // Rejection is not permanent blocking, just declining this request
    await db.friendship.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Friend request rejected',
      deleted: true
    })
  } catch (error) {
    console.error('Error rejecting friend request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
