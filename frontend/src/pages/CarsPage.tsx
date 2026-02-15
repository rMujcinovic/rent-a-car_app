import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Car } from '../api/types'
import { Link, useSearchParams } from 'react-router-dom'
import { Input, Select } from '../components/UI'

export default function CarsPage() {
	const [sp, setSp] = useSearchParams()
	const [q, setQ] = useState(sp.get('q') || '')
	const page = Number(sp.get('page') || 1)

	useEffect(() => {
		setQ(sp.get('q') || '')
	}, [sp])

	const setParam = (key: string, value: string) => {
		const next = new URLSearchParams(sp)
		if (value.trim() === '') next.delete(key)
		else next.set(key, value)
		next.set('page', '1')
		setSp(next)
	}

	const { data, isLoading } = useQuery({
		queryKey: ['cars', sp.toString()],
		queryFn: async () => (await api.get('/cars', { params: Object.fromEntries(sp) })).data,
	})

	if (isLoading) return <p>Loading...</p>
	const cars: Car[] = data.items

	return (
		<div className='space-y-3'>
			<h1 className='text-xl'>Cars</h1>
			<div className='grid grid-cols-2 md:grid-cols-6 gap-2'>
				<form
					className='col-span-2 md:col-span-2'
					onSubmit={e => {
						e.preventDefault()
						setParam('q', q)
					}}
				>
					<Input
						placeholder='search brand or model'
						value={q}
						onChange={e => setQ(e.target.value)}
					/>
				</form>
				<Select value={sp.get('status') || ''} onChange={e => setParam('status', e.target.value)}>
					<option value=''>all status</option>
					<option value='available'>available</option>
					<option value='rented'>rented</option>
					<option value='maintenance'>maintenance</option>
				</Select>
				<Select value={sp.get('sort') || 'newest'} onChange={e => setParam('sort', e.target.value)}>
					<option value='newest'>Newest</option>
					<option value='price_asc'>Price asc</option>
					<option value='price_desc'>Price desc</option>
					<option value='year'>Year</option>
				</Select>
			</div>
			<div className='grid md:grid-cols-3 gap-3'>
				{cars.map(c => (
					<Link key={c.id} to={`/cars/${c.id}`} className='bg-white rounded p-3 block'>
						<img src={c.images?.[0]} className='h-36 w-full object-cover rounded' />
						<h2>{c.brand} {c.model}</h2>
						<p>${c.dailyPrice}/day</p>
					</Link>
				))}
			</div>
			{cars.length === 0 && <p>No cars found.</p>}
			<div className='flex gap-2'>
				<button
					disabled={page <= 1}
					onClick={() => {
						const next = new URLSearchParams(sp)
						next.set('page', String(page - 1))
						setSp(next)
					}}
				>
					Prev
				</button>
				<button
					onClick={() => {
						const next = new URLSearchParams(sp)
						next.set('page', String(page + 1))
						setSp(next)
					}}
				>
					Next
				</button>
			</div>
		</div>
	)
}
