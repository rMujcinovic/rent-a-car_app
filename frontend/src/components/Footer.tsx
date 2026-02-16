import { forwardRef } from 'react'

type FooterProps = {
	brand: string
	description: string
	quickLinksLabel: string
	faqLabel: string
	termsLabel: string
	privacyLabel: string
	followUsLabel: string
	contactLabel: string
	rightsLabel: string
	year: number
	onToggleFaq: () => void
}

const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
	{
		brand,
		description,
		quickLinksLabel,
		faqLabel,
		termsLabel,
		privacyLabel,
		followUsLabel,
		contactLabel,
		rightsLabel,
		year,
		onToggleFaq,
	},
	ref,
) {
	return (
		<footer ref={ref} id='contact' className='w-full bg-blue-900 text-blue-50'>
			<div className='mx-auto w-full max-w-7xl px-4 py-12'>
				<div className='grid grid-cols-1 gap-10 md:grid-cols-3'>
					<div className='flex flex-col items-center text-center'>
						<h3 className='text-2xl font-bold tracking-tight'>{brand}</h3>
						<p className='mt-4 max-w-sm text-sm leading-6 text-blue-100/90'>{description}</p>
					</div>

					<div className='flex flex-col items-center text-center'>
						<h4 className='text-base font-semibold'>{quickLinksLabel}</h4>
						<nav className='mt-4 flex flex-col items-center gap-3 text-sm'>
							<button
								type='button'
								onClick={onToggleFaq}
								className='w-fit text-blue-100/90 transition-colors hover:text-white'
							>
								{faqLabel}
							</button>
							<a href='#' className='w-fit text-blue-100/90 transition-colors hover:text-white'>
								{termsLabel}
							</a>
							<a href='#' className='w-fit text-blue-100/90 transition-colors hover:text-white'>
								{privacyLabel}
							</a>
						</nav>
					</div>

					<div className='flex flex-col items-center text-center'>
						<h4 className='text-base font-semibold'>{followUsLabel}</h4>
						<div className='mt-4 flex items-center gap-3'>
							<a
								href='https://facebook.com'
								target='_blank'
								rel='noreferrer'
								aria-label='Facebook'
								className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-800/60 text-blue-100 transition-all hover:bg-blue-700 hover:text-white'
							>
								<svg viewBox='0 0 24 24' className='h-5 w-5 fill-current' aria-hidden='true'>
									<path d='M13.5 9H16V6h-2.5C10.9 6 9 7.9 9 10.5V13H7v3h2v6h3v-6h2.4l.6-3H12v-2.5c0-.8.7-1.5 1.5-1.5z' />
								</svg>
							</a>
							<a
								href='https://instagram.com'
								target='_blank'
								rel='noreferrer'
								aria-label='Instagram'
								className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-800/60 text-blue-100 transition-all hover:bg-blue-700 hover:text-white'
							>
								<svg viewBox='0 0 24 24' className='h-5 w-5 fill-current' aria-hidden='true'>
									<path d='M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3.5A5.5 5.5 0 1112 18.5 5.5 5.5 0 0112 7.5zm0 2A3.5 3.5 0 1012 16.5 3.5 3.5 0 0012 9.5zM18 6.8a1.2 1.2 0 11-1.2 1.2A1.2 1.2 0 0118 6.8z' />
								</svg>
							</a>
							<a
								href='https://x.com'
								target='_blank'
								rel='noreferrer'
								aria-label='Twitter'
								className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-800/60 text-blue-100 transition-all hover:bg-blue-700 hover:text-white'
							>
								<svg viewBox='0 0 24 24' className='h-5 w-5 fill-current' aria-hidden='true'>
									<path d='M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6-5.3 6H3.6l7.3-8.3L1 2h6.3l4.4 5.6L18.9 2zm-1.1 18h1.7L6.4 4H4.6L17.8 20z' />
								</svg>
							</a>
						</div>
						<button
							type='button'
							onClick={() => {
								const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=refikmm24@gmail.com'
								const opened = window.open(gmailUrl, '_blank', 'noopener,noreferrer')
								if (!opened) window.location.href = 'mailto:refikmm24@gmail.com'
							}}
							className='mt-5 inline-flex w-fit rounded-lg border border-blue-300/60 bg-blue-800/60 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
						>
							{contactLabel}
						</button>
					</div>
				</div>

				<div className='mt-10 border-t border-blue-700/70 pt-5'>
					<p className='text-center text-sm text-blue-100/90 md:text-left'>
						&copy; {year} {brand}. {rightsLabel}
					</p>
				</div>
			</div>
		</footer>
	)
})

export default Footer
