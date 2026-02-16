import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { useLanguage } from '../hooks/useLanguage'
import TestimonialsCarousel, { type Testimonial } from '../components/TestimonialsCarousel'
import FaqPanel, { type FaqItem } from '../components/FaqPanel'
import Footer from '../components/Footer'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

type Lang = 'en' | 'bs'

const copy: Record<Lang, {
	brand: string
	register: string
	login: string
	contact: string
	rentNow: string
	heroTitle: string
	heroSubtitle: string
	mapTitle: string
	mapSubtitle: string
	testimonialsTitle: string
	footerContact: string
	footerQuickLinks: string
	footerFaqs: string
	footerTerms: string
	footerPrivacy: string
	footerFollowUs: string
	footerDescription: string
	faqTitle: string
	rights: string
}> = {
	en: {
		brand: 'RentACar',
		register: 'Register',
		login: 'Login',
		contact: 'Contact',
		rentNow: 'Rent now',
		heroTitle: 'Premium cars for every trip.',
		heroSubtitle: 'Fast booking, clear status updates, and a smooth rental flow from start to finish.',
		mapTitle: 'Find us in Sarajevo',
		mapSubtitle: 'Visit our office or pick up your vehicle at our main location.',
		testimonialsTitle: 'Customer reviews',
		footerContact: 'Contact us',
		footerQuickLinks: 'Quick Links',
		footerFaqs: 'FAQs',
		footerTerms: 'Terms',
		footerPrivacy: 'Privacy',
		footerFollowUs: 'Follow Us',
		footerDescription: 'Reliable car rentals across Bosnia and Europe. Fast, safe, affordable.',
		faqTitle: 'FAQs',
		rights: 'All rights reserved.',
	},
	bs: {
		brand: 'RentACar',
		register: 'Registracija',
		login: 'Prijava',
		contact: 'Kontakt',
		rentNow: 'Iznajmi sada',
		heroTitle: 'Premium auta za svako putovanje.',
		heroSubtitle: 'Brza rezervacija, jasan status i jednostavan tok najma od pocetka do kraja.',
		mapTitle: 'Pronadji nas u Sarajevu',
		mapSubtitle: 'Posjeti nas ured ili preuzmi vozilo na nasoj glavnoj lokaciji.',
		testimonialsTitle: 'Recenzije korisnika',
		footerContact: 'Kontaktiraj nas',
		footerQuickLinks: 'Brzi linkovi',
		footerFaqs: 'Cesta pitanja',
		footerTerms: 'Uslovi koristenja',
		footerPrivacy: 'Politika privatnosti',
		footerFollowUs: 'Prati nas',
		footerDescription: 'Pouzdan najam auta sirom Bosne i Evrope. Brzo, sigurno i pristupacno.',
		faqTitle: 'Cesta pitanja',
		rights: 'Sva prava zadrzana.',
	},
}

const faqs: Record<Lang, FaqItem[]> = {
	en: [
		{
			question: 'Do I need to pay a deposit?',
			answer: 'Yes, a refundable deposit is required. The amount depends on the vehicle category and is returned after inspection.',
		},
		{
			question: 'Is insurance included in the rental price?',
			answer: 'Basic insurance is included. You can add extra protection packages during reservation.',
		},
		{
			question: 'What is your cancellation policy?',
			answer: 'Free cancellation is available up to 24 hours before pickup. Late cancellations may include a fee.',
		},
		{
			question: 'Which documents are required at pickup?',
			answer: 'You need a valid driver license, ID/passport, and a payment card in the renter name.',
		},
		{
			question: 'Is there a minimum age to rent a car?',
			answer: 'Yes, the minimum age is usually 21. Some premium vehicles require drivers to be 25+.',
		},
		{
			question: 'Is mileage limited?',
			answer: 'Most rentals include daily mileage limits. Packages with higher or unlimited mileage are available.',
		},
		{
			question: 'Can I return the car at a different location?',
			answer: 'Yes, one-way return is possible for selected locations with an additional relocation fee.',
		},
	],
	bs: [
		{
			question: 'Da li je potreban depozit?',
			answer: 'Da, potreban je povratni depozit. Iznos zavisi od kategorije vozila i vraca se nakon pregleda auta.',
		},
		{
			question: 'Da li je osiguranje ukljuceno u cijenu?',
			answer: 'Osnovno osiguranje je ukljuceno. Dodatne pakete zastite mozes dodati tokom rezervacije.',
		},
		{
			question: 'Kakva je politika otkazivanja?',
			answer: 'Besplatno otkazivanje je moguce do 24 sata prije preuzimanja. Kasno otkazivanje moze imati naknadu.',
		},
		{
			question: 'Koji dokumenti su potrebni pri preuzimanju?',
			answer: 'Potrebni su vazeca vozacka dozvola, licna karta/pasos i platna kartica na ime korisnika.',
		},
		{
			question: 'Postoji li minimalna starosna dob?',
			answer: 'Da, minimalna starost je najcesce 21 godina. Za premium vozila cesto je potrebno 25+.',
		},
		{
			question: 'Da li je kilometraza ogranicena?',
			answer: 'Vecina najmova ima dnevno ogranicenje kilometraze. Dostupni su i paketi sa vecom ili neogranicenom kilometrazom.',
		},
		{
			question: 'Mogu li vratiti auto na drugoj lokaciji?',
			answer: 'Da, povrat na drugoj lokaciji je moguc za odabrane gradove uz dodatnu naknadu.',
		},
	],
}

