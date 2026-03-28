// API endpoint to clear chat for current user only
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE /api/messages/[id]/clear - Start')
    const user = await getCurrentUser()
    console.log('User:', user?.id)
    
    if (!user) {
      console.log('Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id: conversationId } = await params
    console.log('Conversation ID:', conversationId)
    
    // Use raw SQL to update clearedAt
    const result = await db.$executeRaw`
      UPDATE conversation_participants 
      SET clearedAt = NOW()
      WHERE userId = ${user.id} AND conversationId = ${conversationId}
    `
    
    console.log('Update result:', result)
    
    if (result === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Chat cleared for you' })
  } catch (error) {
    console.error('Error clearing chat:', error)
    return NextResponse.json(
      { error: 'Failed to clear chat' },
      { status: 500 }
    )
  }
}
