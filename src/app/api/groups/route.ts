import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - List all groups (public groups visible to everyone, private only to members)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}

    const groups = await db.group.findMany({
      where: {
        ...whereClause,
        OR: [
          { privacy: 'public' },
          ...(currentUser
            ? [
                {
                  privacy: 'private' as const,
                  members: { some: { userId: currentUser.id } },
                },
              ]
            : []),
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
        ...(currentUser && {
          members: {
            where: { userId: currentUser.id },
            select: { role: true },
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Transform groups
    const transformedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      avatar: group.avatar,
      privacy: group.privacy,
      createdBy: group.createdBy,
      memberCount: group._count.members,
      postCount: group._count.posts,
      isMember: currentUser ? group.members.length > 0 : false,
      memberRole: currentUser && group.members.length > 0 ? group.members[0].role : null,
      isCreator: currentUser ? group.createdById === currentUser.id : false,
      createdAt: group.createdAt,
    }))

    // Get total count
    const total = await db.group.count({
      where: {
        ...whereClause,
        OR: [
          { privacy: 'public' },
          ...(currentUser
            ? [
                {
                  privacy: 'private' as const,
                  members: { some: { userId: currentUser.id } },
                },
              ]
            : []),
        ],
      },
    })

    return NextResponse.json({
      groups: transformedGroups,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST - Create a new group
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
    const { name, description, coverImage, avatar, privacy = 'public' } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Group name is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Create group and add creator as admin member
    const group = await db.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        coverImage,
        avatar,
        privacy,
        createdById: currentUser.id,
        members: {
          create: {
            userId: currentUser.id,
            role: 'admin',
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      avatar: group.avatar,
      privacy: group.privacy,
      createdBy: group.createdBy,
      memberCount: group._count.members,
      postCount: group._count.posts,
      isMember: true,
      memberRole: 'admin',
      isCreator: true,
      createdAt: group.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
