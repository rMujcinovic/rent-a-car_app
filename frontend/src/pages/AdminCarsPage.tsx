import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { Input, Select, Table } from '../components/UI'
import { resolveImageSrc } from '../utils/image'
import { useLanguage } from '../hooks/useLanguage'

type CarForm = {
	brand: string
	model: string
	year: number | string
	category: string
	transmission: string
	fuel: string
	seats: number | string
	dailyPrice: number | string
	status: string
	mileage: number | string
	description: string
	images: string
}

const CAR_CATEGORIES = ['sedan', 'suv', 'hatchback', 'wagon', 'coupe', 'convertible', 'pickup', 'van']
const TRANSMISSIONS = ['manual', 'automatic']
const FUELS = ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg']
const CAR_STATUSES = ['available', 'rented', 'maintenance']
const copy: Record<'en' | 'bs', {
	title: string
	searchPlaceholder: string
	allStatus: string
	statusAvailable: string
	statusRented: string
	statusMaintenance: string
	closeForm: string
	addNewCar: string
	tableName: string
	tableYear: string
	tablePrice: string
	tableStatus: string
	tableActions: string
	edit: string
	delete: string
	brand: string
	model: string
	year: string
	category: string
	transmission: string
	fuel: string
	seats: string
	dailyPrice: string
	status: string
	mileage: string
	description: string
	images: string
	url: string
	upload: string
	pasteLinks: string
	uploadImages: string
	create: string
	creating: string
	saveChanges: string
	saving: string
	cancel: string
	carCreated: string
	carUpdated: string
	carDeleted: string
	createFailed: string
	updateFailed: string
	deleteFailed: string
	imageUploadFailed: string
	validationBrand: string
	validationModel: string
	validationCategory: string
	validationTransmission: string
	validationFuel: string
	validationStatus: string
	validationYear: string
	validationSeats: string
	validationDailyPrice: string
	validationMileage: string
}> = {
	en: {
		title: 'Admin Cars',
		searchPlaceholder: 'Search Car Name',
		allStatus: 'All Status',
		statusAvailable: 'Available',
		statusRented: 'Rented',
		statusMaintenance: 'Maintenance',
		closeForm: 'Close New Car Form',
		addNewCar: 'Add New Car',
		tableName: 'Name',
		tableYear: 'Year',
		tablePrice: 'Price',
		tableStatus: 'Status',
		tableActions: 'Actions',
		edit: 'Edit',
		delete: 'Delete',
		brand: 'Brand',
		model: 'Model',
		year: 'Year',
		category: 'Category',
		transmission: 'Transmission',
		fuel: 'Fuel',
		seats: 'Seats',
		dailyPrice: 'Daily Price',
		status: 'Status',
		mileage: 'Mileage',
		description: 'Description',
		images: 'Images',
		url: 'URL',
		upload: 'Upload',
		pasteLinks: 'Paste one image link per line',
		uploadImages: 'Upload images',
		create: 'Create',
		creating: 'Creating...',
		saveChanges: 'Save Changes',
		saving: 'Saving...',
		cancel: 'Cancel',
		carCreated: 'Car created',
		carUpdated: 'Car updated',
		carDeleted: 'Car deleted',
		createFailed: 'Failed to create car',
		updateFailed: 'Failed to update car',
		deleteFailed: 'Failed to delete car',
		imageUploadFailed: 'Image upload failed',
		validationBrand: 'Brand is required',
		validationModel: 'Model is required',
		validationCategory: 'Category is required',
		validationTransmission: 'Transmission is required',
		validationFuel: 'Fuel is required',
		validationStatus: 'Status is required',
		validationYear: 'Year must be a valid number',
		validationSeats: 'Seats must be at least 1',
		validationDailyPrice: 'Daily Price must be greater than 0',
		validationMileage: 'Mileage must be >= 0',
	},
	bs: {
		title: 'Admin Auta',
		searchPlaceholder: 'Pretraga Naziva Auta',
		allStatus: 'Svi Statusi',
		statusAvailable: 'Dostupno',
		statusRented: 'Iznajmljeno',
		statusMaintenance: 'Servis',
		closeForm: 'Zatvori Formu',
		addNewCar: 'Dodaj Novo Vozilo',
		tableName: 'Naziv',
		tableYear: 'Godina',
		tablePrice: 'Cijena',
		tableStatus: 'Status',
		tableActions: 'Akcije',
		edit: 'Uredi',
		delete: 'Obrisi',
		brand: 'Brend',
		model: 'Model',
		year: 'Godina',
		category: 'Kategorija',
		transmission: 'Transmisija',
		fuel: 'Gorivo',
		seats: 'Sjedista',
		dailyPrice: 'Dnevna Cijena',
		status: 'Status',
		mileage: 'Kilometraza',
		description: 'Opis',
		images: 'Slike',
		url: 'URL',
		upload: 'Upload',
		pasteLinks: 'Zalijepi jedan link slike po liniji',
		uploadImages: 'Upload slika',
		create: 'Kreiraj',
		creating: 'Kreiranje...',
		saveChanges: 'Sacuvaj Izmjene',
		saving: 'Cuvanje...',
		cancel: 'Otkazi',
		carCreated: 'Auto je kreirano',
		carUpdated: 'Auto je azurirano',
		carDeleted: 'Auto je obrisano',
		createFailed: 'Neuspjelo kreiranje auta',
		updateFailed: 'Neuspjelo azuriranje auta',
		deleteFailed: 'Neuspjelo brisanje auta',
		imageUploadFailed: 'Upload slike nije uspio',
		validationBrand: 'Brend je obavezan',
		validationModel: 'Model je obavezan',
		validationCategory: 'Kategorija je obavezna',
		validationTransmission: 'Transmisija je obavezna',
		validationFuel: 'Gorivo je obavezno',
		validationStatus: 'Status je obavezan',
		validationYear: 'Godina mora biti ispravan broj',
		validationSeats: 'Sjedista moraju biti najmanje 1',
		validationDailyPrice: 'Dnevna cijena mora biti veca od 0',
		validationMileage: 'Kilometraza mora biti >= 0',
	},
}

