import { forwardRef, ReactNode } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return <input ref={ref} {...props} className={`w-full border rounded p-2 ${props.className ?? ''}`.trim()} />
})

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  return <select ref={ref} {...props} className={`w-full border rounded p-2 ${props.className ?? ''}`.trim()} />
})

export const Button = ({ children, ...p }: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 ${p.className ?? ''}`.trim()}>
    {children}
  </button>
)

export const Table = ({ head, rows }: { head: string[]; rows: ReactNode[] }) => (
  <table className='w-full text-sm bg-white'>
    <thead>
      <tr>{head.map((h) => <th key={h} className='text-left border p-2'>{h}</th>)}</tr>
    </thead>
    <tbody>{rows.map((r, i) => <tr key={i} className='border-b'>{r}</tr>)}</tbody>
  </table>
)
