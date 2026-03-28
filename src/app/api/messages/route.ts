import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/messages - List all conversations for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all conversations where user is a participant
    const participations = await db.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                    headline: true,
                    updatedAt: true, // For online/offline status
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    })

    // Format conversations for the response
    const conversations = participations.map((p) => {
      const conversation = p.conversation
      const lastMessage = conversation.messages[0]
      const userLastReadAt = p.lastReadAt
      
      // Get other participants (not current user)
      const otherParticipants = conversation.participants
        .filter((participant) => participant.userId !== user.id)
        .map((participant) => ({
          ...participant.user,
          // Consider online if updated in last 5 minutes
          isOnline: participant.user.updatedAt ? 
            new Date(participant.user.updatedAt).getTime() > Date.now() - 5 * 60 * 1000 : false
        }))

      return {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        participants: otherParticipants,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt,
          read: lastMessage.read,
        } : null,
        unreadCount: 0, // Will be calculated below
        isOnline: otherParticipants.some((p) => p.isOnline), // Group is online if any participant is online
      }
    })

    // Calculate total unread count
    let totalUnread = 0
    for (const conv of conversations) {
      if (conv.lastMessage && conv.lastMessage.sender.id !== user.id && !conv.lastMessage.read) {
        totalUnread++
      }
    }

    return NextResponse.json({ conversations, totalUnread })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/messages - Start a new conversation
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participantIds, initialMessage } = body

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participants are required' }, { status: 400 })
    }

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([user.id, ...participantIds])]

    // Check if a conversation already exists between these participants
    const existingConversations = await db.conversation.findMany({
      where: {
        participants: {
          every: {
            userId: { in: allParticipantIds },
          },
        },
      },
      include: {
        participants: true,
      },
    })

    // Find exact match (same number of participants)
    const existingConversation = existingConversations.find(
      (conv) => conv.participants.length === allParticipantIds.length
    )

    if (existingConversation) {
      // Return existing conversation
      return NextResponse.json({
        conversation: {
          id: existingConversation.id,
          createdAt: existingConversation.createdAt,
          updatedAt: existingConversation.updatedAt,
        },
        isNew: false,
      })
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        participants: {
          create: allParticipantIds.map((userId) => ({
            userId,
          })),
        },
      },
    })

    // If there's an initial message, create it
    if (initialMessage && initialMessage.trim()) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: initialMessage.trim(),
        },
      })

      // Update conversation's updatedAt
      await db.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      })
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      isNew: true,
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
