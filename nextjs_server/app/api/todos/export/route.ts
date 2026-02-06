import { NextResponse } from 'next/server'
import { exportDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const payload = await exportDB.exportAll(session.userId)
    return NextResponse.json({ version: 1, ...payload })
  } catch (error) {
    console.error('GET /api/todos/export error:', error)
    return NextResponse.json({ error: 'Failed to export todos' }, { status: 500 })
  }
}
