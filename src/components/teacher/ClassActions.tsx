'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteClassButton({ classId, className }: { classId: string; className: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/teacher/classes/${classId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Failed to delete.')
      setLoading(false)
      setConfirming(false)
    } else {
      router.push('/teacher/classes')
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Delete &ldquo;{className}&rdquo;?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirming(false)} disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-700 transition">
          Cancel
        </button>
        {error && <span className="text-red-600 text-xs">{error}</span>}
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition">
      Delete Class
    </button>
  )
}

export function EditClassButton({ classId, currentName }: { classId: string; currentName: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch(`/api/teacher/classes/${classId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Failed to save.')
      setLoading(false)
    } else {
      setEditing(false)
      setLoading(false)
      router.refresh()
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input value={name} onChange={e => setName(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
        <button onClick={handleSave} disabled={loading}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => { setEditing(false); setName(currentName) }} disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-700 transition">
          Cancel
        </button>
        {error && <span className="text-red-600 text-xs">{error}</span>}
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)}
      className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition">
      Edit Name
    </button>
  )
}

export function RemoveStudentButton({ classId, studentId, studentName }: { classId: string; studentId: string; studentName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button onClick={handleRemove} disabled={loading}
          className="text-xs text-red-600 font-medium hover:text-red-800 transition disabled:opacity-50">
          {loading ? 'Removing…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)} disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-600 transition ml-1">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600 transition"
      title={`Remove ${studentName} from class`}>
      Remove
    </button>
  )
}

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy}
      className="text-xs text-blue-600 hover:text-blue-800 transition font-medium">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
