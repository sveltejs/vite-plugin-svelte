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
		applyToEnvironment(env) {
			return env.config.consumer === 'client'; // ssr compile does not emit css
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
				const { cache } = api.getEnvironmentState(this);
				const cachedCss = cache.getCSS(id);
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
