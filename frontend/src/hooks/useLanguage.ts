import { useEffect, useState } from 'react'

export type AppLang = 'en' | 'bs'
const LANG_KEY = 'lang'
const LANG_EVENT = 'app:lang-change'

function readLang(): AppLang {
	return localStorage.getItem(LANG_KEY) === 'bs' ? 'bs' : 'en'
}

export function useLanguage() {
	const [lang, setLangState] = useState<AppLang>(readLang)

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === LANG_KEY) setLangState(readLang())
		}
		const onCustom = () => setLangState(readLang())
		window.addEventListener('storage', onStorage)
		window.addEventListener(LANG_EVENT, onCustom as EventListener)
		return () => {
			window.removeEventListener('storage', onStorage)
			window.removeEventListener(LANG_EVENT, onCustom as EventListener)
		}
	}, [])

	const setLang = (next: AppLang) => {
		localStorage.setItem(LANG_KEY, next)
		setLangState(next)
		window.dispatchEvent(new Event(LANG_EVENT))
	}

	return { lang, setLang }
}
