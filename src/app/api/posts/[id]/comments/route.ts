import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Fetch comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const { id: postId } = await params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Fetch only top-level comments (no parent)
    const comments = await db.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
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
        replies: {
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
            replies: {
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
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Transform comments to include isLiked
    const transformComment = (comment: typeof comments[0]) => ({
      ...comment,
      images: comment.images ? JSON.parse(comment.images) : [],
      isLiked: currentUser 
        ? comment.likes.some((like) => like.userId === currentUser.id)
        : false,
      likeCount: comment.likes.length,
      replies: comment.replies.map((reply) => ({
        ...reply,
        images: reply.images ? JSON.parse(reply.images) : [],
        isLiked: currentUser 
          ? reply.likes.some((like) => like.userId === currentUser.id)
          : false,
        likeCount: reply.likes.length,
        replies: reply.replies.map((nestedReply) => ({
          ...nestedReply,
          images: nestedReply.images ? JSON.parse(nestedReply.images) : [],
          isLiked: currentUser 
            ? nestedReply.likes.some((like) => like.userId === currentUser.id)
            : false,
          likeCount: nestedReply.likes.length,
        })),
      })),
    })

    const transformedComments = comments.map(transformComment)

    // Get total count
    const total = await db.comment.count({
      where: {
        postId,
        parentId: null,
      },
    })

    return NextResponse.json({
      comments: transformedComments,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Add a comment to a post
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

    const { id: postId } = await params
    const body = await request.json()
    const { content, parentId, images } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment content is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      })

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Validate images
    let imageData: string[] = []
    if (images && Array.isArray(images)) {
      if (images.length > 2) {
        return NextResponse.json(
          { error: 'Maximum 2 images allowed per comment' },
          { status: 400 }
        )
      }
      imageData = images
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        images: imageData.length > 0 ? JSON.stringify(imageData) : null,
        postId,
        authorId: currentUser.id,
        parentId: parentId || null,
      },
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
      },
    })

    return NextResponse.json({
      ...comment,
      images: imageData,
      isLiked: false,
      likeCount: 0,
      replies: [],
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
