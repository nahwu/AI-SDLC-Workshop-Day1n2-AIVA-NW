'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'

  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState<'register' | 'login' | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        router.replace(nextPath)
      }
    }

    checkSession()
  }, [router, nextPath])

  const handleRegister = async () => {
    const trimmed = username.trim()
    if (!trimmed) {
      setStatus('Enter a username to register.')
      return
    }

    setLoading('register')
    setStatus(null)

    try {
      const optionsResponse = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })

      if (!optionsResponse.ok) {
        const errorPayload = await optionsResponse.json().catch(() => ({}))
        setStatus(errorPayload.error || 'Failed to start registration.')
        setLoading(null)
        return
      }

      const options = await optionsResponse.json()
      const attestation = await startRegistration(options)

      const verifyResponse = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, response: attestation }),
      })

      if (!verifyResponse.ok) {
        const errorPayload = await verifyResponse.json().catch(() => ({}))
        setStatus(errorPayload.error || 'Registration failed.')
        setLoading(null)
        return
      }

      router.replace(nextPath)
    } catch (error) {
      console.error('Registration error:', error)
      setStatus('Registration failed. Try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleLogin = async () => {
    const trimmed = username.trim()
    if (!trimmed) {
      setStatus('Enter a username to sign in.')
      return
    }

    setLoading('login')
    setStatus(null)

    try {
      const optionsResponse = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })

      if (!optionsResponse.ok) {
        const errorPayload = await optionsResponse.json().catch(() => ({}))
        setStatus(errorPayload.error || 'Failed to start login.')
        setLoading(null)
        return
      }

      const options = await optionsResponse.json()
      const assertion = await startAuthentication(options)

      const verifyResponse = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, response: assertion }),
      })

      if (!verifyResponse.ok) {
        const errorPayload = await verifyResponse.json().catch(() => ({}))
        setStatus(errorPayload.error || 'Login failed.')
        setLoading(null)
        return
      }

      router.replace(nextPath)
    } catch (error) {
      console.error('Login error:', error)
      setStatus('Login failed. Try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-600">
            Use a passkey to register or sign in to your Todo App.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            placeholder="your-name"
            value={username}
            onChange={event => setUsername(event.target.value)}
            autoComplete="username webauthn"
          />
        </div>

        {status && (
          <div className="rounded-lg bg-amber-50 text-amber-800 text-sm px-3 py-2">
            {status}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn btn-primary flex-1"
            onClick={handleRegister}
            disabled={loading !== null}
          >
            {loading === 'register' ? 'Registering...' : 'Create passkey'}
          </button>
          <button
            className="btn btn-secondary flex-1"
            onClick={handleLogin}
            disabled={loading !== null}
          >
            {loading === 'login' ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </main>
  )
}
