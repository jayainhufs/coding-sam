type Step = { key: string; label: string }
export default function Stepper({ steps, active, onChange }:{ steps: Step[]; active: number; onChange:(i:number)=>void }){
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((s,i)=> (
        <li key={s.key}>
          <button onClick={()=>onChange(i)}
            className={`px-3 py-1 rounded-full text-sm border ${i===active? 'bg-brand-600 text-white border-brand-600':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{i+1}. {s.label}</button>
        </li>
      ))}
    </ol>
  )}