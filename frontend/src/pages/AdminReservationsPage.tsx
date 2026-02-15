import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { Table } from '../components/UI'

export default function AdminReservationsPage() {
	const qc = useQueryClient()
	const { data = [] } = useQuery({
		queryKey: ['admin-res'],
		queryFn: async () => (await api.get('/admin/reservations')).data,
		refetchInterval: 10000,
	})
	const m = useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			api.patch(`/admin/reservations/${id}/status`, { status }),
		onSuccess: async (_, vars) => {
			toast.success(`Status changed to ${vars.status}`)
			await qc.invalidateQueries({ queryKey: ['admin-res'] })
		},
		onError: (err: any) => {
			const msg = err?.response?.data?.error || 'Failed to update status'
			toast.error(msg)
		},
	})
	const statuses = ['approved', 'denied', 'active', 'completed']
	return (
		<div>
			<h1 className='text-xl mb-2'>Admin Reservations</h1>
			<Table
				head={['User', 'Car', 'Dates', 'Status', 'Total', 'Actions']}
				rows={data.map((r: any) => (
					<>
						<td className='p-2'>{r.username}</td>
						<td className='p-2'>{r.car?.brand} {r.car?.model}</td>
						<td className='p-2'>{r.startDate.slice(0, 10)}-{r.endDate.slice(0, 10)}</td>
						<td className='p-2'>{r.status}</td>
						<td className='p-2'>${r.totalPrice}</td>
						<td className='p-2 space-x-2'>
							{statuses.map(s => (
								<button key={s} onClick={() => m.mutate({ id: r.id, status: s })} disabled={m.isPending}>
									{s}
								</button>
							))}
						</td>
					</>
				))}
			/>
		</div>
	)
}
