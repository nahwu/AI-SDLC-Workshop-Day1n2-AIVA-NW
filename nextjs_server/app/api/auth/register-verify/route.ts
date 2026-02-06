import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import {
  createAuthenticator,
  getAuthenticatorByCredentialId,
  getUserByUsername,
} from '@/lib/db'
import { clearChallenge, getChallenge, webAuthnConfig } from '@/lib/webauthn'
import { createSessionResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = (body?.username || '').trim()
    const response = body?.response

    if (!username || !response) {
      return NextResponse.json({ error: 'Invalid registration payload' }, { status: 400 })
    }

    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const expectedChallenge = getChallenge('register', username)
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Registration challenge expired' }, { status: 400 })
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
      requireUserVerification: false,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 })
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo
    const credentialId = isoBase64URL.fromBuffer(credentialID)

    const existing = await getAuthenticatorByCredentialId(credentialId)
    if (existing) {
      return NextResponse.json({ error: 'Authenticator already registered' }, { status: 409 })
    }

    createAuthenticator(
      user.id,
      credentialId,
      isoBase64URL.fromBuffer(credentialPublicKey),
      counter ?? 0,
      response.response?.transports
    )

    clearChallenge('register', username)

    return createSessionResponse(user.id, user.username, 200, {
      success: true,
      userId: user.id,
      username: user.username,
    })
  } catch (error) {
    console.error('POST /api/auth/register-verify error:', error)
    return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 })
  }
}
