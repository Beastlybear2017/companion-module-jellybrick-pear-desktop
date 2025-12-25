import { CompanionVariableDefinition } from '@companion-module/base'
import { ModuleInstance } from './main.js'

export const variableDefinitions: CompanionVariableDefinition[] = [
	{ variableId: 'title', name: 'Title of the currently playing track' },
	{ variableId: 'artist', name: 'Artist of the currently playing track' },
	{ variableId: 'volumePercent', name: 'Volume of the player (1-100%)' },
	{ variableId: 'muted', name: 'State of mute (true, false))' },
	{ variableId: 'duration', name: 'Duration of the currently playing track (seconds)' },
	{ variableId: 'duration_formatted', name: 'Duration of the currently playing track' },
	{ variableId: 'trackProgress', name: 'Video progress of the player (seconds)' },
	{ variableId: 'trackProgress_formatted', name: 'Video progress of the player' },
	{ variableId: 'trackState', name: 'State of the player (unknown, paused, playing)' },
	{ variableId: 'videoId', name: 'Video ID of the currently playing track' },
	{ variableId: 'albumCover', name: `URL of the currently playing track's Album Cover` },
]
export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions(variableDefinitions)
}

export async function UpdateVariables(self: ModuleInstance): Promise<void> {
	const currentData = self.data

	const trackStateDict: Record<string, string> = {
		'-1': 'unknown',
		false: 'paused',
		true: 'playing',
	}

	self.setVariableValues({
		title: currentData?.title,
		artist: currentData?.artist,
		volumePercent: currentData?.volume,
		muted: currentData?.muted,
		duration: currentData?.duration,
		duration_formatted: currentData.duration_formatted,
		trackProgress: currentData?.elapsedSeconds,
		trackProgress_formatted: currentData?.elapsedSeconds_formatted,
		trackState:
			trackStateDict[currentData?.isPaused === true ? 'false' : currentData?.isPaused === false ? 'true' : '-1'] ||
			'unknown',
		videoId: currentData?.videoId,
		albumCover: currentData?.imageSrc,
	})
}
