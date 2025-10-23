import { getAllProblems } from '@/lib/problemsRepo'

export default async function ProblemsPage() {
  const problems = await getAllProblems()
  return (
    <div className="grid gap-6">
      <h1 className="h1">문제 선택</h1>
      <div className="grid gap-3">
        {problems.map(p => (
          <a key={p.id} href={`/learn/${p.id}`} className="card hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-gray-500">{p.description}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{p.difficulty}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}