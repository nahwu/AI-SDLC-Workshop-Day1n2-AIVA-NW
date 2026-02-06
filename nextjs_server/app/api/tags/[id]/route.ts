import { NextResponse, NextRequest } from 'next/server'
import { UpdateTagSchema } from '@/lib/validation'
import { tagDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const { id } = await params
    const tag = await tagDB.getById(id)

    if (!tag || tag.user_id !== session.userId) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tag,
    })
  } catch (error) {
    console.error('GET /api/tags/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const validated = UpdateTagSchema.parse(body)

    const tag = await tagDB.getById(id)
    if (!tag || tag.user_id !== session.userId) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    const updated = await tagDB.update(id, validated)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('PUT /api/tags/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 400 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, context)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, context)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const { id } = await params
    const tag = await tagDB.getById(id)
    if (!tag || tag.user_id !== session.userId) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    tagDB.delete(id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/tags/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
