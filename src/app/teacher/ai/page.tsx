'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      let pdfBase64: string | undefined
      if (pdfFile) {
        const buffer = await pdfFile.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        bytes.forEach(b => binary += String.fromCharCode(b))
        pdfBase64 = btoa(binary)
      }

      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          pdfBase64,
          pdfName: pdfFile?.name,
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed.' }))
        setMessages(m => [...m, { role: 'assistant', content: `Error: ${err.error}` }])
        setLoading(false)
        return
      }

      // Stream the response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setMessages(m => [...m, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(m => {
          const updated = [...m]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }

      setPdfFile(null)
      setPdfName('')
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Only PDF files are supported.'); return }
    if (file.size > 20 * 1024 * 1024) { alert('File must be under 20 MB.'); return }
    setPdfFile(file)
    setPdfName(file.name)
    e.target.value = ''
  }

  function removeFile() {
    setPdfFile(null)
    setPdfName('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-0.5">Ask me to create quizzes, assignments, or explain chemistry concepts.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-4 py-12">
            <div className="text-5xl">🤖</div>
            <div>
              <p className="font-medium text-gray-600 text-lg">Chemistry Teaching Assistant</p>
              <p className="text-sm mt-1">Try asking:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {[
                'Create a 10-question quiz on atomic structure',
                'Write an assignment on balancing chemical equations',
                'Upload a PDF and ask me to make a quiz from it',
                'Explain the difference between ionic and covalent bonds',
              ].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:text-blue-700 transition text-gray-600">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
            }`}>
              {msg.content || (loading && i === messages.length - 1
                ? <span className="inline-flex gap-1"><span className="animate-bounce" style={{animationDelay:'0ms'}}>•</span><span className="animate-bounce" style={{animationDelay:'150ms'}}>•</span><span className="animate-bounce" style={{animationDelay:'300ms'}}>•</span></span>
                : ''
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-gray-200">
        {pdfName && (
          <div className="flex items-center gap-2 mb-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm">
            <span className="text-blue-500">📄</span>
            <span className="text-blue-700 font-medium flex-1 truncate">{pdfName}</span>
            <button onClick={removeFile} className="text-blue-400 hover:text-blue-700 transition font-bold">✕</button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition"
            title="Upload PDF">
            📎
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFile} />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything…"
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any) } }}
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="shrink-0 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm font-semibold">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
