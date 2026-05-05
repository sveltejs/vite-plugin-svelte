/** @import { PluginAPI } from '../types/plugin-api.js' */
/** @import { Plugin } from 'vite' */

import { log } from '../utils/log.js';
import { SVELTE_VIRTUAL_STYLE_ID_REGEX } from '../utils/constants.js';

const filter = { id: SVELTE_VIRTUAL_STYLE_ID_REGEX };

/**
 * @param {PluginAPI} api
 * @returns {Plugin}
 */
export function loadCompiledCss(api) {
	let useLocalCache = false;

	/** @type{Map<string,any>} */
	const buildWatchCssCache = new Map();
	return {
		name: 'vite-plugin-svelte:load-compiled-css',

		configResolved(c) {
			const isDev = c.command === 'serve';
			const isBuildWatch = !!c.build?.watch;
			useLocalCache = isDev || isBuildWatch;
		},

		resolveId: {
			filter, // same filter in load to ensure minimal work
			handler(id) {
				log.debug(`resolveId resolved virtual css module ${id}`, undefined, 'resolve');
				return id;
			}
		},
		load: {
			filter,
			async handler(id) {
				const ssr = this.environment.config.consumer === 'server';
				const svelteRequest = api.idParser(id, ssr);
				if (!svelteRequest) {
					return;
				}
				// we need to re-resolve the ID in case the dep has been optimised by Vite
				// since it would now have a ?v=... query string suffix
				const resolvedId = await this.resolve(svelteRequest.filename);
				const moduleId = resolvedId?.id ?? svelteRequest.filename;
				let cachedCss = this.getModuleInfo(moduleId)?.meta.svelte?.css;
				// in `build --watch` or dev ssr reloads getModuleInfo only returns changed module data.
				// To ensure virtual css is loaded unchanged, we cache it here separately
				if (useLocalCache) {
					if (cachedCss) {
						buildWatchCssCache.set(moduleId, cachedCss);
					} else {
						cachedCss = buildWatchCssCache.get(moduleId);
					}
				}

				if (cachedCss) {
					const { hasGlobal, ...css } = cachedCss;
					if (hasGlobal === false) {
						// hasGlobal was added in svelte 5.26.0, so make sure it is boolean false
						css.meta ??= {};
						css.meta.vite ??= {};
						css.meta.vite.cssScopeTo = [svelteRequest.filename, 'default'];
					}
					css.moduleType = 'css';
					return css;
				} else {
					log.warn(`failed to load virtual css module ${id}`, undefined, 'load');
				}
			}
		}
	};
}
