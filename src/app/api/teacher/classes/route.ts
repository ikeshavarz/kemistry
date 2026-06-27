import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminClient().from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { name, organizationId } = await request.json()
    if (!name?.trim() || !organizationId) {
      return NextResponse.json({ error: 'Name and institution are required.' }, { status: 400 })
    }

    // Try up to 5 times in case of join_code collision (extremely rare)
    let data = null
    let error = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const joinCode = generateJoinCode()
      const result = await adminClient()
        .from('classes')
        .insert({ name: name.trim(), organization_id: organizationId, created_by: user.id, join_code: joinCode })
        .select()
        .single()
      if (!result.error) { data = result.data; break }
      if (!result.error.message.includes('unique')) { error = result.error; break }
      error = result.error
    }

    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed to create class.' }, { status: 500 })
    return NextResponse.json({ class: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
