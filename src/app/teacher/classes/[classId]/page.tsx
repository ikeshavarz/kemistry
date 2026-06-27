import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteClassButton, EditClassButton, RemoveStudentButton, CopyCodeButton } from '@/components/teacher/ClassActions'

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params

  const { data: cls } = await adminClient()
    .from('classes')
    .select('id, name, join_code, organization_id, organizations(name, type)')
    .eq('id', classId)
    .single()

  if (!cls) notFound()

  // Get enrolled student IDs
  const { data: enrollments } = await adminClient()
    .from('student_classes')
    .select('student_id, joined_at')
    .eq('class_id', classId)
    .order('joined_at', { ascending: false })

  const studentIds = enrollments?.map(e => e.student_id) ?? []

  const students = studentIds.length > 0
    ? (await adminClient()
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)
        .order('full_name')).data ?? []
    : []

  const { data: assignments } = await adminClient()
    .from('assignments')
    .select('id, title, due_date, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  const orgName = (cls as any).organizations?.name ?? ''

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/teacher/classes" className="text-gray-400 hover:text-gray-600 transition">← Classes</Link>
          <span className="text-gray-300">/</span>
          <span className="text-2xl font-bold text-gray-900">{cls.name}</span>
          {orgName && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">{orgName}</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <EditClassButton classId={cls.id} currentName={cls.name} />
          <DeleteClassButton classId={cls.id} className={cls.name} />
        </div>
      </div>

      {/* Join Code */}
      {cls.join_code && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700 mb-1">Class Join Code</p>
            <p className="text-xs text-indigo-500">Share this with your students so they can join this class.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-3xl text-indigo-800 tracking-widest">{cls.join_code}</span>
            <CopyCodeButton code={cls.join_code} />
          </div>
        </div>
      )}

      {/* Students */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Students <span className="text-gray-400 font-normal text-base">({students.length})</span>
          </h2>
        </div>

        {students.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Email</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-5 py-3 text-gray-500 text-sm">{s.email}</td>
                    <td className="px-5 py-3 text-right">
                      <RemoveStudentButton classId={classId} studentId={s.id} studentName={s.full_name ?? 'student'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
            No students yet. Share the join code above so students can join.
          </div>
        )}
      </section>

      {/* Assignments */}
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
