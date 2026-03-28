import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  hashPassword,
  generateToken,
  setAuthCookie,
  checkUserExists,
} from '@/lib/auth'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, username, email, password } = validationResult.data

    // Check if user already exists
    const { emailExists, usernameExists } = await checkUserExists(email, username)
    
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    if (usernameExists) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        phone: true,
        address: true,
        website: true,
        headline: true,
        skills: true,
        birthday: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json({
      message: 'Registration successful',
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
