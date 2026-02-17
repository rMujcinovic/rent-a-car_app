import { ReactNode, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, any>(function Input(
	{ className, ...p },
	ref,
) {
	return <input ref={ref} {...p} className={`w-full border rounded px-3 py-2 text-base md:text-sm min-h-[44px] md:min-h-[40px] ${className || ''}`} />
})

export const Select = forwardRef<HTMLSelectElement, any>(function Select(
	{ className, ...p },
	ref,
) {
	return <select ref={ref} {...p} className={`w-full border rounded px-3 py-2 text-base md:text-sm min-h-[44px] md:min-h-[40px] ${className || ''}`} />
})

export const Button=({children,...p}:{children:ReactNode}&any)=><button {...p} className='px-4 py-2 rounded bg-blue-600 text-white text-base md:text-sm min-h-[44px] md:min-h-[40px] disabled:opacity-50'>{children}</button>
export const Table=({head,rows}:{head:string[];rows:ReactNode[]})=>(
	<div className='w-full overflow-x-auto'>
		<table className='w-full min-w-[760px] text-sm bg-white'>
			<thead>
				<tr>{head.map(h=><th key={h} className='text-left border p-2 whitespace-nowrap'>{h}</th>)}</tr>
			</thead>
			<tbody>{rows.map((r,i)=><tr key={i} className='border-b'>{r}</tr>)}</tbody>
		</table>
	</div>
)
