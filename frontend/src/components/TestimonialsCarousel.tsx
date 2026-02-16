import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

export type Testimonial = {
	name: string
	city: string
	rating: number
	message: string
	avatar: string
}

function stars(rating: number) {
	return '\u2605'.repeat(Math.max(0, Math.min(5, rating)))
}

export default function TestimonialsCarousel({
	title,
	items,
}: {
	title: string
	items: Testimonial[]
}) {
	const [index, setIndex] = useState(0)
	const [direction, setDirection] = useState<'next' | 'prev'>('next')
	const [emblaRef, emblaApi] = useEmblaCarousel({
		loop: true,
		dragFree: false,
		skipSnaps: true,
	})

	const prev = useCallback(() => {
		setDirection('prev')
		emblaApi?.scrollPrev()
	}, [emblaApi])

	const next = useCallback(() => {
		setDirection('next')
		emblaApi?.scrollNext()
	}, [emblaApi])

	useEffect(() => {
		if (!emblaApi || items.length === 0) return
		const onSelect = () => {
			const nextIdx = emblaApi.selectedScrollSnap()
			const len = items.length
			const forward = (nextIdx - index + len) % len
			const backward = (index - nextIdx + len) % len
			setDirection(forward <= backward ? 'next' : 'prev')
			setIndex(nextIdx)
		}
		onSelect()
		emblaApi.on('select', onSelect)
		emblaApi.on('settle', onSelect)
		return () => {
			emblaApi.off('select', onSelect)
			emblaApi.off('settle', onSelect)
		}
	}, [emblaApi, index, items.length])

	const rel = useCallback(
		(i: number) => {
			const len = items.length
			const direct = i - index
			const wrapped =
				Math.abs(direct) > len / 2
					? direct > 0
						? direct - len
						: direct + len
					: direct
			return wrapped
		},
		[index, items.length],
	)

	const ordered = useMemo(() => items, [items])

	if (!items.length) return null

	return (
		<section className='mx-auto w-full max-w-7xl px-4 py-16 md:py-20'>
			<h2 className='mb-10 text-center text-3xl font-bold sm:text-4xl'>{title}</h2>

			<div className='relative flex items-center justify-center'>
				<button
					type='button'
					aria-label='Previous testimonial'
					onClick={prev}
					className='absolute left-0 z-10 rounded-full border border-slate-300 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50'
				>
					<svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M15 6l-6 6 6 6' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</button>

				<div className='mx-12 w-full max-w-5xl overflow-hidden' ref={emblaRef}>
					<div
						className='flex touch-pan-y'
						onWheel={(e) => {
							if (!emblaApi) return
							if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return
							e.preventDefault()
							if (e.deltaY > 0 || e.deltaX > 0) next()
							else prev()
						}}
					>
						{ordered.map((item, i) => {
							const d = rel(i)
							const focused = d === 0
							const side = Math.abs(d) === 1
							return (
								<div key={item.name + i} className='min-w-0 flex-[0_0_100%] px-2 md:flex-[0_0_33.333%]'>
									<button
										type='button'
										onClick={() => emblaApi?.scrollTo(i)}
										className={`flex h-[250px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-500 ease-in-out md:h-[270px] ${
											focused
												? `shadow-lg md:opacity-100 will-change-transform ${
													direction === 'next'
														? 'animate-[testimonial-roulette-next_680ms_cubic-bezier(0.22,1,0.36,1)]'
														: 'animate-[testimonial-roulette-prev_680ms_cubic-bezier(0.22,1,0.36,1)]'
												}`
												: side
													? `shadow-md scale-95 opacity-60 blur-[1px] grayscale ${
														direction === 'next'
															? 'animate-[testimonial-side-next_460ms_cubic-bezier(0.22,1,0.36,1)]'
															: 'animate-[testimonial-side-prev_460ms_cubic-bezier(0.22,1,0.36,1)]'
													}`
													: 'hidden md:block opacity-0 scale-90 pointer-events-none'
										}`}
									>
										<div className='flex items-center gap-3'>
											<img src={item.avatar} alt={item.name} className='h-12 w-12 rounded-full object-cover' />
											<div>
												<p className='font-semibold'>{item.name}</p>
												<p className='text-sm text-slate-500'>{item.city}</p>
											</div>
										</div>
										<p className='mt-4 text-amber-500'>{stars(item.rating)}</p>
										<p
											className={`mt-2 overflow-hidden ${focused ? 'text-slate-700' : 'text-slate-600'}`}
											style={{
												display: '-webkit-box',
												WebkitLineClamp: 3,
												WebkitBoxOrient: 'vertical',
											}}
										>
											{item.message}
										</p>
									</button>
								</div>
							)
						})}
					</div>
				</div>

				<button
					type='button'
					aria-label='Next testimonial'
					onClick={next}
					className='absolute right-0 z-10 rounded-full border border-slate-300 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50'
				>
					<svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M9 6l6 6-6 6' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</button>
			</div>
		</section>
	)
}
