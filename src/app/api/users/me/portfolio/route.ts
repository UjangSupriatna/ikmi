import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me/portfolio - Get current user's portfolio projects
export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const portfolio = await db.portfolio.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON fields for each portfolio
    const parsedPortfolio = portfolio.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      technologies: p.technologies ? JSON.parse(p.technologies) : [],
    }))

    return NextResponse.json(parsedPortfolio)
  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users/me/portfolio - Create new portfolio project
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, link, images, technologies } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate JSON arrays if provided
    if (images !== undefined && images !== null) {
      try {
        JSON.parse(images)
      } catch {
        return NextResponse.json(
          { error: 'Images must be a valid JSON array' },
          { status: 400 }
        )
      }
    }

    if (technologies !== undefined && technologies !== null) {
      try {
        JSON.parse(technologies)
      } catch {
        return NextResponse.json(
          { error: 'Technologies must be a valid JSON array' },
          { status: 400 }
        )
      }
    }

    const portfolio = await db.portfolio.create({
      data: {
        userId: currentUser.id,
        title,
        description: description || null,
        link: link || null,
        images: images || null,
        technologies: technologies || null,
      },
    })

    return NextResponse.json(portfolio, { status: 201 })
  } catch (error) {
    console.error('Create portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me/portfolio - Update portfolio project (expects id in body)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, title, description, link, images, technologies } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingPortfolio = await db.portfolio.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio project not found' },
        { status: 404 }
      )
    }

    // Validate JSON arrays if provided
    if (images !== undefined && images !== null) {
      try {
        JSON.parse(images)
      } catch {
        return NextResponse.json(
          { error: 'Images must be a valid JSON array' },
          { status: 400 }
        )
      }
    }

    if (technologies !== undefined && technologies !== null) {
      try {
        JSON.parse(technologies)
      } catch {
        return NextResponse.json(
          { error: 'Technologies must be a valid JSON array' },
          { status: 400 }
        )
      }
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/me/portfolio - Delete portfolio project (expects id in body)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingPortfolio = await db.portfolio.findFirst({
      where: { id, userId: currentUser.id },
    })

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio project not found' },
        { status: 404 }
      )
    }

    await db.portfolio.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
