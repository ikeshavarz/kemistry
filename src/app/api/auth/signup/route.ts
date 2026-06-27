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
    const { fullName, email, password, role, orgId, teacherCode, studentCode } = await request.json()

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    if (role === 'teacher') {
      if (teacherCode !== process.env.TEACHER_SECRET_CODE) {
        return NextResponse.json({ error: 'Invalid teacher code. Contact the administrator.' }, { status: 403 })
      }
    } else {
      if (!orgId) {
        return NextResponse.json({ error: 'Please select your institution.' }, { status: 400 })
      }
      if (!studentCode) {
        return NextResponse.json({ error: 'Please enter your institution access code.' }, { status: 400 })
      }

      const { data: org, error: orgError } = await admin()
        .from('organizations')
        .select('access_code, name')
        .eq('id', orgId)
        .single()

      if (orgError || !org) {
        return NextResponse.json({ error: 'Institution not found.' }, { status: 400 })
      }
      if (org.access_code !== studentCode.trim()) {
        return NextResponse.json(
          { error: `Incorrect access code for ${org.name}. Ask your teacher for the correct code.` },
          { status: 403 }
        )
      }
    }

    // Create the auth user (email_confirm:true = no confirmation email needed)
    const { data, error: signupError } = await admin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (signupError || !data.user) {
      return NextResponse.json({ error: signupError?.message ?? 'Signup failed.' }, { status: 400 })
    }

    // Update profile with role and org (trigger already inserted the row)
    await admin()
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: role === 'teacher' ? 'teacher' : 'student',
        organization_id: role === 'teacher' ? null : orgId,
      })

    return NextResponse.json({ success: true, email })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
