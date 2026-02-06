import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import {
  createUser,
  getAuthenticatorsByUserId,
  getUserByUsername,
} from '@/lib/db'
import { storeChallenge, webAuthnConfig, fromBase64Url } from '@/lib/webauthn'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = (body?.username || '').trim()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const existingUser = await getUserByUsername(username)
    let user = existingUser

    if (!user) {
      user = await createUser(username)
    }

    const authenticators = await getAuthenticatorsByUserId(user.id)
    if (existingUser && authenticators.length > 0) {
      return NextResponse.json({ error: 'User already registered' }, { status: 409 })
    }

    const options = await generateRegistrationOptions({
      rpName: webAuthnConfig.rpName,
      rpID: webAuthnConfig.rpID,
      userID: user.id,
      userName: user.username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: authenticators.map(auth => ({
        id: fromBase64Url(auth.credential_id),
        type: 'public-key' as const,
      })),
    })

    storeChallenge('register', username, options.challenge)

    return NextResponse.json(options)
  } catch (error) {
    console.error('POST /api/auth/register-options error:', error)
    return NextResponse.json({ error: 'Failed to create options' }, { status: 500 })
  }
}
