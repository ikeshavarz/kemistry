import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })

    const { joinCode } = await request.json()
    if (!joinCode) return NextResponse.json({ error: 'No join code provided.' }, { status: 400 })

    const { data: profile } = await adminClient()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    if (profile.role === 'teacher') return NextResponse.json({ error: 'Teachers do not join classes.' }, { status: 403 })

    const { data: cls } = await adminClient()
      .from('classes')
      .select('id, name, organization_id')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single()

    if (!cls) return NextResponse.json({ error: 'Invalid join code. Double-check with your teacher.' }, { status: 404 })

    // Check if already enrolled
    const { data: existing } = await adminClient()
      .from('student_classes')
      .select('class_id')
      .eq('student_id', user.id)
      .eq('class_id', cls.id)
      .single()

    if (existing) return NextResponse.json({ error: 'You are already in this class.' }, { status: 400 })

    const { error: insertError } = await adminClient()
      .from('student_classes')
      .insert({ student_id: user.id, class_id: cls.id })

    if (insertError) {
      return NextResponse.json({ error: 'Could not join class: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, className: cls.name })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, { status: 500 })
  }
}
