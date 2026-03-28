import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/events - List events
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'upcoming'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
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
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      db.event.count({ where })
    ])

    const formattedEvents = events.map(event => ({
      ...event,
      userAttendance: event.attendances[0]?.status || null,
      attendeesCount: event._count.attendances,
      attendances: undefined,
      _count: undefined,
    }))

    return NextResponse.json({
      events: formattedEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
    } = body

    if (!title || !startDate) {
      return NextResponse.json({ error: 'Title and start date are required' }, { status: 400 })
    }

    const event = await db.event.create({
      data: {
        title,
        description,
        image,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        locationType: locationType || 'offline',
        onlineUrl,
        category: category || 'seminar',
        maxAttendees,
        isFree: isFree !== false,
        price,
        status: 'upcoming',
        createdById: currentUser.id,
      },
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
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
