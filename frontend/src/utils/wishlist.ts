const keyForUser = (userId: string) => `wishlist:${userId}`

export function getWishlistIds(userId: string): string[] {
	if (!userId) return []
	try {
		const raw = localStorage.getItem(keyForUser(userId))
		if (!raw) return []
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return []
		return parsed.map(v => String(v)).filter(Boolean)
	} catch {
		return []
	}
}

export function setWishlistIds(userId: string, ids: string[]) {
	if (!userId) return
	localStorage.setItem(keyForUser(userId), JSON.stringify(ids))
}

export function toggleWishlistId(userId: string, carId: string): string[] {
	const current = getWishlistIds(userId)
	const exists = current.includes(carId)
	const next = exists ? current.filter(id => id !== carId) : [...current, carId]
	setWishlistIds(userId, next)
	return next
}
