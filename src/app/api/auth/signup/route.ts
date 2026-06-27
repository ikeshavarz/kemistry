import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, role, teacherCode } = await request.json()

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    if (role === 'teacher') {
      if (teacherCode !== process.env.TEACHER_SECRET_CODE) {
        return NextResponse.json({ error: 'Invalid teacher code. Contact the administrator.' }, { status: 403 })
      }
    }

    const { data, error: signupError } = await admin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (signupError || !data.user) {
      return NextResponse.json({ error: signupError?.message ?? 'Signup failed.' }, { status: 400 })
    }

    await admin()
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: role === 'teacher' ? 'teacher' : 'student',
        organization_id: null,
      })

    return NextResponse.json({ success: true, email })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
