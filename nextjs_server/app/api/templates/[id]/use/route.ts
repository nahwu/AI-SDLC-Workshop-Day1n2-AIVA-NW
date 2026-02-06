import { NextRequest, NextResponse } from 'next/server'
import { templateDB, todoDB } from '@/lib/db'
import { getNowSingapore, toSingaporeDateString } from '@/lib/timezone'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const { id } = await params
    const template = await templateDB.getById(id)

    if (!template || template.user_id !== session.userId) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const now = getNowSingapore()
    const dueDate = template.due_date_offset_days !== undefined
      ? (() => {
          const date = new Date(now)
          date.setDate(date.getDate() + (template.due_date_offset_days || 0))
          return toSingaporeDateString(date)
        })()
      : undefined

    const userId = session.userId

    const subtasks = template.subtasks_json ? JSON.parse(template.subtasks_json) : []
    const created = todoDB.create({
      user_id: userId,
      title: template.title,
      description: template.description,
      priority: template.priority,
      due_date: dueDate,
      subtasks,
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/templates/[id]/use error:', error)
    return NextResponse.json({ error: 'Failed to use template' }, { status: 400 })
  }
}
