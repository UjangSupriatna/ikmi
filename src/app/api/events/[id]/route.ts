import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/events/[id] - Get event detail
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

    const event = await db.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            headline: true,
          }
        },
        attendances: {
          where: { userId: currentUser.id },
          select: { status: true }
        },
        _count: {
          select: {
            attendances: {
              where: { status: 'going' }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...event,
      userAttendance: event.attendances[0]?.status || null,
      attendeesCount: event._count.attendances,
      attendances: undefined,
      _count: undefined,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/events/[id] - Update event
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

    const existingEvent = await db.event.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.createdById !== currentUser.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const {
      title,
      description,
      image,
      startDate,
      endDate,
      location,
      locationType,
      onlineUrl,
      category,
      maxAttendees,
      isFree,
      price,
      status,
    } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (location !== undefined) updateData.location = location
    if (locationType !== undefined) updateData.locationType = locationType
    if (onlineUrl !== undefined) updateData.onlineUrl = onlineUrl
    if (category !== undefined) updateData.category = category
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees
    if (isFree !== undefined) updateData.isFree = isFree
    if (price !== undefined) updateData.price = price
    if (status !== undefined) updateData.status = status

    const event = await db.event.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Delete event
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

    const existingEvent = await db.event.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.createdById !== currentUser.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.event.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
