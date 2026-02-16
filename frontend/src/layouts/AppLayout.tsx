import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../hooks/useLanguage'

type NavItem = { to: string; label: string; icon: JSX.Element }
type NavItemKey = { to: string; key: string; icon: JSX.Element }

function icon(path: string) {
	return (
		<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='w-5 h-5'>
			<path d={path} strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	)
}

const userItems: NavItemKey[] = [
	{ to: '/', key: 'home', icon: icon('M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6') },
	{ to: '/cars', key: 'cars', icon: icon('M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5M5 13h14v5H5v-5zm2 3h.01M17 16h.01') },
	{ to: '/my-reservations', key: 'myReservations', icon: icon('M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2z') },
	{ to: '/wishlist', key: 'wishlist', icon: icon('M12 21s-6.7-4.35-9.33-7.23C.6 11.56.9 8.2 3.4 6.4a5.2 5.2 0 0 1 6.56.52L12 8.9l2.04-1.99a5.2 5.2 0 0 1 6.56-.52c2.5 1.8 2.8 5.16.73 7.37C18.7 16.65 12 21 12 21z') },
]

const adminItems: NavItemKey[] = [
	{ to: '/admin/dashboard', key: 'dashboard', icon: icon('M4 13h7V4H4v9zm9 7h7V4h-7v16zM4 20h7v-5H4v5z') },
	{ to: '/admin/cars', key: 'manageCars', icon: icon('M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5M5 13h14v5H5v-5zm2 3h.01M17 16h.01') },
	{ to: '/admin/reservations', key: 'reservations', icon: icon('M7 3h10M5 7h14M6 11h12M7 15h10M9 19h6') },
]

function SidebarLink({ to, label, icon: iconNode }: NavItem) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
					isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
				}`
			}
		>
			{iconNode}
			<span className='text-sm font-medium'>{label}</span>
		</NavLink>
	)
}

export default function AppLayout() {
	const { user, logout } = useAuth()
	const { lang, setLang } = useLanguage()
	const t = lang === 'bs'
		? {
			navigation: 'Navigacija',
			admin: 'Admin',
			language: 'Jezik',
			logout: 'Odjava',
			fallbackUser: 'Korisnik',
			roleUser: 'korisnik',
			home: 'Pocetna',
			cars: 'Auta',
			myReservations: 'Moje Rezervacije',
			wishlist: 'Lista Zelja',
			dashboard: 'Pregled',
			manageCars: 'Upravljanje Autima',
			reservations: 'Rezervacije',
		}
		: {
			navigation: 'Navigation',
			admin: 'Admin',
			language: 'Language',
			logout: 'Logout',
			fallbackUser: 'User',
			roleUser: 'user',
			home: 'Home',
			cars: 'Cars',
			myReservations: 'My Reservations',
			wishlist: 'Wishlist',
			dashboard: 'Dashboard',
			manageCars: 'Manage Cars',
			reservations: 'Reservations',
		}

	const localizedUserItems: NavItem[] = userItems.map(item => ({
		to: item.to,
		label: t[item.key as keyof typeof t] as string,
		icon: item.icon,
	}))
	const localizedAdminItems: NavItem[] = adminItems.map(item => ({
		to: item.to,
		label: t[item.key as keyof typeof t] as string,
		icon: item.icon,
	}))

	const FlagEN = (
		<svg viewBox='0 0 24 16' className='w-5 h-3.5 rounded-sm border border-slate-200 overflow-hidden'>
			<rect width='24' height='16' fill='#0A3D91' />
			<path d='M0 0l24 16M24 0L0 16' stroke='#fff' strokeWidth='3' />
			<path d='M0 0l24 16M24 0L0 16' stroke='#C8102E' strokeWidth='1.6' />
			<path d='M12 0v16M0 8h24' stroke='#fff' strokeWidth='5' />
			<path d='M12 0v16M0 8h24' stroke='#C8102E' strokeWidth='3' />
		</svg>
	)

	const FlagBS = (
		<img
			src='https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Flag_of_Bosnia_and_Herzegovina.svg/1280px-Flag_of_Bosnia_and_Herzegovina.svg.png?20130312195228'
			alt='Bosnia and Herzegovina flag'
			className='w-5 h-3.5 rounded-sm border border-slate-200 object-cover'
		/>
	)

	return (
		<div className='max-w-7xl mx-auto p-3 md:p-6'>
			<div className='grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-4 md:gap-6 min-h-[calc(100vh-3rem)]'>
				<main className='rounded-2xl bg-white/90 border border-slate-200 p-3 md:p-5 shadow-sm order-2 lg:order-1'>
					<Outlet />
				</main>

				<aside className='order-1 lg:order-2 rounded-2xl border border-slate-200 bg-white/95 shadow-sm p-4 flex flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] overflow-y-auto'>
					<div className='mb-4'>
						<p className='text-xs uppercase tracking-wide text-slate-400'>{t.navigation}</p>
						<div className='mt-2 space-y-1.5'>
							{localizedUserItems.map(item => <SidebarLink key={item.to} {...item} />)}
						</div>
					</div>

					{user?.role === 'admin' && (
						<div className='mb-4'>
							<p className='text-xs uppercase tracking-wide text-slate-400'>{t.admin}</p>
							<div className='mt-2 space-y-1.5'>
								{localizedAdminItems.map(item => <SidebarLink key={item.to} {...item} />)}
							</div>
						</div>
					)}

					<div className='mt-auto border-t border-slate-200 pt-4'>
						<div className='mb-4'>
							<p className='text-xs uppercase tracking-wide text-slate-400 mb-2'>{t.language}</p>
							<div className='grid grid-cols-2 gap-2'>
								<button
									type='button'
									onClick={() => setLang('en')}
									className={`h-9 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition duration-200 ${
										lang === 'en'
											? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
											: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
									}`}
								>
									{FlagEN}
									EN
								</button>
								<button
									type='button'
									onClick={() => setLang('bs')}
									className={`h-9 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition duration-200 ${
										lang === 'bs'
											? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
											: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
									}`}
								>
									{FlagBS}
									BS
								</button>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<div className='w-10 h-10 rounded-full bg-slate-800 text-white grid place-items-center'>
								<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='w-5 h-5'>
									<path d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0' strokeLinecap='round' strokeLinejoin='round' />
								</svg>
							</div>
							<div>
								<p className='text-sm font-semibold text-slate-900'>{user?.username || t.fallbackUser}</p>
								<p className='text-xs text-slate-500 capitalize'>{user?.role === 'admin' ? 'admin' : t.roleUser}</p>
							</div>
						</div>
						<button
							onClick={logout}
							className='mt-4 w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-700 transition'
						>
							{t.logout}
						</button>
					</div>
				</aside>
			</div>
		</div>
	)
}
