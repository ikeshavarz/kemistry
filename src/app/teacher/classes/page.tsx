import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: orgs } = await supabase.from('organizations').select('*').order('name')
  const { data: classes } = await supabase
    .from('classes')
    .select('*, organizations(name, type)')
    .order('organization_id')
    .order('name')

  const { data: studentCounts } = await supabase
    .from('profiles')
    .select('class_id')
    .eq('role', 'student')
    .not('class_id', 'is', null)

  const countMap: Record<string, number> = {}
  studentCounts?.forEach(p => {
    if (p.class_id) countMap[p.class_id] = (countMap[p.class_id] ?? 0) + 1
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm mt-1">Manage classes across all your institutions</p>
        </div>
        <Link href="/teacher/classes/new"
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Class
        </Link>
      </div>

      {orgs?.map(org => {
        const orgClasses = classes?.filter(c => c.organization_id === org.id) ?? []
        return (
          <section key={org.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{org.type === 'high_school' ? '🏫' : '🎓'}</span>
              <h2 className="text-lg font-bold text-gray-800">{org.name}</h2>
            </div>

            {orgClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {orgClasses.map(cls => (
                  <Link key={cls.id} href={`/teacher/classes/${cls.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {countMap[cls.id] ?? 0} student{(countMap[cls.id] ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-gray-300 text-lg">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-400 text-sm">
                No classes yet for {org.name}.{' '}
                <Link href="/teacher/classes/new" className="text-blue-500 hover:underline">Create one →</Link>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
