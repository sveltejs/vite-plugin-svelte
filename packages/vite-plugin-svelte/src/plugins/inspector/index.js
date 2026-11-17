/** @import { InspectorOptions } from '../../public.js' */
/** @import { PluginAPI } from '../../types/plugin-api.js' */
/** @import { Plugin } from 'vite' */

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

/** The inspector plugin of `@sveltejs/vite-devtools-svelte`, which replaces this one and turns it off */
const DOCK_INSPECTOR_PLUGIN = 'vite-devtools-svelte-inspector';

function getInspectorPath() {
	const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)));
	return pluginPath.replace(
		/\/vite-plugin-svelte\/src\/plugins\/inspector$/,
		'/vite-plugin-svelte/src/plugins/inspector/runtime/'
	);
}

/**
 * @param {PluginAPI} api
 * @returns {Plugin}
 */
export function svelteInspector(api) {
	const inspectorPath = getInspectorPath();
	log.debug(`svelte inspector path: ${inspectorPath}`, null, 'inspector');

	/** @type {InspectorOptions} */
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
			// it turns this inspector off itself; returning early also skips the deprecation warning
			if (config.plugins.some((p) => p.name === DOCK_INSPECTOR_PLUGIN)) {
				log.debug(`${DOCK_INSPECTOR_PLUGIN} found, inspector disabled`, null, 'inspector');
				disabled = true;
				return;
			}
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

			log.warn.once(
				'The `inspector` option and SVELTE_INSPECTOR_OPTIONS are deprecated and will be removed in the next major version. Use `@sveltejs/vite-devtools-svelte` instead, which includes the Svelte Inspector along with the other Svelte devtools: https://www.npmjs.com/package/@sveltejs/vite-devtools-svelte',
				null,
				'inspector'
			);

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
			// Vite+ projects install vite@npm:@voidzero-dev/vite-plus-core@latest which
			// changes the path from `vite/dist/client/client.mjs` to `vite/dist/vite/client/client.mjs`
			// TODO: inject with transformIndexHtml when it works with SSR
			filter: {
				id: /(?:vite\/dist|vite\/dist\/vite|vite-plus-core\/dist\/vite)\/client\/client\.mjs(?:\?|$)/
			},
			handler(code) {
				if (disabled) {
					return;
				}
				return { code: `${code}\nimport('virtual:svelte-inspector-path:load-inspector.js')` };
			}
		}
	};
}
