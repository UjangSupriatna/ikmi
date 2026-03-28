import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me/experience - Get current user's experience entries
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const experience = await db.experience.findMany({
      where: { userId: currentUser.id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(experience)
  } catch (error) {
    console.error('Get experience error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users/me/experience - Create new experience entry
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
    const { company, position, location, startDate, endDate, current, description } = body

    // Validate required fields
    if (!company || !position || !startDate) {
      return NextResponse.json(
        { error: 'Company, position, and start date are required' },
        { status: 400 }
      )
    }

    const experience = await db.experience.create({
      data: {
        userId: currentUser.id,
        company,
        position,
        location: location || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        current: current || false,
        description: description || null,
      },
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    console.error('Create experience error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me/experience - Update experience entry (expects id in body)
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
    const { id, company, position, location, startDate, endDate, current, description } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Experience ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingExperience = await db.experience.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingExperience) {
      return NextResponse.json(
        { error: 'Experience entry not found' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/me/experience - Delete experience entry (expects id in body)
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
        { error: 'Experience ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingExperience = await db.experience.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingExperience) {
      return NextResponse.json(
        { error: 'Experience entry not found' },
        { status: 404 }
      )
    }

    await db.experience.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete experience error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
