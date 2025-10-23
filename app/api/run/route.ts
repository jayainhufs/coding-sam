import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { language, code, stdin } = await req.json() as {language: 'python'|'c'|'java', code: string, stdin?: string}

    const langMap = { python: 'python', c: 'c', java: 'java' as const }
    const body = {
      language: langMap[language],
      version: '*',
      files: [{ name: language === 'java' ? 'Main.java' : language === 'c' ? 'main.c' : 'main.py', content: code }],
      stdin: stdin ?? '',
    }

    const r = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const j = await r.json()
    return NextResponse.json({ ok: true, result: j })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? 'run error' }, { status: 400 })
  }
}