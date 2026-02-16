import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../auth/AuthContext'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Input } from '../components/UI'

const schema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters'),
	password: z.string().min(5, 'Password must be at least 5 characters'),
})

export default function LoginPage() {
	const nav = useNavigate()
	const { user, login } = useAuth()
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(schema) })

	if (user) {
		return <Navigate to='/cars' replace />
	}

	return (
		<div className='relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-slate-950'>
			<div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950' />
			<div className='pointer-events-none absolute inset-0 overflow-hidden'>
				<div className='absolute left-1/2 top-1/2 h-80 w-80 -translate-x-[125%] -translate-y-[50%] rounded-full bg-cyan-400/20 blur-3xl' />
				<div className='absolute left-1/2 top-1/2 h-80 w-80 translate-x-[25%] -translate-y-[5%] rounded-full bg-blue-500/25 blur-3xl' />
			</div>

			<div className='relative w-full max-w-md'>
				<div className='pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400/35 via-blue-500/30 to-indigo-500/35 blur-md' />
				<div className='pointer-events-none absolute -inset-3 rounded-[1.75rem] border border-white/10' />
				<div className='relative w-full rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur'>
				<Link
					to='/'
					aria-label='Go to home page'
					className='absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
				>
					<svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</Link>
				<h1 className='mb-5 text-center text-2xl font-bold text-slate-900'>Login</h1>

				<form
					onSubmit={handleSubmit(async (v) => {
						try {
							await login(v.username, v.password)
							toast.success('Logged in')
							nav('/cars')
						} catch {
							toast.error('Invalid credentials')
						}
					})}
					className='space-y-3'
				>
					<div>
						<Input placeholder='Username' {...register('username')} />
						<p className='mt-1 text-xs text-rose-600'>{errors.username?.message as string}</p>
					</div>
					<div>
						<Input type='password' placeholder='Password' {...register('password')} />
						<p className='mt-1 text-xs text-rose-600'>{errors.password?.message as string}</p>
					</div>
					<Button className='w-full' disabled={isSubmitting}>Login</Button>
				</form>

				<p className='mt-4 text-center text-sm text-slate-600'>
					Don't have an account?{' '}
					<Link to='/register' className='font-medium text-blue-700 hover:text-blue-600'>
						Register
					</Link>
				</p>
				</div>
			</div>
		</div>
	)
}
