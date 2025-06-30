import { buildModuleIdFilter, buildModuleIdParser } from '../utils/id.js';
import * as svelteCompiler from 'svelte/compiler';
import { logCompilerWarnings } from '../utils/log.js';
import { toRollupError } from '../utils/error.js';

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function compileModule(api) {
	/**
	 * @type {import("../types/options.js").ResolvedOptions}
	 */
	let options;
	/**
	 * @type {import("../types/id.js").ModuleIdParser}
	 */
	let idParser;
	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:compile-module',
		enforce: 'post',
		async configResolved() {
			options = api.options;
			//@ts-expect-error transform defined below but filter not in type
			plugin.transform.filter = buildModuleIdFilter(options);
			idParser = buildModuleIdParser(options);
		},
		transform: {
			async handler(code, id) {
				const ssr = this.environment.config.consumer === 'server';
				const moduleRequest = idParser(id, ssr);
				if (!moduleRequest) {
					return;
				}
				try {
					const compileResult = svelteCompiler.compileModule(code, {
						dev: !this.environment.config.isProduction,
						generate: ssr ? 'server' : 'client',
						filename: moduleRequest.filename
					});
					logCompilerWarnings(moduleRequest, compileResult.warnings, options);
					return compileResult.js;
				} catch (e) {
					throw toRollupError(e, options);
				}
			}
		}
	};
	return plugin;
}
