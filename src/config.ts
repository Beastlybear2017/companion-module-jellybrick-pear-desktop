import { Regex, type SomeCompanionConfigField } from '@companion-module/base'
export interface ModuleConfig {
	host: string
	port: number
	token: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'API server IP',
			width: 8,
			regex: Regex.IP,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'API server port',
			width: 4,
			min: 1,
			max: 65535,
			default: 26538,
		},
		{
			type: 'textinput',
			id: 'token',
			width: 12,
			label: 'Token',
			isVisible: () => false,
		},
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value:
				'Please enable the "API Server [Beta]" Plugin and  ensure that the Authorization Strategy is set to "No authorization".',
		},
	]
}
