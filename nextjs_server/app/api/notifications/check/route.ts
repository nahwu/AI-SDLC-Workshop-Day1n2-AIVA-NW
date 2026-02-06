import { NextResponse } from 'next/server'
import { getSingaporeNow } from '@/lib/timezone'
import { reminderDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const now = getSingaporeNow()
    const due = await reminderDB.getDueReminders(now) as any[]
    const userId = session.userId
    const filtered = due.filter(item => {
      if (item.todo?.user_id) return item.todo.user_id === userId
      if (item.user_id) return item.user_id === userId
      return false
    })

    const payload = filtered.map((item: any) => {
      const reminderId = item.id || item.reminder?.id
      if (reminderId) {
        reminderDB.markSent(reminderId, now.toISOString())
      }
      const title = item.title || item.todo?.title || 'Todo reminder'
      const dueDate = item.due_date || item.todo?.due_date || ''
      const minutesBefore = item.reminder_minutes || item.reminder?.reminder_minutes
      return {
        id: reminderId,
        title,
        due_date: dueDate,
        minutes_before: minutesBefore,
      }
    })

    return NextResponse.json({
      success: true,
      data: payload,
    })
  } catch (error) {
    console.error('GET /api/notifications/check error:', error)
    return NextResponse.json({ error: 'Failed to check reminders' }, { status: 500 })
  }
}


