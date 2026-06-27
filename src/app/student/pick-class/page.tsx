'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Class = { id: string; name: string }

export default function PickClassPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name)')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      setOrgName((profile as any).organizations?.name ?? '')

      const { data: cls } = await supabase
        .from('classes')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (cls) setClasses(cls)
    }
    load()
  }, [])

  async function handlePick() {
    if (!selected) { setError('Please select a class.'); return }
    setLoading(true)
    const res = await fetch('/api/student/pick-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selected }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false) }
    else router.push('/student')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Class</h1>
          {orgName && <p className="text-gray-500 text-sm mt-1">{orgName}</p>}
        </div>

        {classes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No classes have been created yet.</p>
            <p className="text-sm mt-2">Please check back later or contact your teacher.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {classes.map(cls => (
              <button key={cls.id} type="button" onClick={() => setSelected(cls.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition font-medium ${
                  selected === cls.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300'
                }`}>
                {cls.name}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button onClick={handlePick} disabled={loading || classes.length === 0}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Saving…' : 'Join This Class'}
        </button>
      </div>
    </main>
  )
}
