import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Button, Input } from '../components/UI'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { resolveImageSrc } from '../utils/image'
import { useLanguage } from '../hooks/useLanguage'
import { useAuth } from '../auth/AuthContext'

const copy = {
	en: {
		loading: 'Loading...',
		reservationSubmitted: 'Reservation submitted',
		reservationFailed: 'Failed to submit reservation',
		unavailableRanges: 'Unavailable date ranges',
		noActiveReservations: 'No active reservations for this car.',
		vehicleInfo: 'Vehicle information',
		brandModel: 'Brand / Model',
		year: 'Year',
		category: 'Category',
		transmission: 'Transmission',
		fuel: 'Fuel',
		seats: 'Seats',
		mileage: 'Mileage',
		price: 'Price',
		perDay: '/day',
		reserve: 'Reserve',
		pickupLocation: 'Pickup location',
		dropoffLocation: 'Dropoff location',
		notes: 'Notes',
		submitting: 'Submitting...',
		submit: 'Submit',
		reviewsTitle: 'Reviews',
		totalReviews: 'reviews',
		noReviews: 'No reviews yet.',
		leaveReview: 'Leave a review',
		loginToReview: 'Login to leave a review',
		reviewComment: 'Comment (optional)',
		reviewSubmit: 'Submit review',
		reviewSubmitting: 'Submitting review...',
		reviewCreated: 'Review submitted',
		reviewFailed: 'Failed to submit review',
		alreadyReviewed: 'You already reviewed this car',
		loginRequired: 'You need to log in to reserve this car',
		backToCars: 'Back to cars',
	},
	bs: {
		loading: 'Ucitavanje...',
		reservationSubmitted: 'Rezervacija poslana',
		reservationFailed: 'Slanje rezervacije nije uspjelo',
		unavailableRanges: 'Nedostupni datumi',
		noActiveReservations: 'Nema aktivnih rezervacija za ovo auto.',
		vehicleInfo: 'Informacije o vozilu',
		brandModel: 'Brend / Model',
		year: 'Godina',
		category: 'Kategorija',
		transmission: 'Transmisija',
		fuel: 'Gorivo',
		seats: 'Sjedista',
		mileage: 'Kilometraza',
		price: 'Cijena',
		perDay: '/dan',
		reserve: 'Rezervisi',
		pickupLocation: 'Lokacija preuzimanja',
		dropoffLocation: 'Lokacija vracanja',
		notes: 'Napomena',
		submitting: 'Slanje...',
		submit: 'Potvrdi',
		reviewsTitle: 'Recenzije',
		totalReviews: 'recenzija',
		noReviews: 'Jos nema recenzija.',
		leaveReview: 'Ostavi recenziju',
		loginToReview: 'Prijavi se da ostavis recenziju',
		reviewComment: 'Komentar (opcionalno)',
		reviewSubmit: 'Posalji recenziju',
		reviewSubmitting: 'Slanje recenzije...',
		reviewCreated: 'Recenzija je poslana',
		reviewFailed: 'Slanje recenzije nije uspjelo',
		alreadyReviewed: 'Vec si ocijenio ovo auto',
		loginRequired: 'Morate se ulogovati da rezervisete auto',
		backToCars: 'Nazad na auta',
	},
} as const

function InfoItem({ icon, label, value }: { icon: JSX.Element; label: string; value: React.ReactNode }) {
	return (
		<div className='rounded-xl border border-slate-200 bg-slate-50/90 p-3 transition hover:border-cyan-200 hover:bg-cyan-50/40'>
			<div className='flex items-center gap-2 text-slate-500 text-xs'>
				<span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-cyan-700'>
					{icon}
				</span>
				<span>{label}</span>
			</div>
			<div className='mt-1 text-sm font-medium text-slate-900'>{value}</div>
		</div>
	)
}

