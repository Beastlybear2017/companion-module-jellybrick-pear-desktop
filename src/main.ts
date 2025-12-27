import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import WebSocket from 'ws'
import { formatTime } from './utils.js'

interface ModuleData {
	title: string
	artist: string
	imageSrc: string
	isPaused?: boolean | undefined
	duration: number
	duration_formatted: string
	elapsedSeconds: number
	elapsedSeconds_formatted: string
	videoId: string
	volume: number
	muted?: boolean | undefined
}

const defaultModuleData: ModuleData = {
	title: '',
	artist: '',
	imageSrc: '',
	isPaused: undefined,
	duration: 0,
	duration_formatted: formatTime(String(0)),
	elapsedSeconds: 0,
	elapsedSeconds_formatted: formatTime(String(0)),
	videoId: '',
	volume: 0,
	muted: undefined,
}

// function attemptParseJson(response: Response) {
// 	let data: unknown
// 	try {
// 		data = response.json()
// 	} catch {
// 		return null
// 	}
// 	return data
// }

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	token?: string
	socket: WebSocket | null = null

	data: ModuleData = { ...defaultModuleData }

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		//// Acquire and use token when available in future versions
		// if (!this.config.token || this.config.token === '') {
		// 	const token = await fetch(`http://${config.host}:${config.port}/auth/bitfocus-companion`, {
		// 		method: 'POST',
		// 	}).catch(() => null)

		// 	if (!token) {
		// 		this.updateStatus(InstanceStatus.ConnectionFailure, 'Failed to request token')
		// 		return
		// 	}

		// 	const tokenData = (await attemptParseJson(token)) as { accessToken?: string }
		// 	if (!tokenData?.accessToken) {
		// 		this.updateStatus(InstanceStatus.UnknownError, 'Invalid token response')
		// 		return
		// 	}

		// 	this.token = tokenData.accessToken
		// 	config.token = this.token
		// 	this.saveConfig(config)
		// } else {
		// 	this.updateStatus(InstanceStatus.Connecting, 'Using provided token')
		// 	this.token = config.token
		// }

		const url = `ws://${config.host}:${config.port}/api/v1/ws?token=${this.token}`
		this.log('debug', `Connecting to ${url}`)

		this.updateStatus(InstanceStatus.Connecting, 'Connecting to socket')

		this.socket = new WebSocket(url)

		this.socket.on('open', () => {
			this.log('info', 'Connected to socket')
			this.updateStatus(InstanceStatus.Ok)
		})

		this.socket.on('error', (err) => {
			void (async () => {
				this.log('error', `Socket error: ${err instanceof Error ? err.message : JSON.stringify(err)}`)
				if (String(err).includes('Authentication')) {
					this.log('error', 'Invalid token, requesting new token')
					config.token = ''
					setTimeout(() => void this.init(config), 5000)
				}
			})()
		})

		this.socket.on('message', (raw: object) => {
			void (async () => {
				try {
					const rawStr =
						typeof raw === 'string' ? raw : raw instanceof Buffer ? raw.toString('utf-8') : JSON.stringify(raw)

					const message = JSON.parse(rawStr) as {
						song?: {
							title?: string
							artist?: string
							imageSrc?: string
							songDuration?: number
							elapsedSeconds?: number
							videoId?: string
						}
						isPlaying?: boolean
						isPaused?: boolean
						volume?: number
						muted?: boolean
						position?: number
					}

					const prev: ModuleData = this.data ?? defaultModuleData
					const song = message.song ?? {}

					const imageSrc = song.imageSrc ?? prev.imageSrc ?? ''

					const pausedFromPlaying = typeof message.isPlaying === 'boolean' ? !message.isPlaying : undefined

					const volume = typeof message.volume === 'number' && message.volume >= 0 ? message.volume : prev.volume

					const duration = song.songDuration ?? prev.duration ?? 0
					const tempElapsedSeconds = song.elapsedSeconds ?? message.position ?? duration + 10
					const elapsedSeconds = tempElapsedSeconds <= duration ? tempElapsedSeconds : prev.elapsedSeconds

					this.data = {
						title: song.title ?? prev.title ?? '',
						artist: song.artist ?? prev.artist ?? '',
						imageSrc,
						isPaused: message.isPaused ?? pausedFromPlaying ?? prev.isPaused,
						duration,
						duration_formatted: formatTime(String(duration)) ?? '',
						elapsedSeconds,
						elapsedSeconds_formatted: formatTime(String(elapsedSeconds)) ?? '',
						videoId: song.videoId ?? prev.videoId ?? '',
						volume,
						muted: message.muted ?? prev.muted,
					}

					if (this.data.imageSrc !== prev.imageSrc) {
						void this.checkFeedbacks()
					}

					void UpdateVariables(this)
				} catch (e) {
					this.log('warn', `Failed to parse incoming message: ${e instanceof Error ? e.message : JSON.stringify(e)}`)
				}
			})()
		})

		this.socket.on('close', () => {
			void (async () => {
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Socket disconnected, attempting to reconnect')
				setTimeout(() => void this.init(this.config), 5000)
			})()
		})

		void this.updateActions()
		void this.updateFeedbacks()
		void this.updateVariableDefinitions()
	}

	//commented code is for future token implementation after API supports it
	async sendCommand(command: string, data?: number | Record<string, string | number | null>): Promise<void> {
		// if (!this.token) {
		// 	throw new Error('No token')
		// }
		const res = await fetch(`http://${this.config.host}:${this.config.port}/api/v1/${command}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// Authorization: this.token,
			},
			body: JSON.stringify(data),
		})

		if (!res.ok) {
			throw new Error(`Failed to send command: ${res.status} ${res.statusText}`)
		}
	}

	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		if (this.socket) {
			this.socket.close()
			this.socket = null
		}
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		await this.destroy()
		await this.init(config)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		void UpdateActions(this)
	}

	updateFeedbacks(): void {
		void UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		void UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
