import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes')
    .select('*, organizations(name, type)')
    .eq('id', classId)
    .single()

  if (!cls) notFound()

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('class_id', classId)
    .eq('role', 'student')
    .order('full_name')

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, due_date, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/teacher/classes" className="text-gray-400 hover:text-gray-600 transition">← Classes</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
          {(cls as any).organizations?.name}
        </span>
      </div>

      {/* Students */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Students <span className="text-gray-400 font-normal text-base">({students?.length ?? 0})</span>
          </h2>
        </div>

        {students && students.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-5 py-3 text-gray-500 text-sm">{s.email}</td>
                    <td className="px-5 py-3 text-gray-400 text-sm">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
            No students in this class yet. Share the institution access code so students can sign up and select this class.
          </div>
        )}
      </section>

      {/* Assignments for this class */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Assignments</h2>
          <Link href={`/teacher/assignments/new?classId=${classId}`}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
            + New Assignment
          </Link>
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <p className="font-medium text-gray-900">{a.title}</p>
                {a.due_date && (
                  <span className="text-sm text-gray-400">{new Date(a.due_date).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-400 text-sm">
            No assignments yet for this class.
          </div>
        )}
      </section>
    </div>
  )
}
