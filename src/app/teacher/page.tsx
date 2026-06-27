import { createClient } from '@/lib/supabase/server'

export default async function TeacherHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: orgs }, { data: classes }, { data: assignments }, { count: studentCount }] = await Promise.all([
    supabase.from('organizations').select('id, name, type').order('name'),
    supabase.from('classes').select('id, name, organization_id, organizations(name)').order('name'),
    supabase.from('assignments').select('id, title, due_date, organizations(name), classes(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your classes and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-blue-600">{orgs?.length ?? 0}</p>
          <p className="text-gray-500 text-sm mt-1">Institutions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-indigo-600">{classes?.length ?? 0}</p>
          <p className="text-gray-500 text-sm mt-1">Classes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-teal-600">{studentCount ?? 0}</p>
          <p className="text-gray-500 text-sm mt-1">Students</p>
        </div>
      </div>

      {/* Institutions + classes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Institutions & Classes</h2>
          <a href="/teacher/classes" className="text-sm text-blue-600 hover:underline">Manage classes →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orgs?.map(org => {
            const orgClasses = classes?.filter(c => c.organization_id === org.id) ?? []
            return (
              <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{org.type === 'high_school' ? '🏫' : '🎓'}</span>
                  <h3 className="font-semibold text-gray-900">{org.name}</h3>
                </div>
                {orgClasses.length > 0 ? (
                  <ul className="space-y-1">
                    {orgClasses.map(c => (
                      <li key={c.id}>
                        <a href={`/teacher/classes/${c.id}`} className="text-sm text-blue-600 hover:underline">
                          {c.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No classes yet</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent assignments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Recent Assignments</h2>
          <a href="/teacher/assignments" className="text-sm text-blue-600 hover:underline">View all →</a>
        </div>
        {assignments && assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((a: any) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-400">
                    {a.organizations?.name}{a.classes?.name ? ` · ${a.classes.name}` : ''}
                  </p>
                </div>
                {a.due_date && (
                  <span className="text-sm text-gray-400">{new Date(a.due_date).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
            No assignments yet. Use the <a href="/teacher/ai" className="text-blue-500 hover:underline">AI Assistant</a> to create one.
          </div>
        )}
      </section>
    </div>
  )
}
