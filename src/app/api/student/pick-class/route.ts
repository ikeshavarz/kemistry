import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as admin } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { classId } = await request.json()
    if (!classId) return NextResponse.json({ error: 'Class ID required.' }, { status: 400 })

    // Verify the class belongs to the student's institution
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, class_id')
      .eq('id', user.id)
      .single()

    if (profile?.class_id) {
      return NextResponse.json({ error: 'You have already selected a class.' }, { status: 400 })
    }

    const { data: cls } = await supabase
      .from('classes')
      .select('organization_id')
      .eq('id', classId)
      .single()

    if (!cls || cls.organization_id !== profile?.organization_id) {
      return NextResponse.json({ error: 'Invalid class selection.' }, { status: 403 })
    }

    const adminClient = admin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await adminClient.from('profiles').update({ class_id: classId }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
