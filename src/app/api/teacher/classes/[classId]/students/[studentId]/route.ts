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

    // Verify the student actually belongs to this class
    const { data: student } = await adminClient()
      .from('profiles')
      .select('class_id')
      .eq('id', studentId)
      .single()

    if (!student || student.class_id !== classId) {
      return NextResponse.json({ error: 'Student not found in this class.' }, { status: 404 })
    }

    const { error } = await adminClient()
      .from('profiles')
      .update({ class_id: null, organization_id: null })
      .eq('id', studentId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
