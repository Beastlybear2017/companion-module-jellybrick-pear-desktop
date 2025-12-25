import { ModuleInstance } from './main.js'

export const formatTime = (time: number | string): string => {
	const seconds = Number(time)
	if (!seconds || seconds == 0) return '0:00'

	const hrs = Math.floor(seconds / 3600)
	const mins = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)
	const hrsStr = hrs > 0 ? `${hrs}:` : ''
	const minsStr = hrs > 0 ? String(mins).padStart(2, '0') + ':' : `${mins}:`
	const secsStr = String(secs).padStart(2, '0')
	return `${hrsStr}${minsStr}${secsStr}`
}

export function apiVolumeToLinear(api: number): number {
	const maxApi = 100

	const clamped = Math.max(0, Math.min(api, maxApi))
	const normalized = clamped / maxApi

	const exponent = 0.48

	const linear = Math.pow(normalized, exponent) * 100

	return Math.round(linear)
}

const REPEAT_MODES: Record<string, number> = {
	NONE: 0,
	ALL: 1,
	ONE: 2,
}

const REPEAT_MODES_BY_INDEX: Array<string> = ['NONE', 'ALL', 'ONE']
const MODE_COUNT = REPEAT_MODES_BY_INDEX.length

export async function calculateRepeatIterations(self: ModuleInstance, targetMode: string): Promise<number> {
	if (targetMode === 'ITTERATE') return 1

	const res = await fetch(`http://${self.config.host}:${self.config.port}/api/v1/repeat-mode?token=${self.token}`)
	if (!res.ok) {
		throw new Error(`Failed to get repeat mode: ${res.status}`)
	}

	const data: any = await res.json()
	const currentIndex = REPEAT_MODES[data?.mode] // "NONE" | "ALL" | "ONE"

	const targetIndex = REPEAT_MODES[targetMode]

	if (currentIndex === undefined || targetIndex === undefined) {
		throw new Error('Invalid repeat mode')
	}

	return (targetIndex - currentIndex + MODE_COUNT) % MODE_COUNT
}
