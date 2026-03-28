import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { markAllNotificationsAsRead } from '@/lib/notifications'

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const whereClause = {
      userId: currentUser.id,
      ...(unreadOnly && { read: false }),
    }

    // Get notifications with count
    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({
        where: { userId: currentUser.id },
      }),
      db.notification.count({
        where: {
          userId: currentUser.id,
          read: false,
        },
      }),
    ])

    // Parse the data field from JSON string to object
    const parsedNotifications = notifications.map((notification) => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null,
    }))

    return NextResponse.json({
      notifications: parsedNotifications,
      totalCount,
      unreadCount,
      hasMore: offset + limit < totalCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications - Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await markAllNotificationsAsRead(currentUser.id)

    return NextResponse.json({
      message: 'All notifications marked as read',
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
