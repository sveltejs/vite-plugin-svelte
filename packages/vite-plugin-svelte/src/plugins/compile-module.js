import { buildModuleIdFilter, buildModuleIdParser } from '../utils/id.js';
import * as svelteCompiler from 'svelte/compiler';
import { log, logCompilerWarnings } from '../utils/log.js';
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

	/**
	 * @type {import('svelte/compiler').ModuleCompileOptions}
	 */
	let staticModuleCompileOptions;

	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:compile-module',
		enforce: 'post',
		async configResolved() {
			options = api.options;
			//@ts-expect-error transform defined below but filter not in type
			plugin.transform.filter = buildModuleIdFilter(options);
			idParser = buildModuleIdParser(options);
			staticModuleCompileOptions = filterNonModuleCompilerOptions(options.compilerOptions);
		},
		transform: {
			async handler(code, id) {
				const ssr = this.environment.config.consumer === 'server';
				const moduleRequest = idParser(id, ssr);
				if (!moduleRequest) {
					return;
				}
				const filename = moduleRequest.filename;
				/** @type {import('svelte/compiler').CompileOptions} */
				const compileOptions = {
					...staticModuleCompileOptions,
					dev: !this.environment.config.isProduction,
					generate: ssr ? 'server' : 'client',
					filename
				};
				const dynamicCompileOptions = await options?.dynamicCompileOptions?.({
					filename,
					code,
					compileOptions
				});
				if (dynamicCompileOptions && log.debug.enabled) {
					log.debug(
						`dynamic compile options for  ${filename}: ${JSON.stringify(dynamicCompileOptions)}`,
						undefined,
						'compileModule'
					);
				}
				const finalCompileOptions = dynamicCompileOptions
					? {
							...compileOptions,
							...dynamicCompileOptions
						}
					: compileOptions;
				// @ts-expect-error experimental not typed yet
				if (dynamicCompileOptions?.experimental) {
					// @ts-expect-error experimental not typed yet
					finalCompileOptions.experimental = {
						// @ts-expect-error experimental not typed yet
						...compileOptions.experimental,
						// @ts-expect-error experimental not typed yet
						...dynamicCompileOptions.experimental
					};
				}
				const finalModuleCompileOptions = filterNonModuleCompilerOptions(finalCompileOptions);
				if (log.debug.enabled) {
					log.debug(
						`final ModuleCompileOptions for  ${filename}: ${JSON.stringify(finalModuleCompileOptions)}`,
						undefined,
						'compileModule'
					);
				}
				try {
					const compileResult = svelteCompiler.compileModule(code, finalModuleCompileOptions);
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

/**
 *
 * @param {import('svelte/compiler').CompileOptions} compilerOptions
 * @return {import('svelte/compiler').ModuleCompileOptions}
 */
function filterNonModuleCompilerOptions(compilerOptions) {
	/** @type {Array<keyof import('svelte/compiler').ModuleCompileOptions>} */
	const knownModuleCompileOptionNames = [
		'dev',
		'generate',
		'filename',
		'rootDir',
		'warningFilter',
		// @ts-expect-error will only be defined after svelte aysnc is released
		'experimental'
	];
	// TODO type /** @type {Array<keyof import('svelte/compiler').ModuleCompileOptions['experimental']>} */
	const experimentalModuleCompilerOptionNames = ['async'];

	/** @type {import('svelte/compiler').ModuleCompileOptions} */
	const filtered = filterByPropNames(compilerOptions, knownModuleCompileOptionNames);
	// @ts-expect-error experimental not typed yet
	if (filtered.experimental) {
		// @ts-expect-error experimental not typed yet
		filtered.experimental = filterByPropNames(
			// @ts-expect-error experimental not typed yet
			filtered.experimental,
			experimentalModuleCompilerOptionNames
		);
	}
	return filtered;
}

/**
 *
 * @param {object} o
 * @param {string[]} names
 * @returns {object}
 */
function filterByPropNames(o, names) {
	return Object.fromEntries(Object.entries(o).filter(([name]) => names.includes(name)));
}