function FlagEN() {
	return (
		<svg viewBox='0 0 24 16' className='h-3.5 w-5 rounded-sm border border-slate-200 overflow-hidden'>
			<rect width='24' height='16' fill='#0A3D91' />
			<path d='M0 0l24 16M24 0L0 16' stroke='#fff' strokeWidth='3' />
			<path d='M0 0l24 16M24 0L0 16' stroke='#C8102E' strokeWidth='1.6' />
			<path d='M12 0v16M0 8h24' stroke='#fff' strokeWidth='5' />
			<path d='M12 0v16M0 8h24' stroke='#C8102E' strokeWidth='3' />
		</svg>
	)
}

function FlagBS() {
	return (
		<img
			src='https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Flag_of_Bosnia_and_Herzegovina.svg/1280px-Flag_of_Bosnia_and_Herzegovina.svg.png?20130312195228'
			alt='Bosnia and Herzegovina flag'
			className='h-3.5 w-5 rounded-sm border border-slate-200 object-cover'
		/>
	)
}

function LanguageToggle({
	lang,
	setLang,
}: {
	lang: Lang
	setLang: (next: Lang) => void
}) {
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const onClickOutside = (e: MouseEvent) => {
			if (!menuRef.current) return
			if (!menuRef.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', onClickOutside)
		return () => document.removeEventListener('mousedown', onClickOutside)
	}, [])

	return (
		<div className='relative' ref={menuRef}>
			<button
				type='button'
				onClick={() => setOpen(v => !v)}
				className='inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50'
			>
				{lang === 'en' ? <FlagEN /> : <FlagBS />}
				<span>{lang.toUpperCase()}</span>
				<svg viewBox='0 0 24 24' className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' strokeWidth='2'>
					<path d='M6 9l6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
				</svg>
			</button>
			<div
				className={`absolute right-0 mt-2 w-36 origin-top-right rounded-lg border border-slate-200 bg-white shadow-lg transition-all ${
					open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
				}`}
			>
				<button
					type='button'
					onClick={() => {
						setLang('en')
						setOpen(false)
					}}
					className={`inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-t-lg ${lang === 'en' ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}
				>
					<FlagEN /> EN
				</button>
				<button
					type='button'
					onClick={() => {
						setLang('bs')
						setOpen(false)
					}}
					className={`inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-b-lg ${lang === 'bs' ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}
				>
					<FlagBS /> BS
				</button>
			</div>
		</div>
	)
}

const sarajevo: [number, number] = [43.8563, 18.4131]
const marker = L.icon({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
})

const testimonials: Testimonial[] = [
	{
		name: 'Amina K.',
		city: 'Sarajevo',
		rating: 5,
		message: 'Proces rezervacije je bio brz i jednostavan. Auto je bio cist i tacan kao na slikama.',
		avatar: 'https://i.pravatar.cc/120?img=32',
	},
	{
		name: 'Marko P.',
		city: 'Mostar',
		rating: 5,
		message: 'Odlicna usluga i fer cijene. Preuzimanje vozila je trajalo manje od 10 minuta.',
		avatar: 'https://i.pravatar.cc/120?img=12',
	},
	{
		name: 'Lejla H.',
		city: 'Tuzla',
		rating: 5,
		message: 'Komunikacija sa podrskom je bila odlicna. Definitivno cu opet koristiti aplikaciju.',
		avatar: 'https://i.pravatar.cc/120?img=47',
	},
	{
		name: 'Ivan S.',
		city: 'Banja Luka',
		rating: 4,
		message: 'Sve je proslo bez problema. Posebno mi se svidja pregled statusa rezervacije.',
		avatar: 'https://i.pravatar.cc/120?img=54',
	},
	{
		name: 'Nina R.',
		city: 'Zenica',
		rating: 5,
		message: 'Auta su uredna, a aplikacija pregledna. Preporuka za svakoga ko putuje.',
		avatar: 'https://i.pravatar.cc/120?img=5',
	},
	{
		name: 'Haris M.',
		city: 'Bihać',
		rating: 5,
		message: 'Sve je bilo tacno kako je dogovoreno. Odlican odnos cijene i kvaliteta.',
		avatar: 'https://i.pravatar.cc/120?img=68',
	},
]

export default function LandingPage() {
	const { lang, setLang } = useLanguage()
	const t = copy[lang]
	const navigate = useNavigate()
	const year = new Date().getFullYear()
	const contactRef = useRef<HTMLElement | null>(null)
	const faqRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const onHash = () => {
			if (window.location.hash === '#contact' && contactRef.current) {
				contactRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
			}
		}
		onHash()
		window.addEventListener('hashchange', onHash)
		return () => window.removeEventListener('hashchange', onHash)
	}, [])

	const scrollToFaq = () => {
		faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<div className='min-h-screen bg-slate-50 text-slate-900'>
			<header className='sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 backdrop-blur'>
				<div className='mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3'>
					<button
						type='button'
						onClick={() => navigate('/')}
						className='text-lg font-extrabold tracking-tight text-slate-900 hover:text-blue-700 transition-colors'
					>
						{t.brand}
					</button>
					<div className='flex flex-wrap items-center gap-2 sm:justify-end'>
						<LanguageToggle lang={lang} setLang={setLang} />
						<button
							type='button'
							onClick={() => navigate('/register')}
							className='rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
						>
							{t.register}
						</button>
						<button
							type='button'
							onClick={() => navigate('/login')}
							className='rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
						>
							{t.login}
						</button>
					</div>
				</div>
			</header>

			<main>
				<section className='relative isolate overflow-hidden'>
					<img
						src='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2200&auto=format&fit=crop'
						alt='Rent a car hero'
						className='absolute inset-0 h-full w-full object-cover'
					/>
					<div className='absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/45 to-slate-900/65' />
					<div className='relative mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-20'>
						<div className='max-w-3xl text-white'>
							<h1 className='text-4xl font-black leading-tight sm:text-5xl md:text-6xl'>{t.heroTitle}</h1>
							<p className='mt-5 text-base text-slate-100 sm:text-lg md:text-xl'>{t.heroSubtitle}</p>
							<button
								type='button'
								onClick={() => navigate('/cars')}
								className='mt-8 rounded-xl bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/35 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
							>
								{t.rentNow}
							</button>
						</div>
					</div>
				</section>

				<section className='mx-auto w-full max-w-7xl px-4 py-16 md:py-20'>
					<div className='mb-8 text-center'>
						<h2 className='text-3xl font-bold sm:text-4xl'>{t.mapTitle}</h2>
						<p className='mt-2 text-slate-600'>{t.mapSubtitle}</p>
					</div>

					<div className='relative z-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/25'>
						<MapContainer center={sarajevo} zoom={13} scrollWheelZoom className='h-[560px] w-full z-0'>
							<TileLayer
								attribution='&copy; OpenStreetMap contributors'
								url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
							/>
							<Marker position={sarajevo} icon={marker}>
								<Popup>{t.mapTitle}</Popup>
							</Marker>
						</MapContainer>
					</div>
				</section>

				<TestimonialsCarousel title={t.testimonialsTitle} items={testimonials} />
			</main>

			<FaqPanel ref={faqRef} title={t.faqTitle} items={faqs[lang]} />
			<Footer
				ref={contactRef}
				brand={t.brand}
				description={t.footerDescription}
				quickLinksLabel={t.footerQuickLinks}
				faqLabel={t.footerFaqs}
				termsLabel={t.footerTerms}
				privacyLabel={t.footerPrivacy}
				followUsLabel={t.footerFollowUs}
				contactLabel={t.footerContact}
				rightsLabel={t.rights}
				year={year}
				onToggleFaq={scrollToFaq}
			/>
		</div>
	)
}

