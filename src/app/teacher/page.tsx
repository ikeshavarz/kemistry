import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect('/student')

  const { data: orgs } = await supabase.from('organizations').select('*').order('name')
  const { data: courses } = await supabase.from('courses').select('*, organizations(name)').order('created_at', { ascending: false })
  const { data: assignments } = await supabase.from('assignments').select('*, organizations(name)').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚗️</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Chemistry Platform</h1>
            <p className="text-blue-300 text-xs">Teacher Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">{profile.full_name}</span>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Institutions overview */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Institutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgs?.map(org => (
              <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-2xl mb-2">{org.type === 'high_school' ? '🏫' : '🎓'}</div>
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-gray-500 text-sm capitalize">{org.type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher/courses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              + New Course
            </Link>
            <Link href="/teacher/assignments/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
              + New Assignment
            </Link>
            <Link href="/teacher/announcements/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
              + New Announcement
            </Link>
          </div>
        </section>

        {/* Recent courses */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Courses</h2>
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course: any) => (
                <Link key={course.id} href={`/teacher/courses/${course.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{course.organizations?.name}</p>
                  {course.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.description}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              No courses yet. Create your first course above.
            </div>
          )}
        </section>

        {/* Recent assignments */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Assignments</h2>
          {assignments && assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((a: any) => (
                <Link key={a.id} href={`/teacher/assignments/${a.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                  <div>
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500">{a.organizations?.name}</p>
                  </div>
                  {a.due_date && (
                    <span className="text-sm text-gray-400">
                      Due {new Date(a.due_date).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              No assignments yet.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
