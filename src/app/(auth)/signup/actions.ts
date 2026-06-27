'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function signupAction(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const orgId = formData.get('orgId') as string
  const teacherCode = formData.get('teacherCode') as string

  if (role === 'teacher') {
    if (teacherCode !== process.env.TEACHER_SECRET_CODE) {
      return { error: 'Invalid teacher code. Contact the administrator.' }
    }
  } else {
    if (!orgId) return { error: 'Please select your institution.' }
  }

  const supabase = await createClient()
  const { data, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (signupError) return { error: signupError.message }
  if (!data.user) return { error: 'Signup failed. Please try again.' }

  // Use admin client to set role and org (bypasses RLS)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin.from('profiles').update({
    full_name: fullName,
    role,
    organization_id: role === 'teacher' ? null : orgId,
  }).eq('id', data.user.id)

  return { success: true, email }
}
