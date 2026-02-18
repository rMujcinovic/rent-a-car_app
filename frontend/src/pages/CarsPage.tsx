import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { Car } from '../api/types'
import { Link, useSearchParams } from 'react-router-dom'
import { Input, Select } from '../components/UI'
import { resolveImageSrc } from '../utils/image'
import { useAuth } from '../auth/AuthContext'
import { getWishlistIds, toggleWishlistId } from '../utils/wishlist'
import { useLanguage } from '../hooks/useLanguage'

const copy: Record<'en' | 'bs', {
	brandName: string
	homeLabel: string
	carsLabel: string
	carsTitle: string
	searchPlaceholder: string
	filterBtn: string
	applyFilters: string
	noCars: string
	page: string
	added: string
	removed: string
	loginRequired: string
	allBrands: string
	modelPlaceholder: string
	maxMileagePlaceholder: string
	allTransmission: string
	minPricePlaceholder: string
	maxPricePlaceholder: string
	yearFrom: string
	yearTo: string
	allFuel: string
	allStatus: string
	statusAvailable: string
	statusRented: string
	statusMaintenance: string
	sortNewest: string
	sortPriceAsc: string
	sortPriceDesc: string
	sortYear: string
	reset: string
	prev: string
	next: string
	reserved: string
	perDay: string
	transmissionManual: string
	transmissionAutomatic: string
	fuelGasoline: string
	fuelDiesel: string
	fuelHybrid: string
	fuelElectric: string
}> = {
	en: {
		brandName: 'RentACar',
		homeLabel: 'Home',
		carsLabel: 'Cars',
		carsTitle: 'Cars',
		searchPlaceholder: 'Search Brand/Model',
		filterBtn: 'Filter',
		applyFilters: 'Apply Filters',
		noCars: 'No cars found.',
		page: 'Page',
		added: 'Added to wishlist',
		removed: 'Removed from wishlist',
		loginRequired: 'Please login to use wishlist',
		allBrands: 'All Brands',
		modelPlaceholder: 'Model (e.g. A4, X5)',
		maxMileagePlaceholder: 'Max Mileage (km)',
		allTransmission: 'All Transmission',
		minPricePlaceholder: 'Min Price/Day',
		maxPricePlaceholder: 'Max Price/Day',
		yearFrom: 'Year From',
		yearTo: 'Year To',
		allFuel: 'All Fuel',
		allStatus: 'All Status',
		statusAvailable: 'Available',
		statusRented: 'Rented',
		statusMaintenance: 'Maintenance',
		sortNewest: 'Newest',
		sortPriceAsc: 'Price Asc',
		sortPriceDesc: 'Price Desc',
		sortYear: 'Year',
		reset: 'Reset',
		prev: 'Prev',
		next: 'Next',
		reserved: 'Reserved',
		perDay: '/day',
		transmissionManual: 'Manual',
		transmissionAutomatic: 'Automatic',
		fuelGasoline: 'Gasoline',
		fuelDiesel: 'Diesel',
		fuelHybrid: 'Hybrid',
		fuelElectric: 'Electric',
	},
	bs: {
		brandName: 'RentACar',
		homeLabel: 'Pocetna',
		carsLabel: 'Auta',
		carsTitle: 'Auta',
		searchPlaceholder: 'Pretraga Brend/Model',
		filterBtn: 'Filter',
		applyFilters: 'Primijeni Filtere',
		noCars: 'Nema pronadjenih auta.',
		page: 'Stranica',
		added: 'Dodano na listu zelja',
		removed: 'Uklonjeno sa liste zelja',
		loginRequired: 'Prijavite se da koristite listu zelja',
		allBrands: 'Svi Brendovi',
		modelPlaceholder: 'Model (npr. A4, X5)',
		maxMileagePlaceholder: 'Maks Kilometraza (km)',
		allTransmission: 'Sve Transmisije',
		minPricePlaceholder: 'Min Cijena/Dan',
		maxPricePlaceholder: 'Maks Cijena/Dan',
		yearFrom: 'Godina Od',
		yearTo: 'Godina Do',
		allFuel: 'Sva Goriva',
		allStatus: 'Svi Statusi',
		statusAvailable: 'Dostupno',
		statusRented: 'Iznajmljeno',
		statusMaintenance: 'Servis',
		sortNewest: 'Najnovije',
		sortPriceAsc: 'Cijena Raste',
		sortPriceDesc: 'Cijena Opada',
		sortYear: 'Godina',
		reset: 'Resetuj',
		prev: 'Nazad',
		next: 'Dalje',
		reserved: 'Rezervisano',
		perDay: '/dan',
		transmissionManual: 'Manuelni',
		transmissionAutomatic: 'Automatski',
		fuelGasoline: 'Benzin',
		fuelDiesel: 'Dizel',
		fuelHybrid: 'Hibrid',
		fuelElectric: 'Elektricni',
	},
}

