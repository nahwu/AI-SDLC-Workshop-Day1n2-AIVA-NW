// Authentication utilities for WebAuthn/Passkey sessions
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// JWT secret for signing sessions (use environment variable in production)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
)

export const SESSION_COOKIE_NAME = 'auth-session'
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export interface SessionPayload {
  userId: string
  username: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

/**
 * Create a session JWT token
 */
export async function createSession(
  userId: string,
  username: string
): Promise<string> {
  const payload: SessionPayload = {
    userId,
    username,
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as SessionPayload
  } catch (err) {
    return null
  }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const session = await verifySession(token)
    return session
  } catch (err) {
    return null
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(
  response: NextResponse,
  token: string
): Promise<NextResponse> {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return response
}

/**
 * Delete session cookie
 */
export async function deleteSessionCookie(
  response: NextResponse
): Promise<NextResponse> {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}

/**
 * Create a NextResponse with session cookie
 */
export async function createSessionResponse(
  userId: string,
  username: string,
  statusCode: number = 200,
  body: any = null
): Promise<NextResponse> {
  const token = await createSession(userId, username)

  const response = NextResponse.json(
    body || { success: true, userId, username },
    { status: statusCode }
  )

  return setSessionCookie(response, token)
}

/**
 * Create a logout response
 */
export async function createLogoutResponse(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true })
  return deleteSessionCookie(response)
}
