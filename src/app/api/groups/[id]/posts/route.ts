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

// GET - Get group posts
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

    // Check if group exists and user has access
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        privacy: true,
        members: currentUser ? {
          where: { userId: currentUser.id },
          select: { id: true },
        } : false,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check access for private groups
    if (group.privacy === 'private') {
      if (!currentUser || !group.members || group.members.length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this group' },
          { status: 403 }
        )
      }
    }

    // Get posts
    const posts = await db.post.findMany({
      where: {
        groupId: id,
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

    // Transform posts
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      images: parseImages(post.images),
      visibility: post.visibility,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      isLiked: currentUser 
        ? post.likes.some((like) => like.userId === currentUser.id)
        : false,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    }))

    // Get total count
    const total = await db.post.count({
      where: { groupId: id },
    })

    return NextResponse.json({
      posts: transformedPosts,
      groupName: group.name,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching group posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group posts' },
      { status: 500 }
    )
  }
}

// POST - Create a post in the group
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
    const body = await request.json()
    const { content, images } = body

    // Check if group exists and user is a member
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        members: {
          where: { userId: currentUser.id },
          select: { id: true, role: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (group.members.length === 0) {
      return NextResponse.json(
        { error: 'You must be a member to post in this group' },
        { status: 403 }
      )
    }

    // Validate content
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

    // Validate images
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

    // Create post
    const post = await db.post.create({
      data: {
        content: content.trim(),
        images: imageData.length > 0 ? JSON.stringify(imageData) : null,
        visibility: 'public', // Group posts are always visible to members
        authorId: currentUser.id,
        groupId: id,
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
      id: post.id,
      content: post.content,
      images: imageData,
      visibility: post.visibility,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating group post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
