import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me/achievement - Get current user's achievements
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const achievements = await db.achievement.findMany({
      where: { userId: currentUser.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users/me/achievement - Create new achievement
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
    const { title, description, date, issuer } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const achievement = await db.achievement.create({
      data: {
        userId: currentUser.id,
        title,
        description: description || null,
        date: date ? new Date(date) : null,
        issuer: issuer || null,
      },
    })

    return NextResponse.json(achievement, { status: 201 })
  } catch (error) {
    console.error('Create achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me/achievement - Update achievement (expects id in body)
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
    const { id, title, description, date, issuer } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingAchievement = await db.achievement.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingAchievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    const updatedAchievement = await db.achievement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(issuer !== undefined && { issuer }),
      },
    })

    return NextResponse.json(updatedAchievement)
  } catch (error) {
    console.error('Update achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/me/achievement - Delete achievement (expects id in body)
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
        { error: 'Achievement ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingAchievement = await db.achievement.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingAchievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    await db.achievement.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
