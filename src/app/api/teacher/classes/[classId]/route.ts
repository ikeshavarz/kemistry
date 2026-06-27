import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ classId: string }> }

async function verifyTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminClient().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') return null
  return user
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await verifyTeacher()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { classId } = await params
    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

    const { error } = await adminClient()
      .from('classes')
      .update({ name: name.trim() })
      .eq('id', classId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await verifyTeacher()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { classId } = await params

    // Remove all student enrollments for this class (student_classes has ON DELETE CASCADE but being explicit)
    await adminClient().from('student_classes').delete().eq('class_id', classId)

    // Delete assignments for this class
    await adminClient().from('assignments').delete().eq('class_id', classId)

    // Delete the class
    const { error } = await adminClient().from('classes').delete().eq('id', classId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
