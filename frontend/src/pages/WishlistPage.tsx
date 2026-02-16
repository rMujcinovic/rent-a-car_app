import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'
import { Car } from '../api/types'
import { resolveImageSrc } from '../utils/image'
import { getWishlistIds, toggleWishlistId } from '../utils/wishlist'
import { useLanguage } from '../hooks/useLanguage'

const copy = {
	en: {
		title: 'Wishlist',
		empty: 'You have no cars in your wish list.',
		remove: 'Remove',
		removedToast: 'Removed from wish list',
	},
	bs: {
		title: 'Lista Zelja',
		empty: 'Nemate nijedno auto na listi zelja.',
		remove: 'Ukloni',
		removedToast: 'Uklonjeno sa liste zelja',
	},
} as const

export default function WishlistPage() {
	const { user } = useAuth()
	const { lang } = useLanguage()
	const t = copy[lang]
	const { data } = useQuery({
		queryKey: ['wishlist-cars'],
		queryFn: async () => (await api.get('/cars', { params: { limit: 200, sort: 'newest' } })).data,
	})
	const [wishlistIds, setWishlistIds] = useState<string[]>([])
	const [bumpId, setBumpId] = useState<string | null>(null)
	useEffect(() => {
		if (!user?.id) {
			setWishlistIds([])
			return
		}
		setWishlistIds(getWishlistIds(user.id))
	}, [user?.id])
	const items: Car[] = useMemo(
		() => (data?.items || []).filter((c: Car) => wishlistIds.includes(c.id)),
		[data?.items, wishlistIds],
	)

	return (
		<div className='space-y-3'>
			<h1 className='text-xl'>{t.title}</h1>
			{items.length === 0 ? (
				<p className='text-slate-600'>{t.empty}</p>
			) : (
				<div className='grid md:grid-cols-3 gap-3'>
					{items.map(c => (
						<div key={c.id} className='bg-white rounded p-3 space-y-2'>
							<Link to={`/cars/${c.id}`} className='block'>
								<img src={resolveImageSrc(c.images?.[0])} className='h-36 w-full object-cover rounded' />
								<h2 className='mt-2'>{c.brand} {c.model}</h2>
								<p>${c.dailyPrice}/day</p>
							</Link>
							<button
								type='button'
								className={`px-3 py-1.5 rounded border text-sm transition-transform duration-200 active:scale-90 ${bumpId === c.id ? 'scale-105' : ''}`}
								onClick={() => {
									if (!user?.id) return
									setBumpId(c.id)
									setTimeout(() => setBumpId(prev => (prev === c.id ? null : prev)), 180)
									const next = toggleWishlistId(user.id, c.id)
									setWishlistIds(next)
									toast.success(t.removedToast, { duration: 1200 })
								}}
							>
								{t.remove}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
