import { toRollupError } from '../utils/error.js';
import { log, logCompilerWarnings } from '../utils/log.js';
import fs from 'node:fs';
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
				if (!svelteRequest) {
					return;
				}
				const cache = api.getEnvironmentCache(this);
				let compileData;
				try {
					/**
					 * @type {import("../types/options.js").ResolvedOptions}
					 */
					const finalOptions = svelteRequest.raw
						? {
								...options,
								// don't use dynamic vite-plugin-svelte defaults here to ensure stable result between ssr,dev and build
								compilerOptions: {
									dev: false,
									css: 'external',
									hmr: false,
									...svelteRequest.query.compilerOptions
								},
								emitCss: true
							}
						: options;
					const svelteMeta = this.getModuleInfo(id)?.meta?.svelte;
					compileData = await compileSvelte(
						svelteRequest,
						code,
						finalOptions,
						svelteMeta?.preprocessed
					);
				} catch (e) {
					cache.setError(svelteRequest, e);
					throw toRollupError(e, options);
				}
				if (compileData.compiled?.warnings) {
					logCompilerWarnings(svelteRequest, compileData.compiled.warnings, options);
				}
				if (svelteRequest.raw) {
					const query = svelteRequest.query;
					let result;
					if (query.type === 'style') {
						result = compileData.compiled.css ?? { code: '', map: null };
					} else if (query.type === 'script') {
						result = compileData.compiled.js;
					} else if (query.type === 'preprocessed') {
						result = compileData.preprocessed;
					} else if (query.type === 'all' && query.raw) {
						return allToRawExports(compileData, fs.readFileSync(compileData.filename, 'utf-8'));
					} else {
						throw new Error(
							`invalid "type=${query.type}" in ${id}. supported are script, style, preprocessed, all`
						);
					}
					if (query.direct) {
						const supportedDirectTypes = ['script', 'style'];
						if (!supportedDirectTypes.includes(query.type)) {
							throw new Error(
								`invalid "type=${
									query.type
								}" combined with direct in ${id}. supported are: ${supportedDirectTypes.join(', ')}`
							);
						}
						log.debug(`load returns direct result for ${id}`, undefined, 'load');
						let directOutput = result.code;
						// @ts-expect-error might not be SourceMap but toUrl check should suffice
						if (query.sourcemap && result.map?.toUrl) {
							// @ts-expect-error toUrl might not exist
							const map = `sourceMappingURL=${result.map.toUrl()}`;
							if (query.type === 'style') {
								directOutput += `\n\n/*# ${map} */\n`;
							} else if (query.type === 'script') {
								directOutput += `\n\n//# ${map}\n`;
							}
						}
						return directOutput;
					} else if (query.raw) {
						log.debug(`load returns raw result for ${id}`, undefined, 'load');
						return toRawExports(result);
					} else {
						throw new Error(`invalid raw mode in ${id}, supported are raw, direct`);
					}
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

/**
 * turn compileData and source into a flat list of raw exports
 *
 * @param {import('../types/compile.d.ts').CompileData} compileData
 * @param {string} source
 */
function allToRawExports(compileData, source) {
	// flatten CompileData
	/** @type {Partial<import('../types/compile.d.ts').CompileData & { source: string }>} */
	const exports = {
		...compileData,
		...compileData.compiled,
		source
	};
	delete exports.compiled;
	delete exports.filename; // absolute path, remove to avoid it in output
	return toRawExports(exports);
}

/**
 * turn object into raw exports.
 *
 * every prop is returned as a const export, and if prop 'code' exists it is additionally added as default export
 *
 * eg {'foo':'bar','code':'baz'} results in
 *
 *  ```js
 *  export const code='baz'
 *  export const foo='bar'
 *  export default code
 *  ```
 * @param {object} object
 * @returns {string}
 */
function toRawExports(object) {
	let exports =
		Object.entries(object)
			.filter(([_key, value]) => typeof value !== 'function') // preprocess output has a toString function that's enumerable
			.sort(([a], [b]) => (a < b ? -1 : a === b ? 0 : 1))
			.map(([key, value]) => `export const ${key}=${JSON.stringify(value)}`)
			.join('\n') + '\n';
	if (Object.prototype.hasOwnProperty.call(object, 'code')) {
		exports += 'export default code\n';
	}
	return exports;
}
