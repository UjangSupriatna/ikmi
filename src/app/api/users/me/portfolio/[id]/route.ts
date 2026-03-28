import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PUT /api/users/me/portfolio/[id] - Update portfolio entry
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
    const { title, description, link, images, technologies } = body

    // Verify ownership
    const existingPortfolio = await db.portfolio.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingPortfolio) {
      return NextResponse.json({ error: 'Portfolio entry not found' }, { status: 404 })
    }

    const updatedPortfolio = await db.portfolio.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(link !== undefined && { link }),
        ...(images !== undefined && { images }),
        ...(technologies !== undefined && { technologies }),
      },
    })

    return NextResponse.json(updatedPortfolio)
  } catch (error) {
    console.error('Update portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/me/portfolio/[id] - Delete portfolio entry
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
    const existingPortfolio = await db.portfolio.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingPortfolio) {
      return NextResponse.json({ error: 'Portfolio entry not found' }, { status: 404 })
    }

    await db.portfolio.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
