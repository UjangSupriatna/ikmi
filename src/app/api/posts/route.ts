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

// GET - Fetch feed posts (public posts from all users)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const posts = await db.post.findMany({
      where: {
        visibility: 'public',
        groupId: null, // Only non-group posts in main feed
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
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Transform posts to include isLiked by current user
    const transformedPosts = posts.map((post) => ({
      ...post,
      images: parseImages(post.images),
      isLiked: currentUser 
        ? post.likes.some((like) => like.userId === currentUser.id)
        : false,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    }))

    // Get total count for pagination
    const total = await db.post.count({
      where: {
        visibility: 'public',
        groupId: null,
      },
    })

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST - Create a new post
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
    const { content, images, visibility = 'public', location } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Post content is too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Validate images array
    let imageData: string[] = []
    if (images && Array.isArray(images)) {
      if (images.length > 4) {
        return NextResponse.json(
          { error: 'Maximum 4 images allowed per post' },
          { status: 400 }
        )
      }
      imageData = images
    }

    const post = await db.post.create({
      data: {
        content: content.trim(),
        images: imageData.length > 0 ? JSON.stringify(imageData) : null,
        location: location?.trim() || null,
        visibility,
        authorId: currentUser.id,
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
            comments: true,
            likes: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...post,
      images: imageData,
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
