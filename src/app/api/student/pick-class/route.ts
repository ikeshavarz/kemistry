import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Get the logged-in user from the session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })

    const { classId } = await request.json()
    if (!classId) return NextResponse.json({ error: 'No class selected.' }, { status: 400 })

    // Use admin client for all DB reads — no RLS session issues
    const { data: profile } = await adminClient()
      .from('profiles')
      .select('role, organization_id, class_id')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    if (profile.role === 'teacher') return NextResponse.json({ error: 'Teachers do not join classes.' }, { status: 403 })
    if (profile.class_id) return NextResponse.json({ error: 'You already belong to a class.' }, { status: 400 })

    // Verify the chosen class belongs to the student's institution
    const { data: cls } = await adminClient()
      .from('classes')
      .select('organization_id, name')
      .eq('id', classId)
      .single()

    if (!cls) return NextResponse.json({ error: 'Class not found.' }, { status: 404 })

    if (cls.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'That class is not in your institution.' }, { status: 403 })
    }

    // Save the class to the student's profile
    const { error: updateError } = await adminClient()
      .from('profiles')
      .update({ class_id: classId })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Could not save class: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, { status: 500 })
  }
}
