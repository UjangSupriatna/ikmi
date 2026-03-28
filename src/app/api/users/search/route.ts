import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/search?q=query - Search users
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query.trim()) {
      return NextResponse.json({ users: [] })
    }

    // SQLite doesn't support mode: 'insensitive', it's case-insensitive by default
    const users = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { username: { contains: query } },
              { email: { contains: query } },
            ],
          },
          {
            id: { not: currentUser.id },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        headline: true,
        createdAt: true,
      },
      take: limit,
    })

    // Check friendship status
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { friendId: currentUser.id },
        ],
      },
    })

    const friendshipMap = new Map<string, { status: string; isSender: boolean }>()
    
    for (const f of friendships) {
      if (f.userId === currentUser.id) {
        friendshipMap.set(f.friendId, { status: f.status, isSender: true })
      } else {
        friendshipMap.set(f.userId, { status: f.status, isSender: false })
      }
    }

    const usersWithStatus = users.map(user => ({
      ...user,
      friendshipStatus: friendshipMap.get(user.id) || null,
    }))

    return NextResponse.json({ users: usersWithStatus })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
