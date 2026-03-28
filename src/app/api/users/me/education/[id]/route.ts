import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PUT /api/users/me/education/[id] - Update education entry
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
    const { institution, degree, field, startDate, endDate, description } = body

    // Verify ownership
    const existingEducation = await db.education.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingEducation) {
      return NextResponse.json({ error: 'Education entry not found' }, { status: 404 })
    }

    const updatedEducation = await db.education.update({
      where: { id },
      data: {
        ...(institution !== undefined && { institution }),
        ...(degree !== undefined && { degree }),
        ...(field !== undefined && { field }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(updatedEducation)
  } catch (error) {
    console.error('Update education error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/me/education/[id] - Delete education entry
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
    const existingEducation = await db.education.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingEducation) {
      return NextResponse.json({ error: 'Education entry not found' }, { status: 404 })
    }

    await db.education.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete education error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
