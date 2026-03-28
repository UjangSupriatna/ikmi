import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - List group members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const role = searchParams.get('role') // Filter by role if provided

    // Check if group exists
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        privacy: true,
        createdById: true,
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
          { error: 'You do not have access to view members of this private group' },
          { status: 403 }
        )
      }
    }

    // Build where clause
    const whereClause: { groupId: string; role?: string } = { groupId: id }
    if (role && ['admin', 'moderator', 'member'].includes(role)) {
      whereClause.role = role
    }

    // Get members
    const members = await db.groupMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            headline: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // admins first, then moderators, then members
        { joinedAt: 'asc' },
      ],
      skip,
      take: limit,
    })

    // Get total count
    const total = await db.groupMember.count({
      where: whereClause,
    })

    // Transform members and add creator flag
    const transformedMembers = members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      username: member.user.username,
      avatar: member.user.avatar,
      headline: member.user.headline,
      role: member.role,
      isCreator: member.user.id === group.createdById,
      joinedAt: member.joinedAt,
    }))

    // Group by role for easier frontend display
    const admins = transformedMembers.filter(m => m.role === 'admin' || m.isCreator)
    const moderators = transformedMembers.filter(m => m.role === 'moderator')
    const regularMembers = transformedMembers.filter(m => m.role === 'member' && !m.isCreator)

    return NextResponse.json({
      members: transformedMembers,
      groupedByRole: {
        admins,
        moderators,
        members: regularMembers,
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    )
  }
}
