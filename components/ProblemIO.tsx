'use client'
export default function ProblemIO({ value, onChange }:{ value:{input:string; output:string; flow:string}; onChange:(v:any)=>void }){
  return (
    <div className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">[입력]</span>
        <input className="border rounded-2xl p-2" value={value.input} onChange={e=>onChange({ ...value, input: e.target.value })} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">[출력]</span>
        <input className="border rounded-2xl p-2" value={value.output} onChange={e=>onChange({ ...value, output: e.target.value })} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">처리 흐름</span>
        <textarea className="border rounded-2xl p-2" rows={4} value={value.flow} onChange={e=>onChange({ ...value, flow: e.target.value })}/>
      </label>
    </div>
  )
}