import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Helper to safely parse images
function parseImages(imagesJson: string | null): string[] {
  if (!imagesJson) return []
  
  try {
    const parsed = JSON.parse(imagesJson)
    
    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn('Images is not an array:', parsed)
      return []
    }
    
    // Filter out null/undefined and ensure strings
    return parsed.filter(img => img && typeof img === 'string')
  } catch (error) {
    console.error('Error parsing images JSON:', error)
    return []
  }
}

// GET /api/users/[id]/posts - Get user's posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const posts = await db.post.findMany({
      where: {
        authorId: id,
        groupId: null,
        visibility: 'public',
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(currentUser && {
          likes: {
            where: { userId: currentUser.id },
            select: { id: true },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const totalPosts = await db.post.count({
      where: {
        authorId: id,
        groupId: null,
        visibility: 'public',
      },
    })

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      images: parseImages(post.images),
      visibility: post.visibility,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: currentUser ? (post.likes as unknown[])?.length > 0 : false,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    })
  } catch (error) {
    console.error('Get user posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
