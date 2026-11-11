/** @import { PluginAPI } from '../types/plugin-api.js' */
/** @import { SvelteRequest } from '../types/id.js' */
/** @import { Plugin } from 'vite' */

import path from 'node:path';
import { normalizePath } from 'vite';
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

				const getCompiledCss = async () => {
					const css = this.getModuleInfo(svelteRequest.filename)?.meta.svelte?.css;
					if (css) {
						return css;
					}
					// some module IDs have a ?v=... query string suffix in addition to the
					// filename. We can retrieve this by running resolve again
					const resolvedId = await this.resolve(svelteRequest.filename);
					if (resolvedId?.id) {
						return this.getModuleInfo(resolvedId.id)?.meta.svelte?.css;
					}
				};

				let cachedCss = await getCompiledCss();

				// in `build --watch` or dev ssr reloads getModuleInfo only returns changed module data.
				// To ensure virtual css is loaded unchanged, we cache it here separately
				if (useLocalCache) {
					if (cachedCss) {
						buildWatchCssCache.set(svelteRequest.filename, cachedCss);
					} else {
						cachedCss = buildWatchCssCache.get(svelteRequest.filename);
					}
				}

				if (!cachedCss && this.environment.mode === 'dev') {
					// the css was requested before the svelte component was compiled, e.g. via a
					// `?direct` or `?inline` query. Transform the component first to compile its css.
					await this.environment.transformRequest(toDevServerUrl(svelteRequest));
					cachedCss = await getCompiledCss();
					if (cachedCss) {
						buildWatchCssCache.set(svelteRequest.filename, cachedCss);
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
 * Returns the url of the svelte component in the dev server module graph, using the same format as vite:
 * root relative for files inside the root and prefixed with `/@fs` for files outside of it.
 *
 * @param {SvelteRequest} svelteRequest
 * @returns {string}
 */
function toDevServerUrl({ filename, normalizedFilename }) {
	const normalizedPath = normalizePath(filename);
	return normalizedFilename !== normalizedPath
		? normalizedFilename
		: path.posix.join('/@fs/', normalizedPath);
}
