import { NextResponse } from 'next/server'
import { holidayDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const holidays = await holidayDB.getAll()
    return NextResponse.json({ success: true, data: holidays })
  } catch (error) {
    console.error('GET /api/holidays error:', error)
    return NextResponse.json({ error: 'Failed to load holidays' }, { status: 500 })
  }
}
