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
      .select('role, class_id')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    if (profile.role === 'teacher') return NextResponse.json({ error: 'Teachers do not join classes.' }, { status: 403 })
    if (profile.class_id) return NextResponse.json({ error: 'You are already in a class.' }, { status: 400 })

    const { data: cls } = await adminClient()
      .from('classes')
      .select('id, name, organization_id')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single()

    if (!cls) return NextResponse.json({ error: 'Invalid join code. Double-check with your teacher.' }, { status: 404 })

    const { error: updateError } = await adminClient()
      .from('profiles')
      .update({ class_id: cls.id, organization_id: cls.organization_id })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Could not join class: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, className: cls.name })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, { status: 500 })
  }
}
