import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ikmi-social-secret-key-change-in-production'
)

const COOKIE_NAME = 'ikmi_auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface JWTPayload {
  userId: string
  email: string
  username: string
}

export interface SafeUser {
  id: string
  email: string
  name: string
  username: string
  avatar: string | null
  coverPhoto: string | null
  bio: string | null
  phone: string | null
  address: string | null
  website: string | null
  headline: string | null
  skills: string | null
  birthday: Date | null
  gender: string | null
  createdAt: Date
  updatedAt: Date
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT Token generation
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  
  return token
}

// JWT Token verification
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Cookie management
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  return cookie?.value || null
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Get current user from cookie
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const token = await getAuthCookie()
    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    const user = await db.user.findUnique({
      where: { id: payload.userId },
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

    return user
  } catch {
    return null
  }
}

// Validate user credentials
export async function validateCredentials(
  identifier: string,
  password: string
): Promise<SafeUser | null> {
  // Find user by email or username
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    },
  })

  if (!user) return null

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null

  // Return safe user (without password)
  const { password: _, ...safeUser } = user
  return safeUser as SafeUser
}

// Check if email or username already exists
export async function checkUserExists(
  email: string,
  username: string
): Promise<{ emailExists: boolean; usernameExists: boolean }> {
  const existingUsers = await db.user.findMany({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    },
    select: { email: true, username: true },
  })

  return {
    emailExists: existingUsers.some((u) => u.email === email.toLowerCase()),
    usernameExists: existingUsers.some(
      (u) => u.username === username.toLowerCase()
    ),
  }
}
