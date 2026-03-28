import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE /api/friends/[id] - Unfriend a user
export async function DELETE(
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
    const friendId = id // The ID passed is the friend's user ID

    // Find the friendship
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUser.id, friendId, status: 'accepted' },
          { userId: friendId, friendId: currentUser.id, status: 'accepted' }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      )
    }

    // Delete the friendship
    await db.friendship.delete({
      where: { id: friendship.id }
    })

    return NextResponse.json({
      message: 'Friend removed successfully'
    })
  } catch (error) {
    console.error('Error unfriending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
