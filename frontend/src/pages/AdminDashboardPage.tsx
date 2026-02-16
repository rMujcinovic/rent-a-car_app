import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Table } from '../components/UI'
import { useLanguage } from '../hooks/useLanguage'

function MetricCard({ name, value }: { name: string; value: number }) {
	return (
		<div className='bg-white p-3 rounded border border-slate-200'>
			<p className='text-xs text-slate-500'>{name}</p>
			<p className='text-xl font-semibold'>{Number(value).toFixed(0)}</p>
		</div>
	)
}

export default function AdminDashboardPage() {
	const { lang } = useLanguage()
	const t = lang === 'bs'
		? {
			title: 'Pregled',
			utilization: 'Iskoristenost',
			user: 'Korisnik',
			car: 'Auto',
			status: 'Status',
			total: 'Ukupno',
			auditLog: 'Audit Log',
			when: 'Vrijeme',
			actor: 'Aktor',
			action: 'Akcija',
			entity: 'Entitet',
			details: 'Detalji',
			totalCars: 'Ukupno Auta',
			availableCars: 'Dostupna Auta',
			activeRentals: 'Aktivni Najmovi',
			pendingReservations: 'Rezervacije na cekanju',
			revenue: 'Prihod',
		}
		: {
			title: 'Dashboard',
			utilization: 'Utilization',
			user: 'User',
			car: 'Car',
			status: 'Status',
			total: 'Total',
			auditLog: 'Audit Log',
			when: 'When',
			actor: 'Actor',
			action: 'Action',
			entity: 'Entity',
			details: 'Details',
			totalCars: 'Total Cars',
			availableCars: 'Available Cars',
			activeRentals: 'Active Rentals',
			pendingReservations: 'Pending Reservations',
			revenue: 'Revenue',
		}
	const { data } = useQuery({
		queryKey: ['dash'],
		queryFn: async () => (await api.get('/admin/dashboard')).data,
	})
	if (!data) return null
	const m = data.metrics
	const metricLabel = (key: string) => {
		if (key === 'totalCars') return t.totalCars
		if (key === 'availableCars') return t.availableCars
		if (key === 'activeRentals') return t.activeRentals
		if (key === 'pendingReservations') return t.pendingReservations
		if (key === 'revenue') return t.revenue
		return key
	}

	return (
		<div className='space-y-3'>
			<h1 className='text-xl'>{t.title}</h1>
			<div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
				{Object.entries(m).map(([k, v]) => <MetricCard key={k} name={metricLabel(k)} value={Number(v)} />)}
			</div>

			<div className='bg-white p-3 rounded border border-slate-200'>
				<h2 className='font-medium mb-2'>{t.utilization}</h2>
				<div className='h-3 bg-slate-100 rounded overflow-hidden'>
					<div
						className='h-full bg-cyan-500'
						style={{ width: `${Math.min(100, Math.round((Number(m.activeRentals || 0) / Math.max(1, Number(m.totalCars || 1))) * 100))}%` }}
					/>
				</div>
			</div>

			<Table
				head={[t.user, t.car, t.status, t.total]}
				rows={data.recent.map((r: any) => (
					<>
						<td className='p-2'>{r.username}</td>
						<td className='p-2'>{r.car?.brand} {r.car?.model}</td>
						<td className='p-2'>{r.status}</td>
						<td className='p-2'>${r.totalPrice}</td>
					</>
				))}
			/>

			<div className='bg-white p-3 rounded border border-slate-200'>
				<h2 className='font-medium mb-2'>{t.auditLog}</h2>
				<Table
					head={[t.when, t.actor, t.action, t.entity, t.details]}
					rows={(data.auditLogs || []).map((a: any) => (
						<>
							<td className='p-2'>{String(a.createdAt).slice(0, 19).replace('T', ' ')}</td>
							<td className='p-2'>{a.actorName}</td>
							<td className='p-2'>{a.action}</td>
							<td className='p-2'>{a.entity}#{String(a.entityId).slice(0, 8)}</td>
							<td className='p-2'>{a.details}</td>
						</>
					))}
				/>
			</div>
		</div>
	)
}
