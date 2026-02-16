import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { Table } from '../components/UI'
import { useLanguage } from '../hooks/useLanguage'

const FLOW = ['pending', 'approved', 'active', 'completed'] as const
const copy = {
	en: {
		title: 'My Reservations',
		car: 'Car',
		dates: 'Dates',
		status: 'Status',
		timeline: 'Timeline',
		total: 'Total',
		actions: 'Actions',
		cancel: 'Cancel',
		cancelledOk: 'Reservation cancelled',
		cancelFail: 'Failed to cancel reservation',
		pending: 'Pending',
		approved: 'Approved',
		active: 'Active',
		completed: 'Completed',
		cancelled: 'Cancelled',
		denied: 'Denied',
	},
	bs: {
		title: 'Moje Rezervacije',
		car: 'Auto',
		dates: 'Datumi',
		status: 'Status',
		timeline: 'Tok',
		total: 'Ukupno',
		actions: 'Akcije',
		cancel: 'Otkazi',
		cancelledOk: 'Rezervacija je otkazana',
		cancelFail: 'Otkazivanje rezervacije nije uspjelo',
		pending: 'Na cekanju',
		approved: 'Odobreno',
		active: 'Aktivno',
		completed: 'Zavrseno',
		cancelled: 'Otkazano',
		denied: 'Odbijeno',
	},
} as const

const statusText = (status: string, t: (typeof copy)['en']) => {
	if (status === 'pending') return t.pending
	if (status === 'approved') return t.approved
	if (status === 'active') return t.active
	if (status === 'completed') return t.completed
	if (status === 'cancelled') return t.cancelled
	if (status === 'denied') return t.denied
	return status
}

function StatusTimeline({ status, t }: { status: string; t: (typeof copy)['en'] }) {
	const currentIdx = FLOW.indexOf(status)
	return (
		<div className='flex items-center gap-2 flex-wrap'>
			{FLOW.map((s, i) => {
				const cancelled = status === 'cancelled' || status === 'denied'
				const active = currentIdx === i
				return (
					<span
						key={s}
						className={`text-[11px] px-2 py-0.5 rounded-full border ${
							cancelled
								? 'bg-slate-50 border-slate-200 text-slate-400'
								: active
									? 'bg-emerald-50 border-emerald-300 text-emerald-700'
									: 'bg-slate-50 border-slate-200 text-slate-400'
						}`}
					>
						{statusText(s, t)}
					</span>
				)
			})}
			{(status === 'cancelled' || status === 'denied') && (
				<span className='text-[11px] px-2 py-0.5 rounded-full border bg-red-50 border-red-300 text-red-700'>
					{statusText(status, t)}
				</span>
			)}
		</div>
	)
}

export default function MyReservationsPage() {
	const { lang } = useLanguage()
	const t = copy[lang]
	const qc = useQueryClient()
	const { data = [] } = useQuery({
		queryKey: ['myres'],
		queryFn: async () => (await api.get('/reservations/my')).data,
		refetchInterval: 10000,
	})
	const m = useMutation({
		mutationFn: (id: string) => api.patch(`/reservations/${id}/cancel`),
		onSuccess: async () => {
			toast.success(t.cancelledOk)
			await qc.invalidateQueries({ queryKey: ['myres'] })
		},
		onError: (err: any) => {
			const msg = err?.response?.data?.error || t.cancelFail
			toast.error(msg)
		},
	})

	return (
		<div>
			<h1 className='text-xl mb-2'>{t.title}</h1>
			<Table
				head={[t.car, t.dates, t.status, t.timeline, t.total, t.actions]}
				rows={data.map((r: any) => (
					<>
						<td className='p-2'>{r.car?.brand} {r.car?.model}</td>
						<td className='p-2'>{r.startDate.slice(0, 10)} - {r.endDate.slice(0, 10)}</td>
						<td className='p-2 capitalize'>{statusText(r.status, t)}</td>
						<td className='p-2'><StatusTimeline status={r.status} t={t} /></td>
						<td className='p-2'>${r.totalPrice}</td>
						<td className='p-2'>
							<button onClick={() => m.mutate(r.id)} disabled={m.isPending || ['cancelled', 'completed', 'denied'].includes(r.status)}>
								{t.cancel}
							</button>
						</td>
					</>
				))}
			/>
		</div>
	)
}
