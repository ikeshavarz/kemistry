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
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id, class_id, organizations(name)')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'teacher') { router.replace('/teacher'); return }
      if (profile?.class_id) { router.replace('/student'); return }

      if (!profile?.organization_id) {
        setChecking(false)
        return
      }

      setOrgName((profile as any).organizations?.name ?? '')

      const { data: cls } = await supabase
        .from('classes')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name')

      setClasses(cls ?? [])
      setChecking(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePick() {
    if (!selected) { setError('Please select a class.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/student/pick-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selected }),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    } else {
      // Use replace so back button doesn't return here
      router.replace('/student')
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Class</h1>
          {orgName && <p className="text-gray-500 text-sm mt-1">{orgName}</p>}
          <p className="text-gray-400 text-xs mt-1">You only do this once.</p>
        </div>

        {classes.length === 0 ? (
          <div className="text-center text-gray-400 py-8 space-y-2">
            <p className="text-lg">No classes available yet.</p>
            <p className="text-sm">Your teacher hasn&apos;t created any classes. Check back later.</p>
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {classes.length > 0 && (
          <button onClick={handlePick} disabled={loading || !selected}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Joining…' : 'Join This Class'}
          </button>
        )}

        <form action="/api/auth/signout" method="post" className="mt-4">
          <button type="submit" className="w-full text-sm text-gray-400 hover:text-gray-600 transition py-2">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
