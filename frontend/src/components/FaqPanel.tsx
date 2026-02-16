import { forwardRef, useState } from 'react'

export type FaqItem = {
	question: string
	answer: string
}

type FaqPanelProps = {
	title: string
	items: FaqItem[]
}

const FaqPanel = forwardRef<HTMLDivElement, FaqPanelProps>(function FaqPanel(
	{ title, items },
	ref,
) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	return (
		<section ref={ref} className='py-10 md:py-12'>
			<div className='mx-auto w-full max-w-7xl px-4'>
				<div className='overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl shadow-blue-100/70'>
					<div className='border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4 md:px-8'>
						<h3 className='text-2xl font-bold text-blue-950'>{title}</h3>
					</div>

					<div className='space-y-3 p-4 md:p-6'>
						{items.map((item, index) => {
							const isOpen = activeIndex === index
							return (
								<div key={item.question} className='overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm'>
									<button
										type='button'
										onClick={() => setActiveIndex(isOpen ? null : index)}
										className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium text-slate-900 transition-colors hover:bg-slate-100/80'
									>
										<span className='pr-2'>{item.question}</span>
										<span className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-slate-300 text-lg leading-none transition-all ${isOpen ? 'rotate-45 bg-blue-50 text-blue-700' : 'bg-white'}`}>+</span>
									</button>
									<div
										className={`overflow-hidden px-4 transition-all duration-300 ease-in-out ${
											isOpen ? 'max-h-52 pb-4 opacity-100' : 'max-h-0 pb-0 opacity-0'
										}`}
									>
										<p className='text-sm leading-6 text-slate-700'>{item.answer}</p>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</section>
	)
})

export default FaqPanel
