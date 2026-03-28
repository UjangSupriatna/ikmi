import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me - Get current user's full profile
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
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

    // Calculate total friends count - count all accepted friendships in both directions
    const acceptedAsUser = await db.friendship.count({
      where: { userId: currentUser.id, status: 'accepted' },
    })
    const acceptedAsFriend = await db.friendship.count({
      where: { friendId: currentUser.id, status: 'accepted' },
    })
    const friendsCount = acceptedAsUser + acceptedAsFriend

    const responseData = {
      ...user,
      friendsCount,
      postsCount: user._count.posts,
      isOwnProfile: true,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
      where: { id: currentUser.id },
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
        email: true,
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
    console.error('Update current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
