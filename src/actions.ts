import { CompanionActionDefinition, CompanionActionDefinitions, CompanionActionEvent } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { calculateRepeatIterations } from './utils.js'

export const actionDefinitions: Record<
	string,
	Omit<CompanionActionDefinition, 'callback'> & {
		callback: (self: ModuleInstance, action: CompanionActionEvent) => Promise<any>
	}
> = {
	playPause: {
		name: 'Play/Pause',
		description: 'Toggle play/pause state of the player',
		options: [],
		callback: async (self) => {
			await self.sendCommand('toggle-play')
		},
	},
	play: {
		name: 'Play',
		options: [],
		callback: async (self) => {
			await self.sendCommand('play')
		},
	},
	pause: {
		name: 'Pause',
		options: [],
		callback: async (self) => {
			await self.sendCommand('pause')
		},
	},
	volumeUp: {
		name: 'Volume up',
		description: 'Increase the volume of the player',
		options: [],
		callback: async (self) => {
			const currentVolume = self?.data?.volume
			await self.sendCommand('volume', { volume: Math.min(100, Math.max(0, currentVolume + 10)) })
		},
	},
	volumeDown: {
		name: 'Volume down',
		description: 'Decrease the volume of the player',
		options: [],
		callback: async (self) => {
			const currentVolume = self?.data?.volume
			await self.sendCommand('volume', { volume: Math.min(100, Math.max(0, currentVolume - 10)) })
		},
	},
	setVolume: {
		name: 'Set volume',
		description: 'Set the volume of the player (0-100)',
		options: [
			{
				type: 'number',
				id: 'volume',
				label: 'Volume',
				default: 100,
				min: 0,
				max: 100,
				range: true,
				step: 1,
				required: true,
			},
		],
		callback: async (self, action) => {
			await self.sendCommand('volume', { volume: action.options.volume as number })
		},
	},
	toggleMute: {
		name: 'Toggle Mute',
		description: 'Mute/Unmute the player',
		options: [],
		callback: async (self) => {
			await self.sendCommand('toggle-mute')
		},
	},
	mute: {
		name: 'Mute',
		description: 'Mute the player',
		options: [],
		callback: async (self) => {
			if (!self?.data?.muted) await self.sendCommand('toggle-mute')
		},
	},
	unmute: {
		name: 'Unmute',
		description: 'Unmute the player',
		options: [],
		callback: async (self) => {
			if (self?.data?.muted) await self.sendCommand('toggle-mute')
		},
	},
	seekTo: {
		name: 'Seek to',
		description: 'Seek to a specific position in the currently playing track (seconds)',
		options: [
			{
				type: 'number',
				id: 'position',
				label: 'Position',
				default: 0,
				min: 0,
				max: 99999,
				required: true,
			},
		],
		callback: async (self, action) => {
			await self.sendCommand('seek-to', { seconds: action.options.position as number })
		},
	},
	next: {
		name: 'Next',
		description: 'Skip to the next track',
		options: [],
		callback: async (self) => {
			await self.sendCommand('next')
		},
	},
	previous: {
		name: 'Previous',
		description: 'Go back to the previous track',
		options: [],
		callback: async (self) => {
			await self.sendCommand('previous')
		},
	},
	repeatMode: {
		name: 'Set repeat mode',
		description: 'Set the repeat mode of the player',
		options: [
			{
				type: 'dropdown',
				id: 'mode',
				label: 'Mode',
				default: 'ITTERATE',
				choices: [
					{ id: 'NONE', label: 'None' },
					{ id: 'ALL', label: 'All' },
					{ id: 'ONE', label: 'One' },
					{ id: 'ITTERATE', label: 'Itterate through modes' },
				],
			},
		],
		callback: async (self, action) => {
			const switchCount = await calculateRepeatIterations(self, String(action.options.mode))
			await self.sendCommand('switch-repeat', {
				iteration: switchCount,
			})
		},
	},
	shuffle: {
		name: 'Shuffle',
		description: 'Enable/disable shuffle mode',
		options: [],
		callback: async (self) => {
			await self.sendCommand('shuffle')
		},
	},

	toggleLike: {
		name: 'Toggle like',
		description:
			'Toggle the like state of the currently playing track (note: this does not toggle like/dislike, it just toggles like/unlike)',
		options: [],
		callback: async (self) => {
			await self.sendCommand('like')
		},
	},
	toggleDislike: {
		name: 'Toggle dislike',
		description:
			'Toggle the dislike state of the currently playing track (note: this does not toggle like/dislike, it just toggles dislike/undislike)',
		options: [],
		callback: async (self) => {
			await self.sendCommand('dislike')
		},
	},
}

export function UpdateActions(self: ModuleInstance): void {
	const newActions: CompanionActionDefinitions = {}

	for (const action of Object.keys(actionDefinitions)) {
		const def = actionDefinitions[action]
		newActions[action] = {
			...def,
			callback: async (actionEvent: CompanionActionEvent) => {
				return def.callback(self, actionEvent)
			},
		}
	}

	self.setActionDefinitions(newActions)
}
