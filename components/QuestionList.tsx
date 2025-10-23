'use client'
export default function QuestionList({ value, onChange }:{ value: string[]; onChange:(v:string[])=>void }){
  function add() { onChange([ ...value, '' ]) }
  function edit(i:number, v:string){ const clone=[...value]; clone[i]=v; onChange(clone) }
  function remove(i:number){ const clone=[...value]; clone.splice(i,1); onChange(clone) }
  return (
    <div className="grid gap-3">
      <div className="font-semibold">나의 질문 추가</div>
      <div className="grid gap-2">
        {value.map((q,i)=> (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 w-6">{i+1}.</span>
            <input className="flex-1 border rounded-2xl p-2" value={q} onChange={e=>edit(i,e.target.value)} />
            <button className="text-xs text-gray-500" onClick={()=>remove(i)}>삭제</button>
          </div>
        ))}
        <button className="btn-ghost w-fit" onClick={add}>질문 추가</button>
      </div>
    </div>
  )
}