import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/events/[id]/attendees - Get event attendees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'going', 'interested', or null for all

    const where: Record<string, unknown> = { eventId: id }
    if (status) {
      where.status = status
    }

    const attendees = await db.eventAttendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            headline: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ attendees })
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