const BRANDS = [
	'Volkswagen',
	'Audi',
	'BMW',
	'Mercedes',
	'Toyota',
	'Alfa Romeo',
	'Dacia',
	'Skoda',
	'Fiat',
	'Opel',
	'Renault',
	'Peugeot',
	'Citroen',
	'Hyundai',
	'Kia',
	'Ford',
	'Nissan',
	'Honda',
	'Tesla',
]

const FUELS = [
	{ value: 'gasoline', label: 'Gasoline' },
	{ value: 'diesel', label: 'Diesel' },
	{ value: 'hybrid', label: 'Hybrid' },
	{ value: 'electric', label: 'Electric' },
	{ value: 'lpg', label: 'LPG' },
]
const TRANSMISSIONS = [
	{ value: 'manual', label: 'Manual' },
	{ value: 'automatic', label: 'Automatic' },
]

export default function CarsPage() {
	const { user } = useAuth()
	const { lang } = useLanguage()
	const [sp, setSp] = useSearchParams()
	const [showFilters, setShowFilters] = useState(false)
	const [q, setQ] = useState(sp.get('q') || '')
	const [debouncedQ, setDebouncedQ] = useState((sp.get('q') || '').trim())
	const [brand, setBrand] = useState(sp.get('brand') || '')
	const [model, setModel] = useState(sp.get('model') || '')
	const [minPrice, setMinPrice] = useState(sp.get('minPrice') || '')
	const [maxPrice, setMaxPrice] = useState(sp.get('maxPrice') || '')
	const [minYear, setMinYear] = useState(sp.get('minYear') || '')
	const [maxYear, setMaxYear] = useState(sp.get('maxYear') || '')
	const [maxMileage, setMaxMileage] = useState(sp.get('maxMileage') || '')
	const [fuel, setFuel] = useState(sp.get('fuel') || '')
	const [transmission, setTransmission] = useState(sp.get('transmission') || '')
	const [wishlistIds, setWishlistIds] = useState<string[]>([])
	const [bumpId, setBumpId] = useState<string | null>(null)
	const t = copy[lang]
	const page = Number(sp.get('page') || 1)
	const limit = 6
	const currentYear = new Date().getFullYear()
	const years = Array.from({ length: currentYear - 1989 }, (_, i) => String(currentYear - i))
	const activeFilterKeys = ['brand', 'model', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'maxMileage', 'fuel', 'transmission', 'status']
	const activeFiltersCount = activeFilterKeys.reduce((acc, key) => (sp.get(key) ? acc + 1 : acc), 0)

	useEffect(() => {
		setBrand(sp.get('brand') || '')
		setModel(sp.get('model') || '')
		setMinPrice(sp.get('minPrice') || '')
		setMaxPrice(sp.get('maxPrice') || '')
		setMinYear(sp.get('minYear') || '')
		setMaxYear(sp.get('maxYear') || '')
		setMaxMileage(sp.get('maxMileage') || '')
		setFuel(sp.get('fuel') || '')
		setTransmission(sp.get('transmission') || '')
	}, [sp])

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQ(q.trim())
		}, 250)

		return () => clearTimeout(timer)
	}, [q])

	useEffect(() => {
		if (!user?.id) {
			setWishlistIds([])
			return
		}
		setWishlistIds(getWishlistIds(user.id))
	}, [user?.id])

	const setParam = (key: string, value: string) => {
		const next = new URLSearchParams(sp)
		if (value.trim() === '') next.delete(key)
		else next.set(key, value)
		next.set('page', '1')
		setSp(next)
	}

	const { data, isLoading } = useQuery({
		queryKey: ['cars', sp.toString(), debouncedQ],
		queryFn: async () => {
			const params = Object.fromEntries(sp)
			params.limit = String(limit)
			if (debouncedQ === '') delete params.q
			else params.q = debouncedQ
			return (await api.get('/cars', { params })).data
		},
		placeholderData: previousData => previousData,
	})

	const validateFilters = () => {
		const minP = minPrice.trim() === '' ? null : Number(minPrice)
		const maxP = maxPrice.trim() === '' ? null : Number(maxPrice)
		const minY = minYear.trim() === '' ? null : Number(minYear)
		const maxY = maxYear.trim() === '' ? null : Number(maxYear)
		const maxM = maxMileage.trim() === '' ? null : Number(maxMileage)

		if (minP !== null && (Number.isNaN(minP) || minP < 0)) return 'Min price mora biti broj >= 0'
		if (maxP !== null && (Number.isNaN(maxP) || maxP < 0)) return 'Max price mora biti broj >= 0'
		if (minP !== null && maxP !== null && minP > maxP) return 'Min price ne moze biti veci od max price'

		if (minY !== null && Number.isNaN(minY)) return 'Year from nije ispravan'
		if (maxY !== null && Number.isNaN(maxY)) return 'Year to nije ispravan'
		if (minY !== null && maxY !== null && minY > maxY) return 'Year from ne moze biti veci od year to'

		if (maxM !== null && (Number.isNaN(maxM) || maxM < 0)) return 'Kilometraza mora biti broj >= 0'

		return null
	}

	if (!data && isLoading) return <p>Loading...</p>
	const cars: Car[] = data.items
	const totalPages = Math.max(1, Math.ceil((Number(data?.total) || 0) / limit))

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<Link to='/' className='inline-block text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 hover:text-blue-700'>
					{t.brandName}
				</Link>
				<div className='text-sm md:text-base text-slate-500'>
					<Link to='/' className='hover:text-slate-700'>{t.homeLabel}</Link>
					<span className='px-2 text-slate-400'>/</span>
					<span className='font-medium text-slate-700'>{t.carsLabel}</span>
				</div>
			</div>

			<form className='flex flex-col md:flex-row gap-2.5' onSubmit={e => e.preventDefault()}>
				<div className='relative flex-1'>
					<div className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-500'>
						<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
							<path d='M21 21l-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					</div>
					<Input className='pl-9' placeholder={t.searchPlaceholder} value={q} onChange={e => setQ(e.target.value)} />
				</div>
				<button
					type='button'
					className='px-4 py-2 rounded border bg-white inline-flex items-center gap-2 min-h-[44px] text-sm md:text-base'
					onClick={() => setShowFilters(v => !v)}
				>
					<svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M3 5h18M6 12h12M10 19h4' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
					{t.filterBtn}
					{activeFiltersCount > 0 && (
						<span className='ml-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs text-white'>
							{activeFiltersCount}
						</span>
					)}
				</button>
			</form>

			{showFilters && (
				<form
					className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5 bg-white p-3 md:p-4 rounded-xl border border-slate-200'
					onSubmit={e => {
						e.preventDefault()
						const validationError = validateFilters()
						if (validationError) {
							toast.error(validationError)
							return
						}
						const next = new URLSearchParams(sp)
						const setOrDelete = (k: string, v: string) => {
							if (v.trim() === '') next.delete(k)
							else next.set(k, v)
						}
						setOrDelete('q', q)
						setOrDelete('brand', brand)
						setOrDelete('model', model)
						setOrDelete('minPrice', minPrice)
						setOrDelete('maxPrice', maxPrice)
						setOrDelete('minYear', minYear)
						setOrDelete('maxYear', maxYear)
						setOrDelete('maxMileage', maxMileage)
						setOrDelete('fuel', fuel)
						setOrDelete('transmission', transmission)
						next.set('page', '1')
						setSp(next)
					}}
				>
					<Select value={brand} onChange={e => setBrand(e.target.value)}>
						<option value=''>{t.allBrands}</option>
						{BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
					</Select>
					<Input placeholder={t.modelPlaceholder} value={model} onChange={e => setModel(e.target.value)} />
					<Input placeholder={t.maxMileagePlaceholder} value={maxMileage} onChange={e => setMaxMileage(e.target.value)} />
					<Select value={transmission} onChange={e => setTransmission(e.target.value)}>
						<option value=''>{t.allTransmission}</option>
						{TRANSMISSIONS.map(x => <option key={x.value} value={x.value}>{x.value === 'manual' ? t.transmissionManual : t.transmissionAutomatic}</option>)}
					</Select>

					<Input placeholder={t.minPricePlaceholder} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
					<Input placeholder={t.maxPricePlaceholder} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
					<Select value={minYear} onChange={e => setMinYear(e.target.value)}>
						<option value=''>{t.yearFrom}</option>
						{years.map(y => <option key={y} value={y}>{y}</option>)}
					</Select>
					<Select value={maxYear} onChange={e => setMaxYear(e.target.value)}>
						<option value=''>{t.yearTo}</option>
						{years.map(y => <option key={y} value={y}>{y}</option>)}
					</Select>

					<Select value={fuel} onChange={e => setFuel(e.target.value)}>
						<option value=''>{t.allFuel}</option>
						{FUELS.map(f => (
							<option key={f.value} value={f.value}>
								{f.value === 'gasoline'
									? t.fuelGasoline
									: f.value === 'diesel'
										? t.fuelDiesel
										: f.value === 'hybrid'
											? t.fuelHybrid
											: f.value === 'electric'
												? t.fuelElectric
												: 'LPG'}
							</option>
						))}
					</Select>
					<Select value={sp.get('status') || ''} onChange={e => setParam('status', e.target.value)}>
						<option value=''>{t.allStatus}</option>
						<option value='available'>{t.statusAvailable}</option>
						<option value='rented'>{t.statusRented}</option>
						<option value='maintenance'>{t.statusMaintenance}</option>
					</Select>
					<Select value={sp.get('sort') || 'newest'} onChange={e => setParam('sort', e.target.value)}>
						<option value='newest'>{t.sortNewest}</option>
						<option value='price_asc'>{t.sortPriceAsc}</option>
						<option value='price_desc'>{t.sortPriceDesc}</option>
						<option value='year'>{t.sortYear}</option>
					</Select>

					<div className='md:col-span-2 xl:col-span-4 flex gap-2'>
						<button className='px-4 py-2 rounded bg-blue-600 text-white min-h-[44px] text-sm md:text-base'>{t.applyFilters}</button>
						<button
							type='button'
							className='px-4 py-2 rounded border min-h-[44px] text-sm md:text-base'
							onClick={() => {
								setQ('')
								setBrand('')
								setModel('')
								setMinPrice('')
								setMaxPrice('')
								setMinYear('')
								setMaxYear('')
								setMaxMileage('')
								setFuel('')
								setTransmission('')
								setSp(new URLSearchParams())
							}}
						>
							{t.reset}
						</button>
					</div>
				</form>
			)}

			<div className='flex min-h-0 md:min-h-[560px] flex-col'>
				<div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
					{cars.map(c => (
						<Link key={c.id} to={`/cars/${c.id}`} className='bg-white rounded-xl p-3 md:p-4 block border border-slate-200'>
							<div className='relative'>
								<img
									src={resolveImageSrc(c.images?.[0])}
									className={`h-40 md:h-44 w-full object-cover rounded-lg transition ${c.status === 'rented' ? 'grayscale opacity-60' : ''}`}
								/>
								{c.status === 'rented' && (
									<span className='absolute top-2 left-2 text-xs px-2 py-1 rounded bg-amber-500 text-white'>
										{t.reserved}
									</span>
								)}
								<button
									type='button'
									aria-label='Toggle wishlist'
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										if (!user?.id) {
											toast.error(t.loginRequired)
											return
										}
										setBumpId(c.id)
										setTimeout(() => setBumpId(prev => (prev === c.id ? null : prev)), 220)
										const wasInWishlist = wishlistIds.includes(c.id)
										const next = toggleWishlistId(user.id, c.id)
										setWishlistIds(next)
										toast.success(wasInWishlist ? t.removed : t.added, { duration: 1200 })
									}}
									className={`absolute top-2 right-2 grid place-items-center w-9 h-9 rounded-full bg-white/90 border border-slate-200 hover:bg-white transition-transform duration-200 active:scale-90 ${wishlistIds.includes(c.id) ? 'text-rose-500' : 'text-slate-600'} ${bumpId === c.id ? 'scale-125' : ''}`}
								>
									<svg viewBox='0 0 24 24' className='w-4 h-4' fill={wishlistIds.includes(c.id) ? 'currentColor' : 'none'} stroke='currentColor' strokeWidth='2'>
										<path d='M12 21s-6.7-4.35-9.33-7.23C.6 11.56.9 8.2 3.4 6.4a5.2 5.2 0 0 1 6.56.52L12 8.9l2.04-1.99a5.2 5.2 0 0 1 6.56-.52c2.5 1.8 2.8 5.16.73 7.37C18.7 16.65 12 21 12 21z' strokeLinecap='round' strokeLinejoin='round' />
									</svg>
								</button>
							</div>
							<h2 className='mt-2 text-base md:text-lg font-semibold'>{c.brand} {c.model}</h2>
							<p className='text-sm md:text-base'>${c.dailyPrice}{t.perDay}</p>
						</Link>
					))}
				</div>
				{cars.length === 0 && <p className='mt-2'>{t.noCars}</p>}

				<div className='mt-auto pt-4 flex items-center justify-center gap-2'>
					<button
						className='px-3 py-2 rounded border bg-white min-h-[40px] md:min-h-[44px] text-sm md:text-base disabled:opacity-60'
						disabled={page <= 1}
						onClick={() => {
							const next = new URLSearchParams(sp)
							next.set('page', String(page - 1))
							setSp(next)
						}}
					>
						{t.prev}
					</button>
					<span className='px-2 py-1 text-sm text-slate-600'>{t.page} {page} / {totalPages}</span>
					<button
						className='px-3 py-2 rounded border bg-white min-h-[40px] md:min-h-[44px] text-sm md:text-base disabled:opacity-60'
						disabled={page >= totalPages}
						onClick={() => {
							const next = new URLSearchParams(sp)
							next.set('page', String(page + 1))
							setSp(next)
						}}
					>
						{t.next}
					</button>
				</div>
			</div>
		</div>
	)
}
