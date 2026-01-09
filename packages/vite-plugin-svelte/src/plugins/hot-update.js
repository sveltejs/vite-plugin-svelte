import { log } from '../utils/log.js';
import { setupWatchers } from '../utils/watch.js';
import { SVELTE_VIRTUAL_STYLE_ID_REGEX } from '../utils/constants.js';

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function hotUpdate(api) {
	/**
	 * @type {import("../types/options.js").ResolvedOptions}
	 */
	let options;
	/**
	 * @type {import('../types/id.d.ts').IdParser}
	 */
	let idParser;

	/**
	 *
	 * @type {Map<string|null,string>}
	 */
	const transformResultCache = new Map();

	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:hot-update',
		enforce: 'post',
		configResolved() {
			options = api.options;
			idParser = api.idParser;

			// @ts-expect-error
			plugin.transform.filter = {
				id: {
					// reinclude virtual styles to get their output
					include: [...api.filter.id.include, SVELTE_VIRTUAL_STYLE_ID_REGEX],
					exclude: [
						// ignore files in node_modules, we don't hot update them
						/\/node_modules\//,
						// remove style exclusion
						...api.filter.id.exclude.filter((filter) => filter !== SVELTE_VIRTUAL_STYLE_ID_REGEX)
					]
				}
			};
		},

		applyToEnvironment(env) {
			// we only handle updates for client components
			// ssr frameworks have to handle updating/reloading themselves as v-p-s can't know what they prefer
			const hmrEnabled = options.compilerOptions.hmr && options.emitCss;
			return hmrEnabled && env.config.consumer === 'client';
		},

		configureServer(server) {
			const clientEnvironment = Object.values(server.environments).find(
				(e) => e.config.consumer === 'client'
			);
			if (clientEnvironment) {
				setupWatchers(options);
			} else {
				log.warn(
					'No client environment found, not adding watchers for svelte config and preprocessor dependencies'
				);
			}
		},

		buildStart() {
			transformResultCache.clear();
		},

		transform: {
			order: 'post',
			handler(code, id) {
				transformResultCache.set(id, code);
			}
		},
		hotUpdate: {
			order: 'post',
			async handler(ctx) {
				const svelteRequest = idParser(ctx.file, false, ctx.timestamp);
				if (svelteRequest) {
					const { modules } = ctx;
					const svelteModules = [];
					const nonSvelteModules = [];
					for (const mod of modules) {
						if (transformResultCache.has(mod.id)) {
							svelteModules.push(mod);
						} else {
							nonSvelteModules.push(mod);
						}
					}

					if (svelteModules.length === 0) {
						return; // nothing to do for us
					}
					const affectedModules = [];
					const prevResults = svelteModules.map((m) => transformResultCache.get(m.id));
					for (let i = 0; i < svelteModules.length; i++) {
						const mod = svelteModules[i];
						const prev = prevResults[i];
						await this.environment.transformRequest(mod.url);
						const next = transformResultCache.get(mod.id);
						if (hasCodeChanged(prev, next, mod.id)) {
							affectedModules.push(mod);
						} else {
							log.debug(
								`skipping hot update for ${mod.id} because result is unchanged`,
								undefined,
								'hmr'
							);
						}
					}
					log.debug(
						`hotUpdate for ${svelteRequest.id} result: [${affectedModules.map((m) => m.id).join(', ')}]`,
						undefined,
						'hmr'
					);
					return [...affectedModules, ...nonSvelteModules];
				}
			}
		}
	};

	return plugin;
}

/**
 * @param {string | undefined | null} prev
 * @param {string | undefined | null} next
 * @param {string | null} id
 * @returns {boolean}
 */
function hasCodeChanged(prev, next, id) {
	const isStrictEqual = nullSafeEqual(prev, next);
	if (isStrictEqual) {
		return false;
	}
	const isLooseEqual = nullSafeEqual(normalize(prev), normalize(next));
	if (!isStrictEqual && isLooseEqual) {
		log.debug(
			`ignoring compiler output change for ${id} as it is equal to previous output after normalization`,
			undefined,
			'hmr'
		);
	}
	return !isLooseEqual;
}

/**
 * @param {string | null | undefined} prev
 * @param {string | null | undefined} next
 * @returns {boolean}
 */
function nullSafeEqual(prev, next) {
	return (prev == null && next == null) || (prev != null && next != null && prev === next);
}

/**
 * remove code that only changes metadata and does not require a js update for the component to keep working
 *
 * 1) location numbers argument from $.add_locations calls in svelte output eg [[1,2],[3,4]]
 * 2) timestamp queries added to imports by vite eg ?t=0123456789123
 *
 * @param {string | null | undefined } code
 * @returns {string | null | undefined}
 */
function normalize(code) {
	if (code == null) {
		return code;
	}

	return (
		code
			// svelte5 $.add_locations line numbers argument  [[1,2],[3,4]]
			// uses matching group replace to keep the template argument intact
			.replace(/(\$\.add_locations\(.*), (\[\[[\d, [\]]+]])\)/g, '$1, []')
			// vite import analysis timestamp queries, ?t=0123456789123&
			.replace(/[?&]t=\d{13}\b/g, '')
	);
}
