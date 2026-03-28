import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST - Join a group
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

    // Check if group exists
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        privacy: true,
        members: {
          where: { userId: currentUser.id },
          select: { id: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if already a member
    if (group.members.length > 0) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // For private groups, users can't join directly (would need invite system)
    // For now, we allow anyone to join public groups
    if (group.privacy === 'private') {
      return NextResponse.json(
        { error: 'This is a private group. You need an invitation to join.' },
        { status: 403 }
      )
    }

    // Add user as member
    const membership = await db.groupMember.create({
      data: {
        userId: currentUser.id,
        groupId: id,
        role: 'member',
      },
      include: {
        group: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Successfully joined ${membership.group.name}`,
      role: 'member',
    }, { status: 201 })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    )
  }
}

// DELETE - Leave a group
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

    // Check if group exists and user is a member
    const group = await db.group.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
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
        { error: 'You are not a member of this group' },
        { status: 400 }
      )
    }

    // Creator cannot leave their own group (must delete or transfer ownership)
    if (group.createdById === currentUser.id) {
      return NextResponse.json(
        { error: 'Group creator cannot leave. Transfer ownership or delete the group instead.' },
        { status: 400 }
      )
    }

    // Remove membership
    await db.groupMember.delete({
      where: { id: group.members[0].id },
    })

    return NextResponse.json({
      message: `Successfully left ${group.name}`,
    })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    )
  }
}
