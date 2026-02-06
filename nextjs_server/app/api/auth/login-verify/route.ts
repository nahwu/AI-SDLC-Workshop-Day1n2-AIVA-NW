import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import {
  getAuthenticatorByCredentialId,
  getUserByUsername,
  updateAuthenticatorCounter,
} from '@/lib/db'
import { clearChallenge, getChallenge, webAuthnConfig } from '@/lib/webauthn'
import { createSessionResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = (body?.username || '').trim()
    const response = body?.response

    if (!username || !response) {
      return NextResponse.json({ error: 'Invalid login payload' }, { status: 400 })
    }

    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const expectedChallenge = getChallenge('login', username)
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Login challenge expired' }, { status: 400 })
    }

    const credentialId = response.id as string
    const authenticator = await getAuthenticatorByCredentialId(credentialId)

    if (!authenticator || authenticator.user_id !== user.id) {
      return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 })
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: webAuthnConfig.origin,
      expectedRPID: webAuthnConfig.rpID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(authenticator.credential_id),
        credentialPublicKey: isoBase64URL.toBuffer(authenticator.public_key),
        counter: authenticator.counter ?? 0,
        transports: authenticator.transports,
      },
      requireUserVerification: false,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Login verification failed' }, { status: 400 })
    }

    const newCounter = verification.authenticationInfo?.newCounter ?? authenticator.counter ?? 0
    updateAuthenticatorCounter(authenticator.credential_id, newCounter)

    clearChallenge('login', username)

    return createSessionResponse(user.id, user.username, 200, {
      success: true,
      userId: user.id,
      username: user.username,
    })
  } catch (error) {
    console.error('POST /api/auth/login-verify error:', error)
    return NextResponse.json({ error: 'Failed to verify login' }, { status: 500 })
  }
}
