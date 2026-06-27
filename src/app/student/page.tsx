import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Flat query — no foreign key joins that might break
  const { data: profile } = await adminClient()
    .from('profiles')
    .select('role, full_name, organization_id, class_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'teacher') redirect('/teacher')
  if (!profile.class_id) redirect('/student/pick-class')

  // Fetch related names separately
  const [{ data: org }, { data: cls }] = await Promise.all([
    adminClient().from('organizations').select('name').eq('id', profile.organization_id).single(),
    adminClient().from('classes').select('name').eq('id', profile.class_id).single(),
  ])

  // Fetch class-scoped content
  const [{ data: assignments }, { data: announcements }, { data: courses }] = await Promise.all([
    adminClient().from('assignments').select('*').eq('class_id', profile.class_id).order('due_date', { ascending: true }),
    adminClient().from('announcements').select('*')
      .or(`class_id.eq.${profile.class_id},and(organization_id.eq.${profile.organization_id},class_id.is.null)`)
      .order('created_at', { ascending: false }).limit(5),
    adminClient().from('courses').select('*').eq('organization_id', profile.organization_id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚗️</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Kemistry</h1>
            <p className="text-indigo-300 text-xs">{org?.name} · {cls?.name}</p>
          </div>
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

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-indigo-800 font-medium">
            Welcome back, {profile.full_name?.split(' ')[0]} 👋
          </p>
          <p className="text-indigo-500 text-sm mt-0.5">{cls?.name} · {org?.name}</p>
        </div>

        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Announcements</h2>
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{a.content}</p>
                  <p className="text-gray-400 text-xs mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assignments */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Assignments</h2>
          {assignments && assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((a: any) => {
                const overdue = a.due_date && new Date(a.due_date) < new Date()
                return (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                    <div>
                      <p className="font-medium text-gray-900">{a.title}</p>
                      {a.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{a.description}</p>}
                    </div>
                    {a.due_date && (
                      <span className={`text-sm font-medium px-2.5 py-1 rounded-full shrink-0 ml-4 ${
                        overdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {overdue ? 'Overdue' : `Due ${new Date(a.due_date).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              No assignments yet.
            </div>
          )}
        </section>

        {/* Courses */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3">Courses</h2>
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  {c.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              No courses yet.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
