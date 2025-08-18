import { toRollupError } from '../utils/error.js';
import { logCompilerWarnings } from '../utils/log.js';

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function compile(api) {
	/**
	 * @type {import("../types/options.js").ResolvedOptions}
	 */
	let options;

	/**
	 * @type {import("../types/compile.d.ts").CompileSvelte}
	 */
	let compileSvelte;
	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:compile',
		configResolved() {
			//@ts-expect-error defined below but filter not in type
			plugin.transform.filter = api.filter;
			options = api.options;
			compileSvelte = api.compileSvelte;
		},
		transform: {
			async handler(code, id) {
				const ssr = this.environment.config.consumer === 'server';
				const svelteRequest = api.idParser(id, ssr);
				if (!svelteRequest || svelteRequest.raw) {
					return;
				}
				let compileData;
				try {
					compileData = await compileSvelte(
						svelteRequest,
						code,
						options,
						this.getCombinedSourcemap()
					);
				} catch (e) {
					throw toRollupError(e, options);
				}
				if (compileData.compiled?.warnings) {
					logCompilerWarnings(svelteRequest, compileData.compiled.warnings, options);
				}

				return {
					...compileData.compiled.js,
					moduleType: 'js',
					meta: {
						vite: {
							lang: compileData.lang
						},
						svelte: {
							css: compileData.compiled.css
						}
					}
				};
			}
		}
	};
	return plugin;
}
