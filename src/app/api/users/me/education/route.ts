import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me/education - Get current user's education entries
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const education = await db.education.findMany({
      where: { userId: currentUser.id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(education)
  } catch (error) {
    console.error('Get education error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users/me/education - Create new education entry
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
    const { institution, degree, field, startDate, endDate, description } = body

    // Validate required fields
    if (!institution || !degree || !startDate) {
      return NextResponse.json(
        { error: 'Institution, degree, and start date are required' },
        { status: 400 }
      )
    }

    const education = await db.education.create({
      data: {
        userId: currentUser.id,
        institution,
        degree,
        field: field || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
    })

    return NextResponse.json(education, { status: 201 })
  } catch (error) {
    console.error('Create education error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me/education - Update education entry (expects id in body)
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
    const { id, institution, degree, field, startDate, endDate, description } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Education ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingEducation = await db.education.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingEducation) {
      return NextResponse.json(
        { error: 'Education entry not found' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/me/education - Delete education entry (expects id in body)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Education ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingEducation = await db.education.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingEducation) {
      return NextResponse.json(
        { error: 'Education entry not found' },
        { status: 404 }
      )
    }

    await db.education.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete education error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
