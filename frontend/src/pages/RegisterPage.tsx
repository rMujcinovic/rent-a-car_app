import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../auth/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button, Input } from '../components/UI'

const schema = z
	.object({
		username: z.string().min(3, 'Username must be at least 3 characters'),
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string().min(6, 'Please confirm password'),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

export default function RegisterPage() {
	const nav = useNavigate()
	const { register: doRegister } = useAuth()
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(schema) })

	return (
		<div className='relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-slate-950'>
			<div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950' />
			<div className='pointer-events-none absolute inset-0 overflow-hidden'>
				<div className='absolute left-1/2 top-1/2 h-80 w-80 -translate-x-[120%] -translate-y-[45%] rounded-full bg-cyan-400/20 blur-3xl' />
				<div className='absolute left-1/2 top-1/2 h-80 w-80 translate-x-[20%] -translate-y-[12%] rounded-full bg-indigo-500/25 blur-3xl' />
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
				<h1 className='mb-5 text-center text-2xl font-bold text-slate-900'>Register</h1>

				<form
					onSubmit={handleSubmit(async (v) => {
						try {
							await doRegister(v.username, v.password)
							toast.success('Registered')
							nav('/login')
						} catch (err: any) {
							const msg = err?.response?.data?.error || 'Failed'
							toast.error(msg)
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
					<div>
						<Input type='password' placeholder='Confirm password' {...register('confirmPassword')} />
						<p className='mt-1 text-xs text-rose-600'>{errors.confirmPassword?.message as string}</p>
					</div>

					<p className='text-sm text-slate-600'>
						You already have an account?{' '}
						<Link to='/login' className='font-medium text-blue-700 hover:text-blue-600'>
							Sign in
						</Link>
					</p>

					<Button className='w-full' disabled={isSubmitting}>Register</Button>
				</form>
				</div>
			</div>
		</div>
	)
}
