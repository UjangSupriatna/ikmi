import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get user profile by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        headline: true,
        skills: true,
        phone: true,
        address: true,
        website: true,
        birthday: true,
        gender: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            friendships: { where: { status: 'accepted' } },
            friendRequests: { where: { status: 'accepted' } },
          },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        achievements: {
          orderBy: { date: 'desc' },
        },
        portfolios: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check friendship status if viewing another user's profile
    let friendshipStatus = null
    if (currentUser && currentUser.id !== id) {
      const friendship = await db.friendship.findFirst({
        where: {
          OR: [
            { userId: currentUser.id, friendId: id },
            { userId: id, friendId: currentUser.id },
          ],
        },
      })
      if (friendship) {
        friendshipStatus = {
          status: friendship.status,
          isSender: friendship.userId === currentUser.id,
        }
      }
    }

    // Calculate total friends count - count all accepted friendships in both directions
    const acceptedAsUser = await db.friendship.count({
      where: { userId: id, status: 'accepted' },
    })
    const acceptedAsFriend = await db.friendship.count({
      where: { friendId: id, status: 'accepted' },
    })
    const friendsCount = acceptedAsUser + acceptedAsFriend

    // Parse portfolio JSON fields
    const parsedPortfolios = user.portfolios.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      technologies: p.technologies ? JSON.parse(p.technologies) : [],
    }))

    const responseData = {
      ...user,
      portfolios: parsedPortfolios,
      friendsCount,
      postsCount: user._count.posts,
      friendshipStatus,
      isOwnProfile: currentUser?.id === id,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user profile (only own profile)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (currentUser.id !== id) {
      return NextResponse.json(
        { error: 'You can only update your own profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      bio,
      headline,
      skills,
      phone,
      address,
      website,
      avatar,
      coverPhoto,
      birthday,
      gender,
    } = body

    // Validate skills format if provided
    if (skills !== undefined && skills !== null) {
      try {
        JSON.parse(skills)
      } catch {
        return NextResponse.json(
          { error: 'Skills must be a valid JSON array' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(headline !== undefined && { headline }),
        ...(skills !== undefined && { skills }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(website !== undefined && { website }),
        ...(avatar !== undefined && { avatar }),
        ...(coverPhoto !== undefined && { coverPhoto }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
        ...(gender !== undefined && { gender }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        headline: true,
        skills: true,
        phone: true,
        address: true,
        website: true,
        birthday: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
