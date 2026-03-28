import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/comments/[id]/like - Like a comment
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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

    // Check if comment exists
    const comment = await db.comment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await db.like.findUnique({
      where: {
        userId_commentId: {
          userId: currentUser.id,
          commentId: id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      )
    }

    // Create like
    await db.like.create({
      data: {
        userId: currentUser.id,
        commentId: id,
      },
    })

    // Get total like count
    const likeCount = await db.like.count({
      where: { commentId: id },
    })

    return NextResponse.json({
      isLiked: true,
      likeCount,
    })
  } catch (error) {
    console.error('Error liking comment:', error)
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id]/like - Unlike a comment
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    // Find and delete the like
    const like = await db.like.findUnique({
      where: {
        userId_commentId: {
          userId: currentUser.id,
          commentId: id,
        },
      },
    })

    if (!like) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }

    await db.like.delete({
      where: {
        userId_commentId: {
          userId: currentUser.id,
          commentId: id,
        },
      },
    })

    // Get total like count
    const likeCount = await db.like.count({
      where: { commentId: id },
    })

    return NextResponse.json({
      isLiked: false,
      likeCount,
    })
  } catch (error) {
    console.error('Error unliking comment:', error)
    return NextResponse.json(
      { error: 'Failed to unlike comment' },
      { status: 500 }
    )
  }
}