export default function CarDetailPage() {
	const { id = '' } = useParams()
	const navigate = useNavigate()
	const { user } = useAuth()
	const { lang } = useLanguage()
	const t = copy[lang]
	const [imageIndex, setImageIndex] = useState(0)
	const [showFullscreen, setShowFullscreen] = useState(false)
	const [openSections, setOpenSections] = useState({
		vehicle: false,
		reserve: false,
		reviews: false,
	})
	const { data: car } = useQuery({ queryKey: ['car', id], queryFn: async () => (await api.get('/cars/' + id)).data })
	const { data: extras = [] } = useQuery({ queryKey: ['extras'], queryFn: async () => (await api.get('/extras')).data })
	const { data: availability } = useQuery({
		queryKey: ['availability', id],
		queryFn: async () => (await api.get(`/cars/${id}/availability`)).data,
	})
	const { data: reviewsData, refetch: refetchReviews } = useQuery({
		queryKey: ['car-reviews', id],
		queryFn: async () => (await api.get(`/cars/${id}/reviews`)).data,
	})
	const { register, handleSubmit } = useForm<any>()
	const { register: registerReview, handleSubmit: handleSubmitReview, reset: resetReview, watch: watchReview } = useForm<any>({
		defaultValues: { rating: 5, comment: '' },
	})
	const m = useMutation({
		mutationFn: (v: any) => api.post('/reservations', v),
		onSuccess: () => toast.success(t.reservationSubmitted),
		onError: (err: any) => toast.error(err?.response?.data?.error || t.reservationFailed),
	})
	const reviewMutation = useMutation({
		mutationFn: (v: any) => api.post(`/cars/${id}/reviews`, v),
		onSuccess: async () => {
			toast.success(t.reviewCreated)
			resetReview({ rating: 5, comment: '' })
			await refetchReviews()
		},
		onError: (err: any) => {
			const msg = err?.response?.data?.error || t.reviewFailed
			toast.error(msg)
		},
	})
	const images: string[] = useMemo(
		() => (Array.isArray(car?.images) && car.images.length ? car.images : ['']),
		[car?.images],
	)
	const visibleExtras = useMemo(
		() => extras.filter((e: any) => String(e?.name || '').trim().toLowerCase() !== 'gps'),
		[extras],
	)
	const hasManyImages = images.length > 1
	const currentImage = resolveImageSrc(images[Math.min(imageIndex, images.length - 1)] || '')
	const prevImage = () => setImageIndex(i => (i - 1 + images.length) % images.length)
	const nextImage = () => setImageIndex(i => (i + 1) % images.length)

	useEffect(() => {
		if (!showFullscreen) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setShowFullscreen(false)
			if (e.key === 'ArrowLeft' && hasManyImages) prevImage()
			if (e.key === 'ArrowRight' && hasManyImages) nextImage()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [showFullscreen, hasManyImages])

	if (!car) return <p>{t.loading}</p>
	const averageRating = Number(reviewsData?.averageRating || 0)
	const totalReviews = Number(reviewsData?.totalReviews || 0)
	const reviews = Array.isArray(reviewsData?.items) ? reviewsData.items : []
	const hasUserReviewed = !!user && reviews.some((r: any) => r.userId === user.id)
	const selectedRating = Number(watchReview('rating') || 5)
	const toggleSection = (key: 'vehicle' | 'reserve' | 'reviews') => {
		setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
	}

	return (
		<div className='space-y-4 relative'>
			<div className='space-y-3'>
				<div className='flex items-center'>
					<button
						type='button'
						onClick={() => navigate('/cars')}
						className='inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 min-h-[42px] text-sm md:text-base text-slate-700 hover:bg-slate-50'
					>
						<svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2'>
							<path d='M15 6l-6 6 6 6' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
						{t.backToCars}
					</button>
				</div>
				<div className='relative'>
					<img
						src={currentImage}
						className='w-full rounded cursor-zoom-in'
						onClick={() => setShowFullscreen(true)}
					/>
					{hasManyImages && (
						<>
							<button
								type='button'
								onClick={prevImage}
								className='no-lift absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white'
							>
								<svg viewBox='0 0 24 24' className='mx-auto h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2'>
									<path d='M15 6l-6 6 6 6' strokeLinecap='round' strokeLinejoin='round' />
								</svg>
							</button>
							<button
								type='button'
								onClick={nextImage}
								className='no-lift absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white'
							>
								<svg viewBox='0 0 24 24' className='mx-auto h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2'>
									<path d='M9 6l6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
								</svg>
							</button>
						</>
					)}
				</div>
				{hasManyImages && (
					<div className='flex gap-2 flex-wrap'>
						{images.map((src, i) => (
							<button
								type='button'
								key={i}
								onClick={() => setImageIndex(i)}
								className={`border rounded overflow-hidden ${i === imageIndex ? 'border-cyan-500' : 'border-slate-200'}`}
							>
								<img src={resolveImageSrc(src)} className='w-16 h-16 object-cover' />
							</button>
						))}
					</div>
				)}
				<h1 className='text-2xl'>
					{car.brand} {car.model}
				</h1>
				<p>{car.description}</p>

				<div className='bg-white p-3 rounded-xl border border-slate-200'>
					<h3 className='font-medium mb-2'>{t.unavailableRanges}</h3>
					{availability?.items?.length ? (
						<ul className='text-sm space-y-1'>
							{availability.items.map((x: any, i: number) => (
								<li key={i}>
									{x.startDate.slice(0, 10)} - {x.endDate.slice(0, 10)} ({x.status})
								</li>
							))}
						</ul>
					) : (
						<p className='text-sm text-slate-500'>{t.noActiveReservations}</p>
					)}
				</div>

				<div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
					<button
						type='button'
						onClick={() => toggleSection('vehicle')}
						className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors'
					>
						<h3 className='font-medium'>{t.vehicleInfo}</h3>
						<svg
							viewBox='0 0 24 24'
							className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${openSections.vehicle ? 'rotate-180' : ''}`}
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<path d='M6 9l6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					</button>
					<div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.vehicle ? 'max-h-[1100px] opacity-100' : 'max-h-0 opacity-0'}`}>
						<div className='px-3 pb-3'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
								<InfoItem
									label={t.brandModel}
									value={`${car.brand} ${car.model}`}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5M5 13h14v5H5v-5zm2 3h.01M17 16h.01' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.year}
									value={car.year}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2z' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.category}
									value={<span className='capitalize'>{car.category}</span>}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 3.5h7' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.transmission}
									value={<span className='capitalize'>{car.transmission}</span>}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M12 3v18M12 8h6M12 16h6M12 12h4M12 12H6m0 0v-3m0 3v3' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.fuel}
									value={<span className='capitalize'>{car.fuel}</span>}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M7 21h10V7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14zm0-10h10M7 8h10M17 3h2v4h-2z' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.seats}
									value={car.seats}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M5 13h14v4H5zM7 13V9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v4m0 0V9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v4' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.mileage}
									value={`${car.mileage} km`}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M4 13a8 8 0 1 1 16 0M12 13l3-3M4 13h16' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
								<InfoItem
									label={t.price}
									value={`$${car.dailyPrice}${t.perDay}`}
									icon={
										<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
											<path d='M12 1v22M17 5a4 4 0 0 0-4-2H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H9a4 4 0 0 1-4-2' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									}
								/>
							</div>
						</div>
					</div>
				</div>

				<form
					onSubmit={handleSubmit(v => {
						if (!user) {
							toast.error(t.loginRequired)
							return
						}
						m.mutate({
							...v,
							carId: id,
							extraIds: Object.entries(v)
								.filter(([k, val]) => k.startsWith('ex_') && val)
								.map(([k]) => k.replace('ex_', '')),
						})
					})}
					className='bg-white rounded-xl border border-slate-200 overflow-hidden'
				>
					<button
						type='button'
						onClick={() => toggleSection('reserve')}
						className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors'
					>
						<h2 className='font-semibold'>{t.reserve}</h2>
						<svg
							viewBox='0 0 24 24'
							className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${openSections.reserve ? 'rotate-180' : ''}`}
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<path d='M6 9l6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					</button>
					<div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.reserve ? 'max-h-[1100px] opacity-100' : 'max-h-0 opacity-0'}`}>
						<div className='space-y-2 px-3 pb-3'>
							<Input type='date' {...register('startDate')} />
							<Input type='date' {...register('endDate')} />
							<Input placeholder={t.pickupLocation} {...register('pickupLocation')} />
							<Input placeholder={t.dropoffLocation} {...register('dropoffLocation')} />
							<Input placeholder={t.notes} {...register('notes')} />
							{visibleExtras.map((e: any) => (
								<label key={e.id} className='block'>
									<input type='checkbox' {...register('ex_' + e.id)} /> {e.name} (+${e.pricePerDay}{t.perDay})
								</label>
							))}
							<div className='pt-2'>
								<Button className='w-full' disabled={m.isPending}>
									{m.isPending ? t.submitting : t.submit}
								</Button>
							</div>
						</div>
					</div>
				</form>

				<div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
					<button
						type='button'
						onClick={() => toggleSection('reviews')}
						className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors'
					>
						<h3 className='font-medium'>{t.reviewsTitle}</h3>
						<div className='ml-3 flex items-center gap-2'>
							<div className='text-xs sm:text-sm text-slate-600'>
								<span className='text-amber-500 mr-1'>{'\u2605'.repeat(Math.round(averageRating || 0))}</span>
								{averageRating.toFixed(1)} ({totalReviews} {t.totalReviews})
							</div>
							<svg
								viewBox='0 0 24 24'
								className={`h-5 w-5 flex-none text-slate-500 transition-transform duration-200 ${openSections.reviews ? 'rotate-180' : ''}`}
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path d='M6 9l6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
							</svg>
						</div>
					</button>

					<div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections.reviews ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0'}`}>
						<div className='space-y-3 px-3 pb-3'>
							{reviews.length === 0 ? (
								<p className='text-sm text-slate-500'>{t.noReviews}</p>
							) : (
								<div className='space-y-2'>
									{reviews.map((r: any) => (
										<div key={r.id} className='rounded-lg border border-slate-200 p-2.5'>
											<div className='flex items-center justify-between'>
												<p className='text-sm font-medium'>{r.username}</p>
												<p className='text-xs text-slate-500'>{String(r.createdAt || '').slice(0, 10)}</p>
											</div>
											<p className='text-amber-500 text-sm'>{'\u2605'.repeat(Number(r.rating || 0))}</p>
											{r.comment ? <p className='text-sm text-slate-700 mt-1'>{r.comment}</p> : null}
										</div>
									))}
								</div>
							)}

							{!user ? (
								<p className='text-sm text-slate-500'>{t.loginToReview}</p>
							) : hasUserReviewed ? (
								<p className='text-sm text-slate-500'>{t.alreadyReviewed}</p>
							) : (
								<form onSubmit={handleSubmitReview(v => reviewMutation.mutate({ ...v, rating: Number(v.rating) }))} className='space-y-2'>
									<p className='text-sm font-medium'>{t.leaveReview}</p>
									<div className='flex items-center gap-1'>
										{[1, 2, 3, 4, 5].map((n) => (
											<label key={n} className='cursor-pointer'>
												<input type='radio' value={n} {...registerReview('rating')} className='hidden' />
												<span className={`text-2xl ${selectedRating >= n ? 'text-amber-500' : 'text-slate-300'}`}>{'\u2605'}</span>
											</label>
										))}
									</div>
									<textarea
										{...registerReview('comment')}
										placeholder={t.reviewComment}
										className='w-full border rounded p-2 min-h-[90px]'
									/>
									<Button disabled={reviewMutation.isPending}>
										{reviewMutation.isPending ? t.reviewSubmitting : t.reviewSubmit}
									</Button>
								</form>
							)}
						</div>
					</div>
				</div>
			</div>

			{showFullscreen && (
				<div
					className='fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3'
					onClick={() => setShowFullscreen(false)}
				>
					<div className='relative max-w-6xl w-full flex items-center justify-center' onClick={e => e.stopPropagation()}>
						<img src={currentImage} className='max-h-[90vh] max-w-full object-contain rounded' />
						<button
							type='button'
							className='absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white text-xl'
							onClick={() => setShowFullscreen(false)}
						>
							x
						</button>
						{hasManyImages && (
							<>
								<button
									type='button'
									onClick={prevImage}
									className='no-lift absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 text-white text-2xl'
								>
									<svg viewBox='0 0 24 24' className='mx-auto h-6 w-6' fill='none' stroke='currentColor' strokeWidth='2'>
										<path d='M15 6l-6 6 6 6' strokeLinecap='round' strokeLinejoin='round' />
									</svg>
								</button>
								<button
									type='button'
									onClick={nextImage}
									className='no-lift absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 text-white text-2xl'
								>
									<svg viewBox='0 0 24 24' className='mx-auto h-6 w-6' fill='none' stroke='currentColor' strokeWidth='2'>
										<path d='M9 6l6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
									</svg>
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

