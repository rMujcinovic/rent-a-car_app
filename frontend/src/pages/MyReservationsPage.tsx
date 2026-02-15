import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { Table } from '../components/UI'

export default function MyReservationsPage() {
	const qc = useQueryClient()
	const { data = [] } = useQuery({
		queryKey: ['myres'],
		queryFn: async () => (await api.get('/reservations/my')).data,
		refetchInterval: 10000,
	})
	const m = useMutation({
		mutationFn: (id: string) => api.patch(`/reservations/${id}/cancel`),
		onSuccess: async () => {
			toast.success('Reservation cancelled')
			await qc.invalidateQueries({ queryKey: ['myres'] })
		},
		onError: (err: any) => {
			const msg = err?.response?.data?.error || 'Failed to cancel reservation'
			toast.error(msg)
		},
	})
	return (
		<div>
			<h1 className='text-xl mb-2'>My reservations</h1>
			<Table
				head={['Car', 'Dates', 'Status', 'Total', 'Actions']}
				rows={data.map((r: any) => (
					<>
						<td className='p-2'>{r.car?.brand} {r.car?.model}</td>
						<td className='p-2'>{r.startDate.slice(0, 10)} - {r.endDate.slice(0, 10)}</td>
						<td className='p-2'>{r.status}</td>
						<td className='p-2'>${r.totalPrice}</td>
						<td className='p-2'>
							<button onClick={() => m.mutate(r.id)} disabled={m.isPending || r.status === 'cancelled'}>
								Cancel
							</button>
						</td>
					</>
				))}
			/>
		</div>
	)
}
