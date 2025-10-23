import { NextRequest, NextResponse } from 'next/server'
import { getAllProblems, getProblemById, getRecommended } from '@/lib/problemsRepo'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const recommended = searchParams.get('recommended')
  if (id) {
    const p = await getProblemById(id)
    return NextResponse.json(p)
  }
  if (recommended) {
    const p = await getRecommended()
    return NextResponse.json(p)
  }
  const list = await getAllProblems()
  return NextResponse.json(list)
}