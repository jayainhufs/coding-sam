import problems from '@/data/problems.json'
import { Problem } from './types'

export async function getAllProblems(): Promise<Problem[]> {
  return problems as Problem[]
}

export async function getProblemById(id: string): Promise<Problem | null> {
  const all = await getAllProblems()
  return all.find(p => p.id === id) ?? null
}

export async function getRecommended(): Promise<Pick<Problem,'id'|'title'|'difficulty'>> {
  const all = await getAllProblems()
  // TODO: 추후 사용자 pref 기반 추천 로직 대체
  const pick = all[0]
  return { id: pick.id, title: pick.title, difficulty: pick.difficulty }
}