const splitImages = (raw: string): string[] => {
	if (!raw) return []
	const normalized = raw.replace(/\r/g, '').trim()
	if (!normalized) return []
	// Prefer newline-separated values because data URLs contain commas.
	if (normalized.includes('\n')) {
		return normalized
			.split('\n')
			.map(s => s.trim())
			.filter(Boolean)
	}
	// Single uploaded image (data URL) can contain commas; don't split it.
	if (normalized.startsWith('data:')) return [normalized]
	// Backward compatibility for older comma-separated URL input.
	return normalized
		.split(',')
		.map(s => s.trim())
		.filter(Boolean)
}

const normalizeEnum = (value: unknown): string => String(value || '').trim().toLowerCase()
const formatOptionLabel = (value: string, lang: 'en' | 'bs'): string => {
	if (value === 'suv') return 'SUV'
	if (value === 'lpg') return 'LPG'
	if (lang === 'bs') {
		if (value === 'manual') return 'Manuelni'
		if (value === 'automatic') return 'Automatski'
		if (value === 'gasoline') return 'Benzin'
		if (value === 'diesel') return 'Dizel'
		if (value === 'hybrid') return 'Hibrid'
		if (value === 'electric') return 'Elektricni'
		if (value === 'sedan') return 'Limuzina'
		if (value === 'wagon') return 'Karavan'
		if (value === 'coupe') return 'Kupe'
		if (value === 'convertible') return 'Kabriolet'
		if (value === 'pickup') return 'Pickup'
		if (value === 'van') return 'Kombi'
		if (value === 'available') return 'Dostupno'
		if (value === 'rented') return 'Iznajmljeno'
		if (value === 'maintenance') return 'Servis'
	}
	return value.charAt(0).toUpperCase() + value.slice(1)
}
const validateCarForm = (v: CarForm, t: (typeof copy)['en']): string | null => {
	if (!String(v.brand || '').trim()) return t.validationBrand
	if (!String(v.model || '').trim()) return t.validationModel
	if (!String(v.category || '').trim()) return t.validationCategory
	if (!String(v.transmission || '').trim()) return t.validationTransmission
	if (!String(v.fuel || '').trim()) return t.validationFuel
	if (!String(v.status || '').trim()) return t.validationStatus

	const year = Number(v.year)
	if (Number.isNaN(year) || year < 1900) return t.validationYear

	const seats = Number(v.seats)
	if (Number.isNaN(seats) || seats < 1) return t.validationSeats

	const dailyPrice = Number(v.dailyPrice)
	if (Number.isNaN(dailyPrice) || dailyPrice <= 0) return t.validationDailyPrice

	const mileage = Number(v.mileage)
	if (Number.isNaN(mileage) || mileage < 0) return t.validationMileage

	return null
}

