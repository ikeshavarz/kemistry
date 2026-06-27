import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ classId: string; studentId: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminClient().from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { classId, studentId } = await params

    const { error } = await adminClient()
      .from('student_classes')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
