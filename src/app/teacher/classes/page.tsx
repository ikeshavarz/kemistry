import { adminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { CopyCodeButton, DeleteClassButton } from '@/components/teacher/ClassActions'

export default async function ClassesPage() {
  const orgs = (await adminClient().from('organizations').select('*').order('name')).data ?? []
  const classes = (await adminClient()
    .from('classes')
    .select('id, name, organization_id, join_code')
    .order('organization_id')
    .order('name')).data ?? []

  const studentCountRows = (await adminClient()
    .from('profiles')
    .select('class_id')
    .eq('role', 'student')
    .not('class_id', 'is', null)).data ?? []

  const countMap: Record<string, number> = {}
  studentCountRows.forEach(p => {
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

      {orgs.map(org => {
        const orgClasses = classes.filter(c => c.organization_id === org.id)
        return (
          <section key={org.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{org.type === 'high_school' ? '🏫' : '🎓'}</span>
              <h2 className="text-lg font-bold text-gray-800">{org.name}</h2>
            </div>

            {orgClasses.length > 0 ? (
              <div className="space-y-3">
                {orgClasses.map(cls => (
                  <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link href={`/teacher/classes/${cls.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition">
                          {cls.name}
                        </Link>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {countMap[cls.id] ?? 0} student{(countMap[cls.id] ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {cls.join_code && (
                          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-indigo-500 font-medium">Join code:</span>
                            <span className="font-mono font-bold text-indigo-700 tracking-widest text-sm">{cls.join_code}</span>
                            <CopyCodeButton code={cls.join_code} />
                          </div>
                        )}
                        <Link href={`/teacher/classes/${cls.id}`}
                          className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition">
                          View →
                        </Link>
                        <DeleteClassButton classId={cls.id} className={cls.name} />
                      </div>
                    </div>
                  </div>
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
