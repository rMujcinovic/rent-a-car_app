import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { Input, Select, Table } from '../components/UI'
import { useLanguage } from '../hooks/useLanguage'

const copy = {
	en: {
		title: 'Admin Reservations',
		searchPlaceholder: 'Search user or car',
		allStatuses: 'All statuses',
		user: 'User',
		car: 'Car',
		dates: 'Dates',
		status: 'Status',
		total: 'Total',
		actions: 'Actions',
		statusChanged: 'Status changed to',
		updateFailed: 'Failed to update status',
		pending: 'Pending',
		approved: 'Approved',
		denied: 'Denied',
		active: 'Active',
		completed: 'Completed',
		cancelled: 'Cancelled',
	},
	bs: {
		title: 'Admin Rezervacije',
		searchPlaceholder: 'Pretraga korisnika ili auta',
		allStatuses: 'Svi statusi',
		user: 'Korisnik',
		car: 'Auto',
		dates: 'Datumi',
		status: 'Status',
		total: 'Ukupno',
		actions: 'Akcije',
		statusChanged: 'Status promijenjen na',
		updateFailed: 'Azuriranje statusa nije uspjelo',
		pending: 'Na cekanju',
		approved: 'Odobreno',
		denied: 'Odbijeno',
		active: 'Aktivno',
		completed: 'Zavrseno',
		cancelled: 'Otkazano',
	},
} as const

const localizeStatus = (s: string, t: (typeof copy)['en']) => {
	if (s === 'pending') return t.pending
	if (s === 'approved') return t.approved
	if (s === 'denied') return t.denied
	if (s === 'active') return t.active
	if (s === 'completed') return t.completed
	if (s === 'cancelled') return t.cancelled
	return s
}

export default function AdminReservationsPage() {
	const { lang } = useLanguage()
	const t = copy[lang]
	const qc = useQueryClient()
	const [statusFilter, setStatusFilter] = useState('')
	const [query, setQuery] = useState('')
	const { data = [] } = useQuery({
		queryKey: ['admin-res'],
		queryFn: async () => (await api.get('/admin/reservations')).data,
		refetchInterval: 10000,
	})
	const m = useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			api.patch(`/admin/reservations/${id}/status`, { status }),
		onSuccess: async (_, vars) => {
			toast.success(`${t.statusChanged} ${localizeStatus(vars.status, t)}`)
			await qc.invalidateQueries({ queryKey: ['admin-res'] })
		},
		onError: (err: any) => {
			const msg = err?.response?.data?.error || t.updateFailed
			toast.error(msg)
		},
	})
	const statuses = ['approved', 'denied', 'active', 'completed']

	const rowsData = useMemo(
		() =>
			data.filter((r: any) => {
				if (statusFilter && r.status !== statusFilter) return false
				if (!query.trim()) return true
				const q = query.toLowerCase()
				return (
					(r.username || '').toLowerCase().includes(q) ||
					(`${r.car?.brand || ''} ${r.car?.model || ''}`).toLowerCase().includes(q)
				)
			}),
		[data, query, statusFilter],
	)

	return (
		<div>
			<h1 className='text-xl mb-2'>{t.title}</h1>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-2 mb-3'>
				<Input placeholder={t.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
				<Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
					<option value=''>{t.allStatuses}</option>
					<option value='pending'>{t.pending}</option>
					{statuses.map(s => <option key={s} value={s}>{localizeStatus(s, t)}</option>)}
					<option value='cancelled'>{t.cancelled}</option>
				</Select>
			</div>
			<Table
				head={[t.user, t.car, t.dates, t.status, t.total, t.actions]}
				rows={rowsData.map((r: any) => (
					<>
						<td className='p-2'>{r.username}</td>
						<td className='p-2'>{r.car?.brand} {r.car?.model}</td>
						<td className='p-2'>{r.startDate.slice(0, 10)}-{r.endDate.slice(0, 10)}</td>
						<td className='p-2'>{localizeStatus(r.status, t)}</td>
						<td className='p-2'>${r.totalPrice}</td>
						<td className='p-2 space-x-2'>
							{statuses.map(s => (
								<button key={s} onClick={() => m.mutate({ id: r.id, status: s })} disabled={m.isPending || r.status === s}>
									{localizeStatus(s, t)}
								</button>
							))}
						</td>
					</>
				))}
			/>
		</div>
	)
}
