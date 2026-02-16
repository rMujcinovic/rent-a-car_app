import { api } from '../api/client'

function backendOrigin(): string {
	const base = String(api.defaults.baseURL || '').trim()
	if (!base) return ''
	try {
		const u = new URL(base)
		return `${u.protocol}//${u.host}`
	} catch {
		return ''
	}
}

export function resolveImageSrc(src: string | null | undefined): string {
	const value = String(src || '').trim()
	if (!value) return ''
	if (value.startsWith('data:')) return value
	if (value.startsWith('http://') || value.startsWith('https://')) return value
	if (value.startsWith('database:')) {
		const normalized = value.replace(/^database:\/*/i, '/')
		const origin = backendOrigin()
		return origin ? `${origin}${normalized}` : normalized
	}
	if (value.startsWith('uploads/')) {
		const origin = backendOrigin()
		return origin ? `${origin}/${value}` : `/${value}`
	}
	if (value.startsWith('/')) {
		const origin = backendOrigin()
		return origin ? `${origin}${value}` : value
	}
	return value
}
