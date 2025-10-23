'use client'
export default function Checklist({ options, value, onChange }:{ options:string[]; value:string[]; onChange:(v:string[])=>void }){
  function toggle(opt:string){
    const has = value.includes(opt)
    onChange(has ? value.filter(v=>v!==opt) : [...value, opt])
  }
  return (
    <div className="grid gap-2">
      {options.map(o => (
        <label key={o} className="flex items-center gap-2">
          <input type="checkbox" checked={value.includes(o)} onChange={()=>toggle(o)} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )
}