import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Message = { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminClient().from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { messages, pdfBase64, pdfName } = await request.json() as {
      messages: Message[]
      pdfBase64?: string
      pdfName?: string
    }

    // Build the last user message, optionally with a PDF attachment
    const lastUserMessage = messages[messages.length - 1]
    let userContent: Anthropic.MessageParam['content']

    if (pdfBase64) {
      userContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
          title: pdfName ?? 'Uploaded document',
        } as any,
        { type: 'text', text: lastUserMessage.content },
      ]
    } else {
      userContent = lastUserMessage.content
    }

    const apiMessages: Anthropic.MessageParam[] = [
      ...messages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: userContent },
    ]

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are a helpful chemistry teaching assistant for a high school and college chemistry teacher.
You help with:
- Creating quizzes and tests from lesson material or uploaded PDFs
- Writing assignment descriptions and rubrics
- Answering chemistry questions and explaining concepts
- Suggesting lesson plans and activities

When asked to create a quiz, format it clearly with numbered questions.
When asked to create an assignment, include a clear title, description, and what students need to submit.
Be concise and practical — the teacher is busy.`,
      messages: apiMessages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error.' },
      { status: 500 }
    )
  }
}
