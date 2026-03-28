import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PUT /api/users/me/achievement/[id] - Update achievement entry
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
    const { title, description, date, issuer } = body

    // Verify ownership
    const existingAchievement = await db.achievement.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingAchievement) {
      return NextResponse.json({ error: 'Achievement entry not found' }, { status: 404 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/me/achievement/[id] - Delete achievement entry
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
    const existingAchievement = await db.achievement.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingAchievement) {
      return NextResponse.json({ error: 'Achievement entry not found' }, { status: 404 })
    }

    await db.achievement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete achievement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
