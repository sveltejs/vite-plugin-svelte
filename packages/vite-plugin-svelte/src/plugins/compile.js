import { toRollupError } from '../utils/error.js';
import { logCompilerWarnings } from '../utils/log.js';
import { ensureWatchedFile } from '../utils/watch.js';

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
			plugin.transform.filter = api.idFilter;
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
				const cache = api.getEnvironmentCache(this);
				let compileData;
				try {
					const svelteMeta = this.getModuleInfo(id)?.meta?.svelte;
					compileData = await compileSvelte(svelteRequest, code, options, svelteMeta?.preprocessed);
				} catch (e) {
					cache.setError(svelteRequest, e);
					throw toRollupError(e, options);
				}
				if (compileData.compiled?.warnings) {
					logCompilerWarnings(svelteRequest, compileData.compiled.warnings, options);
				}

				cache.update(compileData);
				if (compileData.dependencies?.length) {
					if (options.server) {
						for (const dep of compileData.dependencies) {
							ensureWatchedFile(options.server.watcher, dep, options.root);
						}
					} else if (options.isBuild && this.environment.config.build.watch) {
						for (const dep of compileData.dependencies) {
							this.addWatchFile(dep);
						}
					}
				}
				return {
					...compileData.compiled.js,
					moduleType: 'js',
					meta: {
						vite: {
							lang: compileData.lang
						}
					}
				};
			}
		}
	};
	return plugin;
}
