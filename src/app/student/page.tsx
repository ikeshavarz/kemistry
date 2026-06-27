import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient()
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'teacher') redirect('/teacher')

  // Get all enrolled classes
  const { data: enrollments } = await adminClient()
    .from('student_classes')
    .select('class_id, joined_at')
    .eq('student_id', user.id)
    .order('joined_at', { ascending: true })

  if (!enrollments || enrollments.length === 0) redirect('/student/pick-class')

  const classIds = enrollments.map(e => e.class_id)

  const { data: classes } = await adminClient()
    .from('classes')
    .select('id, name, organization_id')
    .in('id', classIds)

  const orgIds = [...new Set((classes ?? []).map(c => c.organization_id))]
  const { data: orgs } = await adminClient()
    .from('organizations')
    .select('id, name, type')
    .in('id', orgIds)

  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))

  // Assignment counts per class
  const { data: allAssignments } = await adminClient()
    .from('assignments')
    .select('class_id')
    .in('class_id', classIds)

  const assignmentCount: Record<string, number> = {}
  allAssignments?.forEach(a => {
    assignmentCount[a.class_id] = (assignmentCount[a.class_id] ?? 0) + 1
  })

  // Sort classes to match enrollment order
  const sortedClasses = classIds
    .map(id => (classes ?? []).find(c => c.id === id))
    .filter(Boolean) as { id: string; name: string; organization_id: string }[]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚗️</span>
          <h1 className="font-bold text-lg">Kemistry</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-indigo-200">{profile.full_name}</span>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile.full_name?.split(' ')[0]}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">Your enrolled classes</p>
          </div>
          <Link href="/student/pick-class"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
            + Join Another Class
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedClasses.map(cls => {
            const org = orgMap[cls.organization_id]
            const aCount = assignmentCount[cls.id] ?? 0
            return (
              <Link key={cls.id} href={`/student/class/${cls.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition">{cls.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <span>{org?.type === 'high_school' ? '🏫' : '🎓'}</span>
                      {org?.name ?? ''}
                    </p>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-400 transition text-xl">→</span>
                </div>
                {aCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {aCount} assignment{aCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
