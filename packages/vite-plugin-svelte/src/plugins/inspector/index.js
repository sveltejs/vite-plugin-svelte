/** @import { InspectorOptions } from '../../public.js' */
/** @import { PluginAPI } from '../../types/plugin-api.js' */
/** @import { Plugin } from 'vite' */

import { normalizePath } from 'vite';
import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultInspectorOptions, parseEnvironmentOptions } from './options.js';
import { log } from '../../utils/log.js';
import { INSPECTOR_ICON_SVG, INSPECTOR_SETTINGS_ICON_SVG } from './runtime/icon.js';
import { changedOptions, overridingEnvFiles, validateSettings, writeSettings } from './settings.js';
import { RESET_SETTINGS, SAVE_SETTINGS, SETTINGS_FILE } from './runtime/settings-constants.js';

/**
 * @param {string} url
 * @returns {string} url without query params or hash
 */
function cleanUrl(url) {
	return url.replace(/[?#].*$/s, '');
}

/** The Vite DevTools dock's action script, served at `/@id/__x00__virtual:svelte-inspector-dock` */
const DOCK_MODULE_ID = '\0virtual:svelte-inspector-dock';

/** The settings view's client script, served at `/@id/__x00__virtual:svelte-inspector-settings` */
const SETTINGS_MODULE_ID = '\0virtual:svelte-inspector-settings';

/** The Vite DevTools dock group Svelte tools share (registered here) */
const SVELTE_DOCK_GROUP = 'svelte';

function getInspectorPath() {
	const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)));
	return pluginPath.replace(
		/\/vite-plugin-svelte\/src\/plugins\/inspector$/,
		'/vite-plugin-svelte/src/plugins/inspector/runtime/'
	);
}

/**
 * @param {PluginAPI} api
 * @returns {Plugin & { devtools: { setup(ctx: any): void } }} `devtools` is the Vite DevTools hook
 */
