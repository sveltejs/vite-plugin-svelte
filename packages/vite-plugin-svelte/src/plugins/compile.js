/** @import { CompileSvelte } from '../types/compile.js' */
/** @import { ResolvedOptions } from '../types/options.js' */
/** @import { PluginAPI } from '../types/plugin-api.js' */
/** @import { Plugin } from 'vite' */

import { toRollupError } from '../utils/error.js';
import { logCompilerWarnings } from '../utils/log.js';

/**
 * @param {PluginAPI} api
 * @returns {Plugin}
 */
export function compile(api) {
	/**
	 * @type {ResolvedOptions}
	 */
	let options;

	/**
	 * @type {CompileSvelte}
	 */
	let compileSvelte;
	/** @type {Plugin} */
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
						this.getCombinedSourcemap(),
						this.environment.name
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
