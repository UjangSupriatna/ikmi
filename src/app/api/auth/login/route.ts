import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateCredentials, generateToken, setAuthCookie } from '@/lib/auth'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { identifier, password } = validationResult.data

    // Validate credentials
    const user = await validateCredentials(identifier, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json({
      message: 'Login successful',
      user,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