const localizeStatus = (status: string, t: (typeof copy)['en']): string => {
	if (status === 'available') return t.statusAvailable
	if (status === 'rented') return t.statusRented
	if (status === 'maintenance') return t.statusMaintenance
	return status
}

const toPayload = (v: CarForm) => ({
	...v,
	year: +v.year,
	seats: +v.seats,
	mileage: +v.mileage,
	dailyPrice: +v.dailyPrice,
	category: normalizeEnum(v.category),
	transmission: normalizeEnum(v.transmission),
	fuel: normalizeEnum(v.fuel),
	status: normalizeEnum(v.status),
	images: splitImages(String(v.images || '')),
})

async function uploadFilesToServer(files: FileList | null): Promise<string[]> {
	if (!files || files.length === 0) return []
	const fd = new FormData()
	Array.from(files).forEach(file => fd.append('files', file))
	const { data } = await api.post('/admin/uploads', fd)
	return Array.isArray(data?.items) ? data.items : []
}

export default function AdminCarsPage() {
	const { lang } = useLanguage()
	const t = copy[lang]
	const qc = useQueryClient()
	const [editingCarId, setEditingCarId] = useState<string | null>(null)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [createImageMode, setCreateImageMode] = useState<'url' | 'upload'>('url')
	const [editImageMode, setEditImageMode] = useState<'url' | 'upload'>('url')
	const [dragCreateIndex, setDragCreateIndex] = useState<number | null>(null)
	const [dragEditIndex, setDragEditIndex] = useState<number | null>(null)
	const [query, setQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('')

	const { data } = useQuery({
		queryKey: ['cars-admin'],
		queryFn: async () => (await api.get('/cars', { params: { limit: 100 } })).data,
	})

	const {
		register: registerCreate,
		handleSubmit: handleCreateSubmit,
		reset: resetCreate,
		setValue: setCreateValue,
		watch: watchCreate,
	} = useForm<CarForm>()

	const {
		register: registerEdit,
		handleSubmit: handleEditSubmit,
		reset: resetEdit,
		setValue: setEditValue,
		watch: watchEdit,
	} = useForm<CarForm>()

	const create = useMutation({
		mutationFn: (v: CarForm) => api.post('/admin/cars', toPayload(v)),
		onSuccess: async () => {
			toast.success(t.carCreated)
			resetCreate()
			await qc.invalidateQueries({ queryKey: ['cars-admin'] })
		},
		onError: (err: any) => toast.error(err?.response?.data?.error || t.createFailed),
	})

	const update = useMutation({
		mutationFn: ({ id, values }: { id: string; values: CarForm }) =>
			api.put('/admin/cars/' + id, toPayload(values)),
		onSuccess: async () => {
			toast.success(t.carUpdated)
			setEditingCarId(null)
			resetEdit()
			await qc.invalidateQueries({ queryKey: ['cars-admin'] })
		},
		onError: (err: any) => toast.error(err?.response?.data?.error || t.updateFailed),
	})

	const del = useMutation({
		mutationFn: (id: string) => api.delete('/admin/cars/' + id),
		onSuccess: async () => {
			toast.success(t.carDeleted)
			await qc.invalidateQueries({ queryKey: ['cars-admin'] })
		},
		onError: (err: any) => toast.error(err?.response?.data?.error || t.deleteFailed),
	})

	const startEdit = (c: any) => {
		setEditingCarId(c.id)
		setEditImageMode('url')
		resetEdit({
			brand: c.brand || '',
			model: c.model || '',
			year: c.year || '',
			category: normalizeEnum(c.category),
			transmission: normalizeEnum(c.transmission),
			fuel: normalizeEnum(c.fuel),
			seats: c.seats || '',
			dailyPrice: c.dailyPrice || '',
			status: normalizeEnum(c.status),
			mileage: c.mileage || '',
			description: c.description || '',
			images: Array.isArray(c.images) ? c.images.join('\n') : '',
		})
	}

	const cancelEdit = () => {
		setEditingCarId(null)
		resetEdit()
	}

	const cars = useMemo(
		() =>
			(data?.items || []).filter((c: any) => {
				if (statusFilter && c.status !== statusFilter) return false
				if (!query.trim()) return true
				const q = query.toLowerCase()
				return (`${c.brand} ${c.model}`).toLowerCase().includes(q)
			}),
		[data?.items, query, statusFilter],
	)

	const createImagesPreview = String(watchCreate('images') || '')
	const createImages = splitImages(createImagesPreview)
	const editImagesPreview = String(watchEdit('images') || '')
	const editImages = splitImages(editImagesPreview)

	const removeCreateImage = (idx: number) => {
		const next = createImages.filter((_, i) => i !== idx)
		setCreateValue('images', next.join('\n'))
	}
	const removeEditImage = (idx: number) => {
		const next = editImages.filter((_, i) => i !== idx)
		setEditValue('images', next.join('\n'))
	}
	const reorderImages = (list: string[], from: number, to: number) => {
		if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
		const next = [...list]
		const [moved] = next.splice(from, 1)
		next.splice(to, 0, moved)
		return next
	}

	return (
		<div className='space-y-3'>
			<h1 className='text-xl'>{t.title}</h1>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
				<Input placeholder={t.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
				<Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
					<option value=''>{t.allStatus}</option>
					<option value='available'>{t.statusAvailable}</option>
					<option value='rented'>{t.statusRented}</option>
					<option value='maintenance'>{t.statusMaintenance}</option>
				</Select>
				<div className='flex items-center'>
					<button
						type='button'
						className='px-3 py-2 rounded border bg-white text-sm'
						onClick={() => setShowCreateForm(v => !v)}
					>
						{showCreateForm ? t.closeForm : t.addNewCar}
					</button>
				</div>
			</div>

			<Table
				head={[t.tableName, t.tableYear, t.tablePrice, t.tableStatus, t.tableActions]}
				rows={cars.map((c: any) => (
					<>
						<td className='p-2'>{c.brand} {c.model}</td>
						<td className='p-2'>{c.year}</td>
						<td className='p-2'>{c.dailyPrice}</td>
						<td className='p-2'>{localizeStatus(String(c.status || ''), t)}</td>
						<td className='p-2 space-x-2'>
							<button onClick={() => startEdit(c)} className='underline'>{t.edit}</button>
							<button onClick={() => del.mutate(c.id)} className='underline text-red-600'>{t.delete}</button>
						</td>
					</>
				))}
			/>

			{showCreateForm && (
				<form onSubmit={handleCreateSubmit(v => {
					const err = validateCarForm(v, t)
					if (err) {
						toast.error(err)
						return
					}
					create.mutate(v)
				})} className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-white p-3 rounded border border-slate-200'>
					<Input placeholder={t.brand} {...registerCreate('brand')} />
					<Input placeholder={t.model} {...registerCreate('model')} />
					<Input placeholder={t.year} {...registerCreate('year')} />
					<Select {...registerCreate('category')} defaultValue=''>
						<option value=''>{t.category}</option>
						{CAR_CATEGORIES.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Select {...registerCreate('transmission')} defaultValue=''>
						<option value=''>{t.transmission}</option>
						{TRANSMISSIONS.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Select {...registerCreate('fuel')} defaultValue=''>
						<option value=''>{t.fuel}</option>
						{FUELS.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Input placeholder={t.seats} {...registerCreate('seats')} />
					<Input placeholder={t.dailyPrice} {...registerCreate('dailyPrice')} />
					<Select {...registerCreate('status')} defaultValue='available'>
						{CAR_STATUSES.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Input placeholder={t.mileage} {...registerCreate('mileage')} />
					<Input placeholder={t.description} {...registerCreate('description')} />
					<input type='hidden' {...registerCreate('images')} />
					<div className='col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center'>
						<div className='flex gap-2 items-center'>
							<span className='text-sm text-slate-600'>{t.images}</span>
							<Select
								className='w-[130px]'
								value={createImageMode}
								onChange={e => setCreateImageMode(e.target.value as 'url' | 'upload')}
							>
								<option value='url'>{t.url}</option>
								<option value='upload'>{t.upload}</option>
							</Select>
						</div>
						{createImageMode === 'url' ? (
							<textarea
								rows={3}
								placeholder={t.pasteLinks}
								value={String(watchCreate('images') || '')}
								onChange={e => setCreateValue('images', e.target.value)}
								className='w-full border rounded p-2 text-sm'
							/>
						) : (
							<label className='inline-flex items-center justify-center px-3 py-2 rounded border bg-slate-50 text-sm cursor-pointer h-[42px] w-fit'>
								{t.uploadImages}
								<input
									type='file'
									accept='image/*'
									multiple
									className='hidden'
									onChange={async e => {
										const input = e.target as HTMLInputElement
										let urls: string[] = []
										try {
											urls = await uploadFilesToServer(input.files)
										} catch {
											toast.error(t.imageUploadFailed)
											return
										}
										if (!urls.length) return
										const current = splitImages(String(watchCreate('images') || ''))
										setCreateValue('images', [...current, ...urls].join('\n'))
										input.value = ''
									}}
								/>
							</label>
						)}
					</div>
					<div className='col-span-2 md:col-span-4 flex gap-2 flex-wrap'>
						{createImages.slice(0, 12).map((src, i) => (
							<div
								key={i}
								className='relative cursor-move'
								draggable
								onDragStart={() => setDragCreateIndex(i)}
								onDragOver={e => e.preventDefault()}
								onDrop={e => {
									e.preventDefault()
									if (dragCreateIndex === null) return
									const reordered = reorderImages(createImages, dragCreateIndex, i)
									setCreateValue('images', reordered.join('\n'))
									setDragCreateIndex(null)
								}}
								onDragEnd={() => setDragCreateIndex(null)}
							>
								<img src={resolveImageSrc(src)} className='w-16 h-16 rounded object-cover border' />
								<button
									type='button'
									onClick={() => removeCreateImage(i)}
									className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs'
								>
									x
								</button>
							</div>
						))}
					</div>
					<div className='col-span-2 md:col-span-4'>
						<button
							type='submit'
							disabled={create.isPending}
							className='h-[42px] px-3 py-2 rounded bg-cyan-600 text-white text-sm disabled:opacity-60'
						>
							{create.isPending ? t.creating : t.create}
						</button>
					</div>
				</form>
			)}

			{editingCarId && (
				<form onSubmit={handleEditSubmit(v => {
					const err = validateCarForm(v, t)
					if (err) {
						toast.error(err)
						return
					}
					update.mutate({ id: editingCarId, values: v })
				})} className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-amber-50 border border-amber-200 p-3 rounded'>
					<Input placeholder={t.brand} {...registerEdit('brand')} />
					<Input placeholder={t.model} {...registerEdit('model')} />
					<Input placeholder={t.year} {...registerEdit('year')} />
					<Select {...registerEdit('category')}>
						<option value=''>{t.category}</option>
						{CAR_CATEGORIES.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Select {...registerEdit('transmission')}>
						<option value=''>{t.transmission}</option>
						{TRANSMISSIONS.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Select {...registerEdit('fuel')}>
						<option value=''>{t.fuel}</option>
						{FUELS.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Input placeholder={t.seats} {...registerEdit('seats')} />
					<Input placeholder={t.dailyPrice} {...registerEdit('dailyPrice')} />
					<Select {...registerEdit('status')}>
						<option value=''>{t.status}</option>
						{CAR_STATUSES.map(x => <option key={x} value={x}>{formatOptionLabel(x, lang)}</option>)}
					</Select>
					<Input placeholder={t.mileage} {...registerEdit('mileage')} />
					<Input placeholder={t.description} {...registerEdit('description')} />
					<input type='hidden' {...registerEdit('images')} />
					<div className='col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center'>
						<div className='flex gap-2 items-center'>
							<span className='text-sm text-slate-600'>{t.images}</span>
							<Select
								className='w-[130px]'
								value={editImageMode}
								onChange={e => setEditImageMode(e.target.value as 'url' | 'upload')}
							>
								<option value='url'>{t.url}</option>
								<option value='upload'>{t.upload}</option>
							</Select>
						</div>
						{editImageMode === 'url' ? (
							<textarea
								rows={3}
								placeholder={t.pasteLinks}
								value={String(watchEdit('images') || '')}
								onChange={e => setEditValue('images', e.target.value)}
								className='w-full border rounded p-2 text-sm'
							/>
						) : (
							<label className='inline-flex items-center justify-center px-3 py-2 rounded border bg-white text-sm cursor-pointer h-[42px] w-fit'>
								{t.uploadImages}
								<input
									type='file'
									accept='image/*'
									multiple
									className='hidden'
									onChange={async e => {
										const input = e.target as HTMLInputElement
										let urls: string[] = []
										try {
											urls = await uploadFilesToServer(input.files)
										} catch {
											toast.error(t.imageUploadFailed)
											return
										}
										if (!urls.length) return
										const current = splitImages(String(watchEdit('images') || ''))
										setEditValue('images', [...current, ...urls].join('\n'))
										input.value = ''
									}}
								/>
							</label>
						)}
					</div>
					<div className='col-span-2 md:col-span-4 flex gap-2 flex-wrap'>
						{editImages.slice(0, 12).map((src, i) => (
							<div
								key={i}
								className='relative cursor-move'
								draggable
								onDragStart={() => setDragEditIndex(i)}
								onDragOver={e => e.preventDefault()}
								onDrop={e => {
									e.preventDefault()
									if (dragEditIndex === null) return
									const reordered = reorderImages(editImages, dragEditIndex, i)
									setEditValue('images', reordered.join('\n'))
									setDragEditIndex(null)
								}}
								onDragEnd={() => setDragEditIndex(null)}
							>
								<img src={resolveImageSrc(src)} className='w-16 h-16 rounded object-cover border' />
								<button
									type='button'
									onClick={() => removeEditImage(i)}
									className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs'
								>
									x
								</button>
							</div>
						))}
					</div>
					<div className='flex gap-2'>
						<button
							type='submit'
							disabled={update.isPending}
							className='h-[42px] px-3 py-2 rounded bg-cyan-600 text-white text-sm disabled:opacity-60'
						>
							{update.isPending ? t.saving : t.saveChanges}
						</button>
						<button type='button' className='px-3 py-2 rounded border' onClick={cancelEdit}>{t.cancel}</button>
					</div>
				</form>
			)}
		</div>
	)
}
