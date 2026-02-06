import { NextRequest, NextResponse } from 'next/server'
import { exportDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const payload = (await request.json()) as any
    if (!payload || !Array.isArray(payload.todos) || !Array.isArray(payload.tags) || !Array.isArray(payload.templates)) {
      return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 })
    }

    const userId = session.userId
    const normalized = {
      todos: payload.todos.map((todo: any) => ({
        ...todo,
        user_id: userId,
      })),
      tags: payload.tags.map((tag: any) => ({
        ...tag,
        user_id: userId,
      })),
      templates: payload.templates.map((template: any) => ({
        ...template,
        user_id: userId,
      })),
    }

    const result = await exportDB.importAll(normalized)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('POST /api/todos/import error:', error)
    return NextResponse.json({ error: 'Failed to import todos' }, { status: 400 })
  }
}
