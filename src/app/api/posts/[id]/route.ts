import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Fetch a single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const { id } = await params

    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user can view this post
    if (post.visibility !== 'public' && post.authorId !== currentUser?.id) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      isLiked: currentUser 
        ? post.likes.some((like) => like.userId === currentUser.id)
        : false,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a post
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

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.authorId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      )
    }

    // Use transaction to delete all related data in correct order
    await db.$transaction(async (tx) => {
      // 1. Delete all likes on comments first
      const commentIds = await tx.comment.findMany({
        where: { postId: id },
        select: { id: true },
      })
      
      if (commentIds.length > 0) {
        await tx.like.deleteMany({
          where: { 
            commentId: { in: commentIds.map(c => c.id) } 
          },
        })
      }

      // 2. Delete all likes on the post
      await tx.like.deleteMany({
        where: { postId: id },
      })

      // 3. Delete all comments (replies will be cascade deleted due to schema)
      await tx.comment.deleteMany({
        where: { postId: id },
      })

      // 4. Finally delete the post
      await tx.post.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}