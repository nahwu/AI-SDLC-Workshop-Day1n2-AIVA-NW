import { NextResponse, NextRequest } from 'next/server'
import { CreateTagSchema } from '@/lib/validation'
import { tagDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.userId
    const tags = await tagDB.getAll(userId)

    return NextResponse.json({
      success: true,
      data: tags,
    })
  } catch (error) {
    console.error('GET /api/tags error:', error)
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
    const validated = CreateTagSchema.parse(body)

    const userId = session.userId

    const tag = await tagDB.create(userId, validated.name, validated.color)

    return NextResponse.json(
      {
        success: true,
        data: tag,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/tags error:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 400 }
    )
  }
}
