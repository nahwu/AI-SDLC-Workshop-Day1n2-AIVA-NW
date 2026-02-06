import { NextResponse, NextRequest } from 'next/server'
import { CreateTemplateSchema } from '@/lib/validation'
import { templateDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.userId
    const templates = await templateDB.getAll(userId)

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('GET /api/templates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const body = await request.json()
    const validated = CreateTemplateSchema.parse(body)

    const userId = session.userId

    const template = await templateDB.create(userId, {
      name: validated.name,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      category: validated.category,
      subtasks: validated.subtasks,
      due_date_offset_days: validated.due_date_offset_days,
    })

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/templates error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 400 }
    )
  }
}
