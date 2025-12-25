import {
	CompanionFeedbackAdvancedEvent,
	CompanionFeedbackDefinitions,
	CompanionFeedbackDefinition,
} from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { Jimp } from 'jimp'

export const feedbackDefinitions: Record<
	string,
	Omit<CompanionFeedbackDefinition, 'callback'> & {
		callback: (self: ModuleInstance, feedback: CompanionFeedbackAdvancedEvent) => Promise<any>
	}
> = {
	AlbumCover: {
		name: 'Album cover',
		type: 'advanced',
		options: [
			{
				type: 'number',
				id: 'opacity',
				label: 'Opacity',
				default: 1,
				min: 0,
				max: 1,
				range: true,
				step: 0.01,
			},
		],
		description: 'Sets the PNG to the album cover of the currently playing track',

		callback: async (self: ModuleInstance, feedback: CompanionFeedbackAdvancedEvent): Promise<any> => {
			const current = self?.data?.imageSrc

			if (!current) {
				return {
					png64: '',
				}
			}

			const img = (await Jimp.read(current))
				.scaleToFit({
					w: 400,
					h: 400,
				})
				.opacity(feedback.options.opacity === undefined ? 1 : Number(feedback.options.opacity))

			const png64 = await img.getBase64('image/png')

			return {
				png64,
			}
		},
	},
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const newFeedbacks: CompanionFeedbackDefinitions = {}
	for (const feedback of Object.keys(feedbackDefinitions)) {
		const def = feedbackDefinitions[feedback]
		newFeedbacks[feedback] = {
			...def,
			type: 'advanced',
			callback: async (feedbackEvent: CompanionFeedbackAdvancedEvent) => {
				return def.callback(self, feedbackEvent)
			},
		}
	}
	self.setFeedbackDefinitions(newFeedbacks)
}
