import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    const { id } = await params

    const group = await db.group.findUnique({
      where: { id },
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
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check access for private groups
    if (group.privacy === 'private') {
      if (!currentUser || group.members.length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this group' },
          { status: 403 }
        )
      }
    }

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
      isMember: currentUser ? group.members.length > 0 : false,
      memberRole: currentUser && group.members.length > 0 ? group.members[0].role : null,
      isCreator: currentUser ? group.createdById === currentUser.id : false,
      createdAt: group.createdAt,
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PUT - Update group (only creator or admin)
export async function PUT(
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
    const { name, description, coverImage, avatar, privacy } = body

    // Check if group exists and user has permission
    const group = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: currentUser.id },
          select: { role: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Only creator or admin can update
    const isCreator = group.createdById === currentUser.id
    const isAdmin = group.members.length > 0 && group.members[0].role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this group' },
        { status: 403 }
      )
    }

    // Validate input
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Group name cannot be empty' },
          { status: 400 }
        )
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Group name is too long (max 100 characters)' },
          { status: 400 }
        )
      }
    }

    if (description !== undefined && description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Update group
    const updatedGroup = await db.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(coverImage !== undefined && { coverImage }),
        ...(avatar !== undefined && { avatar }),
        ...(privacy !== undefined && { privacy }),
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
        members: {
          where: { userId: currentUser.id },
          select: { role: true },
        },
      },
    })

    return NextResponse.json({
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      coverImage: updatedGroup.coverImage,
      avatar: updatedGroup.avatar,
      privacy: updatedGroup.privacy,
      createdBy: updatedGroup.createdBy,
      memberCount: updatedGroup._count.members,
      postCount: updatedGroup._count.posts,
      isMember: true,
      memberRole: updatedGroup.members[0]?.role || null,
      isCreator: updatedGroup.createdById === currentUser.id,
      createdAt: updatedGroup.createdAt,
    })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE - Delete group (only creator)
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

    // Check if group exists and user is the creator
    const group = await db.group.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (group.createdById !== currentUser.id) {
      return NextResponse.json(
        { error: 'Only the group creator can delete this group' },
        { status: 403 }
      )
    }

    // Delete group (cascade will handle members and posts)
    await db.group.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
