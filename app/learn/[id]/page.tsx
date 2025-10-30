// ~/Desktop/coding-sam/app/learn/[id]/page.tsx
import LearnWizard from '../../../components/LearnWizard'
import { getProblemById } from '@/lib/problemsRepo'

export default async function Page({ params }: { params: { id: string } }) {
  const problem = await getProblemById(params.id)
  if (!problem) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold">문제를 찾을 수 없어요</h1>
        <p className="text-slate-600 mt-2">ID: {params.id}</p>
      </main>
    )
  }
  return <LearnWizard problem={problem} />
}
// dd