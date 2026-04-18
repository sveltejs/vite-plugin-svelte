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
				const versionedFilename = findVersionedSvelteModuleId(this, svelteRequest.filename);
				let cachedCss =
					(versionedFilename && this.getModuleInfo(versionedFilename)?.meta.svelte?.css) ??
					this.getModuleInfo(svelteRequest.filename)?.meta.svelte?.css;
				// in `build --watch` or dev ssr reloads getModuleInfo only returns changed module data.
				// To ensure virtual css is loaded unchanged, we cache it here separately
				if (useLocalCache) {
					if (cachedCss) {
						if (versionedFilename) {
							buildWatchCssCache.set(versionedFilename, cachedCss);
						}
						buildWatchCssCache.set(svelteRequest.filename, cachedCss);
					} else {
						cachedCss =
							(versionedFilename && buildWatchCssCache.get(versionedFilename)) ??
							buildWatchCssCache.get(svelteRequest.filename);
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

/**
 * @param {{ getModuleIds(): IterableIterator<string> }} ctx
 * @param {string} filename
 */
function findVersionedSvelteModuleId(ctx, filename) {
	for (const moduleId of ctx.getModuleIds()) {
		if (moduleId.startsWith(`${filename}?v=`)) {
			return moduleId;
		}
	}
}