export function svelteInspector(api) {
	const inspectorPath = getInspectorPath();
	log.debug(`svelte inspector path: ${inspectorPath}`, null, 'inspector');

	/** @type {InspectorOptions} */
	let inspectorOptions;
	let disabled = false;
	/**
	 * Vite DevTools is installed: the inspector is a toggle in its dock instead of injecting itself
	 * into the vite client, and opens files through the dock's own RPC.
	 */
	let dock = false;
	let root = process.cwd();
	/** where `.env.local` is read from (Vite's envDir), `false` when Vite loads no env files */
	/** @type {string | false} */
	let envDir = false;
	let mode = 'development';
	/** options before the environment overrides them: what the saved settings are compared to */
	/** @type {InspectorOptions} */
	let baseOptions = defaultInspectorOptions;

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

			// with Vite DevTools the inspector is available from its dock unless `inspector: false`
			dock =
				configFileOptions !== false &&
				config.plugins.some((p) => p.name?.startsWith('vite:devtools'));
			if (dock) {
				log.debug('Vite DevTools found, inspector added to its dock', null, 'inspector');
			}

			if (!configFileOptions && !environmentOptions && !dock) {
				log.debug('no inspector options found, inspector disabled', null, 'inspector');
				disabled = true;
				return;
			}

			if (environmentOptions === true) {
				// a copy: `__internal` is set on it below
				inspectorOptions = { ...defaultInspectorOptions };
			} else {
				inspectorOptions = {
					...defaultInspectorOptions,
					...(typeof configFileOptions === 'object' ? configFileOptions : {}),
					...(environmentOptions || {})
				};
			}

			root = config.root;
			envDir = config.envDir === false ? false : config.envDir || config.root;
			mode = config.mode;
			baseOptions = {
				...defaultInspectorOptions,
				...(typeof configFileOptions === 'object' ? configFileOptions : {})
			};

			inspectorOptions.__internal = {
				base: config.base?.replace(/\/$/, '') || '',
				root: config.root,
				// what "Reset to defaults" in the settings view returns to: the options without the
				// personal ones saved to .env.local
				defaults: /** @type {Omit<InspectorOptions, '__internal'>} */ (
					Object.fromEntries(Object.entries(baseOptions).filter(([key]) => key !== '__internal'))
				)
			};
		},
		// Vite DevTools integration, only called by `@vitejs/devtools`
		devtools: {
			/** @param {any} ctx */
			setup(ctx) {
				if (disabled || !dock) return;

				// The `svelte` dock group: one place for Svelte tools in the dock. vite-plugin-svelte
				// owns it (every Svelte app runs it); other Svelte tools join with `groupId: 'svelte'`.
				// Registering an existing id throws, so a group another plugin registered first is kept.
				try {
					ctx.docks.register({
						id: SVELTE_DOCK_GROUP,
						title: 'Svelte',
						icon: 'logos:svelte-icon',
						type: 'group',
						category: 'framework'
					});
				} catch (e) {
					log.debug('svelte dock group already registered', e, 'inspector');
				}

				// on the bar itself (not in the group) so the picker stays one click away
				ctx.docks.register({
					id: 'svelte:inspector',
					title: 'Svelte Inspector',
					description: 'Pick an element to open its source in your editor',
					icon: `data:image/svg+xml;base64,${Buffer.from(INSPECTOR_ICON_SVG).toString('base64')}`,
					type: 'action',
					toggle: true,
					action: {
						// eager: mounted once the dock is trusted, so the key combo works before the first click
						eager: true,
						// a url, not the bare id: `virtual:` reads as a url scheme, so the host would not resolve it
						importFrom: `${inspectorOptions.__internal?.base ?? ''}/@id/__x00__${DOCK_MODULE_ID.slice(1)}`
					}
				});

				// settings view: a hand-written view (runtime/SettingsView.svelte) mounted into the panel
				// the dock gives a custom-render entry; it edits the inspector's personal settings,
				// saved to `.env.local`
				ctx.docks.register({
					id: 'svelte:inspector-settings',
					title: 'Svelte Inspector settings',
					description: `Shortcut, keys and styles of the Svelte Inspector, saved to ${SETTINGS_FILE}`,
					icon: `data:image/svg+xml;base64,${Buffer.from(INSPECTOR_SETTINGS_ICON_SVG).toString('base64')}`,
					// in the Svelte group (and the command palette): used rarely, so off the bar itself
					groupId: SVELTE_DOCK_GROUP,
					category: 'inspector',
					type: 'custom-render',
					renderer: {
						importFrom: `${inspectorOptions.__internal?.base ?? ''}/@id/__x00__${SETTINGS_MODULE_ID.slice(1)}`
					}
				});
				/**
				 * Why settings saved to .env.local would not apply: a shell variable wins over env files
				 * (Vite's loadEnv), and so do the mode's own env files
				 * @param {string} dir
				 */
				const overridden = (dir) => {
					const sources = overridingEnvFiles(dir, mode);
					if (process.env.SVELTE_INSPECTOR_OPTIONS !== undefined) sources.unshift('the shell');
					return sources.length === 0
						? ''
						: ` SVELTE_INSPECTOR_OPTIONS is also set in ${sources.join(' and ')}, which takes precedence.`;
				};
				/**
				 * @param {string} name
				 * @param {(dir: string, params: any) => { ok: boolean; status: string }} handler
				 */
				const action = (name, handler) =>
					ctx.rpc.register({
						name,
						type: 'action',
						setup: () => ({
							handler: async (/** @type {any} */ params) => {
								if (envDir === false) {
									return {
										ok: false,
										status: `Vite loads no env files (envDir: false), so settings can't be saved to ${SETTINGS_FILE}. Set SVELTE_INSPECTOR_OPTIONS in the shell instead.`
									};
								}
								try {
									return handler(envDir, params ?? {});
								} catch (e) {
									return {
										ok: false,
										status: `Couldn't save: ${/** @type {Error} */ (e).message}`
									};
								}
							}
						})
					});
				action(SAVE_SETTINGS, (dir, params) => {
					const result = validateSettings(params);
					if ('error' in result) return { ok: false, status: result.error };
					const changed = changedOptions(result.options, baseOptions);
					const file = writeSettings(dir, changed);
					log.debug(`saved inspector settings to ${file}`, changed, 'inspector');
					const where = path.relative(root, file) || file;
					return {
						ok: true,
						status: `${Object.keys(changed).length === 0 ? 'Same as the defaults: removed from' : 'Saved to'} ${where}.${overridden(dir)} Restarting…`
					};
				});
				action(RESET_SETTINGS, (dir) => {
					const file = writeSettings(dir, null);
					const where = path.relative(root, file) || file;
					return {
						ok: true,
						status: `Reset: removed from ${where}.${overridden(dir)} Restarting…`
					};
				});
			}
		},
		resolveId: {
			filter: {
				id: /^\0?virtual:svelte-inspector-/
			},
			async handler(id) {
				if (disabled) {
					return;
				}
				if (id === DOCK_MODULE_ID || id === DOCK_MODULE_ID.slice(1)) {
					return DOCK_MODULE_ID;
				} else if (id === SETTINGS_MODULE_ID || id === SETTINGS_MODULE_ID.slice(1)) {
					return SETTINGS_MODULE_ID;
				} else if (id === 'virtual:svelte-inspector-options') {
					return id;
				} else if (id.startsWith('virtual:svelte-inspector-path:') && !id.includes('..')) {
					return id.replace('virtual:svelte-inspector-path:', inspectorPath);
				}
			}
		},
		load: {
			filter: {
				id: {
					include: [
						`${inspectorPath}/**`,
						/^virtual:svelte-inspector-options$/,
						/^\0virtual:svelte-inspector-dock$/,
						/^\0virtual:svelte-inspector-settings$/
					],
					exclude: [/style&lang\.css$/]
				}
			},
			async handler(id) {
				if (disabled) {
					return;
				}
				if (id === SETTINGS_MODULE_ID) {
					return 'export { default } from "virtual:svelte-inspector-path:settings-view.js";';
				} else if (id === DOCK_MODULE_ID) {
					return 'export { default } from "virtual:svelte-inspector-path:devtools-action.js";';
				} else if (id === 'virtual:svelte-inspector-options') {
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
				if (disabled || dock) {
					return;
				}
				return { code: `${code}\nimport('virtual:svelte-inspector-path:load-inspector.js')` };
			}
		}
	};
}
