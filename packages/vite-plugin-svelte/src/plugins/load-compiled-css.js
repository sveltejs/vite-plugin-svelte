import { log } from '../utils/log.js';
import { SVELTE_VIRTUAL_STYLE_ID_REGEX } from '../utils/constants.js';

const filter = { id: SVELTE_VIRTUAL_STYLE_ID_REGEX };

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function loadCompiledCss(api) {
	return {
		name: 'vite-plugin-svelte:load-compiled-css',

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
				const cache = api.getEnvironmentCache(this);
				const cachedCss = cache.getCSS(svelteRequest);
				if (cachedCss) {
					const { hasGlobal, ...css } = cachedCss;
					if (hasGlobal === false) {
						// hasGlobal was added in svelte 5.26.0, so make sure it is boolean false
						css.meta ??= {};
						css.meta.vite ??= {};
						// TODO is that slice the best way to get the filename without parsing the id?
						css.meta.vite.cssScopeTo = [id.slice(0, id.lastIndexOf('?')), 'default'];
					}
					css.moduleType = 'css';
					return css;
				}
			}
		}
	};
}
