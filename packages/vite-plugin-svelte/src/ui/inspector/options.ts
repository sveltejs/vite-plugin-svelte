import * as process from 'process';
import { log } from '../../utils/log';
import { loadEnv, ResolvedConfig } from 'vite';
export const defaultInspectorOptions: InspectorOptions = {
	toggleKeyCombo: process.platform === 'darwin' ? 'meta-shift' : 'control-shift',
	navKeys: { parent: 'ArrowUp', child: 'ArrowDown', next: 'ArrowRight', prev: 'ArrowLeft' },
	openKey: 'Enter',
	holdMode: true,
	showToggleButton: 'active',
	toggleButtonPos: 'top-right',
	customStyles: true
};

export function parseEnvironmentOptions(
	config: ResolvedConfig
): Partial<InspectorOptions> | boolean | void {
	const env = loadEnv(config.mode, config.envDir ?? process.cwd(), 'SVELTE_INSPECTOR');
	const options = env?.SVELTE_INSPECTOR_OPTIONS;
	const toggle = env?.SVELTE_INSPECTOR_TOGGLE;
	if (options) {
		try {
			const parsed = JSON.parse(options);
			const parsedType = typeof parsed;
			if (parsedType === 'boolean') {
				return parsed;
			} else if (parsedType === 'object') {
				if (Array.isArray(parsed)) {
					throw new Error('invalid type, expected object map but got array');
				}
				const parsedKeys = Object.keys(parsed);
				const defaultKeys = Object.keys(defaultInspectorOptions);
				const unknownKeys = parsedKeys.filter((k) => !defaultKeys.includes(k));
				if (unknownKeys.length) {
					log.warn(
						`ignoring unknown options in environment SVELTE_INSPECTOR_OPTIONS:  ${unknownKeys.join(
							', '
						)}.`,
						undefined,
						'inspector'
					);
					for (const key of unknownKeys) {
						delete parsed[key];
					}
				}
				log.debug('loaded environment config', parsed, 'inspector');
				return parsed;
			}
		} catch (e) {
			log.error(
				`failed to parse inspector options from environment SVELTE_INSPECTOR_OPTIONS="${options}"`,
				e,
				'inspector'
			);
		}
	} else if (toggle) {
		const keyConfig = {
			toggleKeyCombo: toggle
		};
		log.debug('loaded environment config', keyConfig, 'inspector');
		return keyConfig;
	}
}

export interface InspectorOptions {
	/**
	 * define a key combo to toggle inspector,
	 * @default 'meta-shift' on mac, 'control-shift' on other os
	 *
	 * any number of modifiers `control` `shift` `alt` `meta` followed by zero or one regular key, separated by -
	 * examples: control-shift, control-o, control-alt-s  meta-x control-meta
	 * Some keys have native behavior (e.g. alt-s opens history menu on firefox).
	 * To avoid conflicts or accidentally typing into inputs, modifier only combinations are recommended.
	 */
	toggleKeyCombo?: string;

	/**
	 * define keys to select elements with via keyboard
	 * @default {parent: 'ArrowUp', child: 'ArrowDown', next: 'ArrowRight', prev: 'ArrowLeft' }
	 *
	 * improves accessibility and also helps when you want to select elements that do not have a hoverable surface area
	 * due to tight wrapping
	 *
	 * A note for users of screen-readers:
	 * If you are using arrow keys to navigate the page itself, change the navKeys to avoid conflicts.
	 * e.g. navKeys: {parent: 'w', prev: 'a', child: 's', next: 'd'}
	 *
	 *
	 * parent: select closest parent
	 * child: select first child (or grandchild)
	 * next: next sibling (or parent if no next sibling exists)
	 * prev: previous sibling (or parent if no prev sibling exists)
	 */
	navKeys?: { parent: string; child: string; next: string; prev: string };

	/**
	 * define key to open the editor for the currently selected dom node
	 *
	 * @default 'Enter'
	 */
	openKey?: string;

	/**
	 * inspector is automatically disabled when releasing toggleKeyCombo after holding it for a longpress
	 * @default true
	 */
	holdMode?: boolean;
	/**
	 * when to show the toggle button
	 * @default 'active'
	 */
	showToggleButton?: 'always' | 'active' | 'never';

	/**
	 * where to display the toggle button
	 * @default top-right
	 */
	toggleButtonPos?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

	/**
	 * inject custom styles when inspector is active
	 */
	customStyles?: boolean;

	/**
	 * internal options that are automatically set, not to be set or used by users
	 */
	__internal?: {
		// vite base url
		base: string;
	};
}
