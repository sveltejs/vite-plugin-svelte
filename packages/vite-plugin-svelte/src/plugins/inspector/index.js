import { normalizePath } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultInspectorOptions, parseEnvironmentOptions } from './options.js';
import { log } from '../../utils/log.js';

/**
 * @param {string} url
 * @returns {string} url without query params or hash
 */
function cleanUrl(url) {
	return url.replace(/[?#].*$/s, '');
}

function getInspectorPath() {
	const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)));
	return pluginPath.replace(
		/\/vite-plugin-svelte\/src\/plugins\/inspector$/,
		'/vite-plugin-svelte/src/plugins/inspector/runtime/'
	);
}

/**
 * @param {import('../../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function svelteInspector(api) {
	const inspectorPath = getInspectorPath();
	log.debug(`svelte inspector path: ${inspectorPath}`, null, 'inspector');

	/** @type {import('../../public.d.ts').InspectorOptions} */
	let inspectorOptions;
	let disabled = false;

	return {
		name: 'vite-plugin-svelte-inspector',
		apply: 'serve',
		enforce: 'pre',

		applyToEnvironment(env) {
			return !disabled && env.config.consumer === 'client';
		},

		configResolved(config) {
			const environmentOptions = parseEnvironmentOptions(config);
			if (environmentOptions === false) {
				log.debug('environment options set to false, inspector disabled', null, 'inspector');
				disabled = true;
				return;
			}
			const configFileOptions = api.options?.inspector;

			if (!configFileOptions && !environmentOptions) {
				log.debug('no inspector options found, inspector disabled', null, 'inspector');
				disabled = true;
				return;
			}

			if (environmentOptions === true) {
				inspectorOptions = defaultInspectorOptions;
			} else {
				inspectorOptions = {
					...defaultInspectorOptions,
					...(typeof configFileOptions === 'object' ? configFileOptions : {}),
					...(environmentOptions || {})
				};
			}

			inspectorOptions.__internal = {
				base: config.base?.replace(/\/$/, '') || ''
			};
		},
		resolveId: {
			filter: {
				id: /^virtual:svelte-inspector-/
			},
			async handler(id) {
				if (disabled) {
					return;
				}
				if (id === 'virtual:svelte-inspector-options') {
					return id;
				} else if (id.startsWith('virtual:svelte-inspector-path:') && !id.includes('..')) {
					return id.replace('virtual:svelte-inspector-path:', inspectorPath);
				}
			}
		},
		load: {
			filter: {
				id: {
					include: [`${inspectorPath}/**`, /^virtual:svelte-inspector-options$/],
					exclude: [/style&lang\.css$/]
				}
			},
			async handler(id) {
				if (disabled) {
					return;
				}
				if (id === 'virtual:svelte-inspector-options') {
					return `export default ${JSON.stringify(inspectorOptions ?? {})}`;
				} else if (id.startsWith(inspectorPath)) {
					// read file ourselves to avoid getting shut out by vites fs.allow check
					const file = cleanUrl(id);
					if (fs.existsSync(file)) {
						return await fs.promises.readFile(file, 'utf-8');
					} else {
						log.error(`failed to find svelte-inspector: ${id}`, null, 'inspector');
					}
				}
			}
		},
		transform: {
			filter: { id: /vite\/dist\/client\/client\.mjs(?:\?|$)/ },
			handler(code) {
				if (disabled) {
					return;
				}
				return { code: `${code}\nimport('virtual:svelte-inspector-path:load-inspector.js')` };
			}
		}
	};
}
