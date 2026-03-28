import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PUT /api/users/me/experience/[id] - Update experience entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { company, position, location, startDate, endDate, current, description } = body

    // Verify ownership
    const existingExperience = await db.experience.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingExperience) {
      return NextResponse.json({ error: 'Experience entry not found' }, { status: 404 })
    }

    const updatedExperience = await db.experience.update({
      where: { id },
      data: {
        ...(company !== undefined && { company }),
        ...(position !== undefined && { position }),
        ...(location !== undefined && { location }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(current !== undefined && { current }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(updatedExperience)
  } catch (error) {
    console.error('Update experience error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/me/experience/[id] - Delete experience entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingExperience = await db.experience.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingExperience) {
      return NextResponse.json({ error: 'Experience entry not found' }, { status: 404 })
    }

    await db.experience.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete experience error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
