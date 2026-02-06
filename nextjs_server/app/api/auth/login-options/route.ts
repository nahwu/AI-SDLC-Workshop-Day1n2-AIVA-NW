import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import {
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

    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const authenticators = await getAuthenticatorsByUserId(user.id)
    if (authenticators.length === 0) {
      return NextResponse.json({ error: 'No authenticators found' }, { status: 400 })
    }

    const options = await generateAuthenticationOptions({
      rpID: webAuthnConfig.rpID,
      userVerification: 'preferred',
      allowCredentials: authenticators.map(auth => ({
        id: fromBase64Url(auth.credential_id),
        type: 'public-key' as const,
        transports: auth.transports,
      })),
    })

    storeChallenge('login', username, options.challenge)

    return NextResponse.json(options)
  } catch (error) {
    console.error('POST /api/auth/login-options error:', error)
    return NextResponse.json({ error: 'Failed to create options' }, { status: 500 })
  }
}
