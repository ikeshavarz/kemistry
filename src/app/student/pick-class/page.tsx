'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function JoinClassPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'teacher') { router.replace('/teacher'); return }

      setChecking(false)
    }
    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Please enter a join code.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/student/pick-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode: trimmed }),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    } else {
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
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">Join a Class</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the join code your teacher gave you.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="e.g. XK7M2P"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:border-blue-500 uppercase"
            autoComplete="off"
            autoFocus
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || code.trim().length === 0}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Joining…' : 'Join Class'}
          </button>
        </form>

        <Link href="/student"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 transition py-3 mt-2">
          ← Back to my classes
        </Link>
      </div>
    </main>
  )
}
