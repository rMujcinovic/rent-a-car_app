import { ReactNode } from 'react'
export const Input=(p:any)=><input {...p} className='w-full border rounded p-2'/>
export const Select=(p:any)=><select {...p} className='w-full border rounded p-2'/>
export const Button=({children,...p}:{children:ReactNode}&any)=><button {...p} className='px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50'>{children}</button>
export const Table=({head,rows}:{head:string[];rows:ReactNode[]})=><table className='w-full text-sm bg-white'><thead><tr>{head.map(h=><th key={h} className='text-left border p-2'>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className='border-b'>{r}</tr>)}</tbody></table>
