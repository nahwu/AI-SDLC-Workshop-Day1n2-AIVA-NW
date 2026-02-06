import { isoBase64URL } from '@simplewebauthn/server/helpers'

const DEFAULT_ORIGIN = 'http://localhost:3000'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_ORIGIN
const origin = process.env.NEXT_PUBLIC_ORIGIN || appUrl
const rpID = process.env.NEXT_PUBLIC_RP_ID || new URL(appUrl).hostname
const rpName = process.env.NEXT_PUBLIC_RP_NAME || 'Todo App'

export const webAuthnConfig = {
  origin,
  rpID,
  rpName,
}

interface ChallengeEntry {
  challenge: string
  username: string
  createdAt: number
}

declare global {
  var __webauthnChallenges: Map<string, ChallengeEntry> | undefined
}

const challengeStore = global.__webauthnChallenges || new Map<string, ChallengeEntry>()
if (!global.__webauthnChallenges) {
  global.__webauthnChallenges = challengeStore
}

const CHALLENGE_TTL_MS = 10 * 60 * 1000

function buildKey(type: 'register' | 'login', username: string) {
  return `${type}:${username}`
}

export function storeChallenge(
  type: 'register' | 'login',
  username: string,
  challenge: string
) {
  challengeStore.set(buildKey(type, username), {
    challenge,
    username,
    createdAt: Date.now(),
  })
}

export function getChallenge(type: 'register' | 'login', username: string) {
  const entry = challengeStore.get(buildKey(type, username))
  if (!entry) return null
  if (Date.now() - entry.createdAt > CHALLENGE_TTL_MS) {
    challengeStore.delete(buildKey(type, username))
    return null
  }
  return entry.challenge
}

export function clearChallenge(type: 'register' | 'login', username: string) {
  challengeStore.delete(buildKey(type, username))
}

export function toBase64Url(buffer: Uint8Array) {
  return isoBase64URL.fromBuffer(buffer)
}

export function fromBase64Url(value: string) {
  return isoBase64URL.toBuffer(value)
}
