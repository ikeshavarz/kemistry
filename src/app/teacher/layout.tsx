import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import TeacherNav from '@/components/teacher/TeacherNav'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client to fetch profile — bypasses RLS/cookie timing issues
  const { data: profile } = await adminClient()
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TeacherNav teacherName={profile.full_name ?? 'Teacher'} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
