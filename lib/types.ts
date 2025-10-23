export type Difficulty = 'Easy'|'Medium'|'Hard'
export type Problem = {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  tags?: string[]
}