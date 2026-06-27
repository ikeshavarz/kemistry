'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function signupAction(formData: FormData) {
  try {
    const fullName = (formData.get('fullName') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string
    const role = formData.get('role') as string
    const orgId = formData.get('orgId') as string
    const teacherCode = formData.get('teacherCode') as string
    const studentCode = formData.get('studentCode') as string

    if (!fullName || !email || !password) {
      return { error: 'Please fill in all required fields.' }
    }

    if (role === 'teacher') {
      if (teacherCode !== process.env.TEACHER_SECRET_CODE) {
        return { error: 'Invalid teacher code. Contact the administrator.' }
      }
    } else {
      if (!orgId) return { error: 'Please select your institution.' }
      if (!studentCode) return { error: 'Please enter your institution access code.' }

      const { data: org, error: orgError } = await adminClient()
        .from('organizations')
        .select('access_code, name')
        .eq('id', orgId)
        .single()

      if (orgError || !org) return { error: 'Institution not found.' }
      if (org.access_code !== studentCode.trim()) {
        return { error: `Incorrect access code for ${org.name}. Ask your teacher for the code.` }
      }
    }

    const supabase = await createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signupError) return { error: signupError.message || 'Signup failed. Please try again.' }
    if (!data.user) return { error: 'Signup failed. Please try again.' }

    const { error: updateError } = await adminClient()
      .from('profiles')
      .update({
        full_name: fullName,
        role: role === 'teacher' ? 'teacher' : 'student',
        organization_id: role === 'teacher' ? null : orgId,
      })
      .eq('id', data.user.id)

    if (updateError) {
      return { error: 'Account created but profile setup failed. Please contact your teacher.' }
    }

    return { success: true, email }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { error: message }
  }
}
