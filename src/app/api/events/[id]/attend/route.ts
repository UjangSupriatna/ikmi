import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/events/[id]/attend - RSVP to event
export async function POST(
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
    const { status } = body // "going", "interested", "not_going"

    if (!status || !['going', 'interested', 'not_going'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 })
    }

    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, maxAttendees: true }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if max attendees reached for "going" status
    if (status === 'going' && event.maxAttendees) {
      const currentAttendees = await db.eventAttendance.count({
        where: { eventId: id, status: 'going' }
      })
      
      // Check if user already going (so they can update)
      const existingAttendance = await db.eventAttendance.findUnique({
        where: { userId_eventId: { userId: currentUser.id, eventId: id } }
      })

      if (!existingAttendance?.status || existingAttendance.status !== 'going') {
        if (currentAttendees >= event.maxAttendees) {
          return NextResponse.json({ error: 'Event is full' }, { status: 400 })
        }
      }
    }

    const attendance = await db.eventAttendance.upsert({
      where: {
        userId_eventId: {
          userId: currentUser.id,
          eventId: id
        }
      },
      update: { status },
      create: {
        userId: currentUser.id,
        eventId: id,
        status
      }
    })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/events/[id]/attend - Remove RSVP
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

    await db.eventAttendance.delete({
      where: {
        userId_eventId: {
          userId: currentUser.id,
          eventId: id
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
