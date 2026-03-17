/** @import { Code } from '../types/compile.js' */
/** @import { ResolvedOptions } from '../types/options.js' */
/** @import { PluginAPI } from '../types/plugin-api.js' */
/** @import { StatCollection } from '../types/vite-plugin-svelte-stats.js' */
/** @import { CompileOptions } from 'svelte/compiler' */
/** @import { Plugin, ResolvedConfig, Rollup, UserConfig } from 'vite' */

import fs from 'node:fs/promises';
import path from 'node:path';
import * as svelte from 'svelte/compiler';
import { log } from '../utils/log.js';
import { toRollupError } from '../utils/error.js';

/**
 * @typedef {NonNullable<Rollup.Plugin>} RollupPlugin
 */

const optimizeSveltePluginName = 'vite-plugin-svelte:optimize';
const optimizeSvelteModulePluginName = 'vite-plugin-svelte:optimize-module';

/**
 * @param {PluginAPI} api
 * @returns {Plugin}
 */
export function setupOptimizer(api) {
	/** @type {ResolvedConfig} */
	let viteConfig;

	return {
		name: 'vite-plugin-svelte:setup-optimizer',
		apply: 'serve',
		configEnvironment(name, config) {
			// fall back to vite behavior when consumer isn't set
			const consumer = (config.consumer ?? name === 'client') ? 'client' : 'server';
			/** @type {UserConfig['optimizeDeps']} */
			const optimizeDeps = {
				// Experimental Vite API to allow these extensions to be scanned and prebundled
				extensions: ['.svelte']
			};
			// Add optimizer plugins to prebundle Svelte files.
			// Currently, a placeholder as more information is needed after Vite config is resolved,
			// the added plugins are patched in configResolved below
			if (rolldownVersion) {
				//@ts-ignore rolldown types not finished

				optimizeDeps.rollupOptions = {
					plugins: [
						rolldownOptimizerPlugin(api, consumer, true),
						rolldownOptimizerPlugin(api, consumer, false)
					]
				};
			} else {
				optimizeDeps.esbuildOptions = {
					plugins: [
						esbuildOptimizerPlugin(api, consumer, true),
						esbuildOptimizerPlugin(api, consumer, false)
					]
				};
			}
			return { optimizeDeps };
		},
		configResolved(c) {
			viteConfig = c;
		},
		async buildStart() {
			if (!api.options.prebundleSvelteLibraries) return;
			const changed = await svelteMetadataChanged(viteConfig.cacheDir, api.options);
			if (changed) {
				// Force Vite to optimize again. Although we mutate the config here, it works because
				// Vite's optimizer runs after `buildStart()`.
				viteConfig.optimizeDeps.force = true;
			}
		}
	};
}

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @param {'server'|'client'} consumer
 * @param {boolean} components
 * @return {EsbuildPlugin}
 */
function esbuildOptimizerPlugin(api, consumer, components) {
	const name = components ? optimizeSveltePluginName : optimizeSvelteModulePluginName;
	const compileFn = components ? compileSvelte : compileSvelteModule;
	const statsName = components ? 'prebundle library components' : 'prebundle library modules';
	const filter = components ? /\.svelte(?:\?.*)?$/ : /\.svelte\.[jt]s(?:\?.*)?$/;
	const generate = consumer === 'server' ? 'server' : 'client';

	return {
		name,
		setup(build) {
			if (build.initialOptions.plugins?.some((v) => v.name === 'vite:dep-scan')) return;

			/** @type {StatCollection | undefined} */
			let statsCollection;
			build.onStart(() => {
				statsCollection = api.options.stats?.startCollection(statsName, {
					logResult: (c) => c.stats.length > 1
				});
			});
			build.onLoad({ filter }, async ({ path: filename }) => {
				const code = readFileSync(filename, 'utf8');
				try {
					const result = await compileFn(
						api.options,
						{ filename, code },
						generate,
						statsCollection
					);
					const contents = result.map
						? result.code + '//# sourceMappingURL=' + result.map.toUrl()
						: result.code;
					return { contents };
				} catch (e) {
					return { errors: [toESBuildError(e, api.options)] };
				}
			});
			build.onEnd(() => {
				statsCollection?.finish();
			});
		}
	};
}

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @param {'server'|'client'} consumer
 * @param {boolean} components
 * @return {import('vite').Rollup.Plugin}
 */
function rolldownOptimizerPlugin(api, consumer, components) {
	const name = components ? optimizeSveltePluginName : optimizeSvelteModulePluginName;
	const compileFn = components ? compileSvelte : compileSvelteModule;
	const statsName = components ? 'prebundle library components' : 'prebundle library modules';
	const includeRe = components ? /^[^?#]+\.svelte(?:[?#]|$)/ : /^[^?#]+\.svelte\.[jt]s(?:[?#]|$)/;
	const generate = consumer === 'server' ? 'server' : 'client';
	/** @type {StatCollection | undefined} */
	let statsCollection;
	/**@type {import('vite').Rollup.Plugin}*/
	const plugin = {
		name
	};
	plugin.options = (opts) => {
		// @ts-expect-error plugins is an array here
		const isScanner = opts.plugins.some(
			(/** @type {{ name: string; }} */ p) => p.name === 'vite:dep-scan:resolve'
		);
		if (isScanner) {
			delete plugin.buildStart;
			delete plugin.transform;
			delete plugin.buildEnd;
		} else {
			plugin.transform = {
				filter: { id: includeRe },
				/**
				 * @param {string} code
				 * @param {string} filename
				 */
				async handler(code, filename) {
					try {
						return await compileFn(api.options, { filename, code }, generate, statsCollection);
					} catch (e) {
						throw toRollupError(e, api.options);
					}
				}
			};
			plugin.buildStart = () => {
				statsCollection = api.options.stats?.startCollection(statsName, {
					logResult: (c) => c.stats.length > 1
				});
			};
			plugin.buildEnd = () => {
				statsCollection?.finish();
			};
		}
	};
	return plugin;
}

/**
 * @param {ResolvedOptions} options
 * @param {{ filename: string, code: string }} input
 * @param {'client'|'server'}  generate
 * @param {StatCollection} [statsCollection]
 * @returns {Promise<Code>}
 */
async function compileSvelte(options, { filename, code }, generate, statsCollection) {
	let css = options.compilerOptions.css;
	if (css !== 'injected') {
		// TODO ideally we'd be able to externalize prebundled styles too, but for now always put them in the js
		css = 'injected';
	}
	/** @type {CompileOptions} */
	const compileOptions = {
		dev: true, // default to dev: true because prebundling is only used in dev
		...options.compilerOptions,
		css,
		filename,
		generate
	};

	let preprocessed;

	if (options.preprocess) {
		try {
			preprocessed = await svelte.preprocess(code, options.preprocess, { filename });
		} catch (e) {
			e.message = `Error while preprocessing ${filename}${e.message ? ` - ${e.message}` : ''}`;
			throw e;
		}
		if (preprocessed.map) compileOptions.sourcemap = preprocessed.map;
	}

	const finalCode = preprocessed ? preprocessed.code : code;

	const dynamicCompileOptions = await options?.dynamicCompileOptions?.({
		filename,
		code: finalCode,
		compileOptions
	});

	if (dynamicCompileOptions && log.debug.enabled) {
		log.debug(
			`dynamic compile options for  ${filename}: ${JSON.stringify(dynamicCompileOptions)}`,
			undefined,
			'compile'
		);
	}

	const finalCompileOptions = dynamicCompileOptions
		? {
				...compileOptions,
				...dynamicCompileOptions
			}
		: compileOptions;
	const endStat = statsCollection?.start(filename);
	const compiled = svelte.compile(finalCode, finalCompileOptions);
	if (endStat) {
		endStat();
	}
	return {
		...compiled.js,
		moduleType: 'js'
	};
}

/**
 * @param {ResolvedOptions} options
 * @param {{ filename: string; code: string }} input
 * @param {'client'|'server'} generate
 * @param {StatCollection} [statsCollection]
 * @returns {Promise<Code>}
 */
async function compileSvelteModule(options, { filename, code }, generate, statsCollection) {
	const endStat = statsCollection?.start(filename);
	const compiled = svelte.compileModule(code, {
		dev: options.compilerOptions?.dev ?? true, // default to dev: true because prebundling is only used in dev
		filename,
		generate
	});
	if (endStat) {
		endStat();
	}
	return {
		...compiled.js,
		moduleType: 'js'
	};
}

// List of options that changes the prebundling result
/** @type {(keyof ResolvedOptions)[]} */
const PREBUNDLE_SENSITIVE_OPTIONS = [
	'compilerOptions',
	'configFile',
	'experimental',
	'extensions',
	'preprocess'
];

/**
 * stores svelte metadata in cache dir and compares if it has changed
 *
 * @param {string} cacheDir
 * @param {ResolvedOptions} options
 * @returns {Promise<boolean>} Whether the Svelte metadata has changed
 */
async function svelteMetadataChanged(cacheDir, options) {
	const svelteMetadata = generateSvelteMetadata(options);
	const svelteMetadataPath = path.resolve(cacheDir, '_svelte_metadata.json');

	const currentSvelteMetadata = JSON.stringify(svelteMetadata, (_, value) => {
		// Handle preprocessors
		return typeof value === 'function' ? value.toString() : value;
	});

	/** @type {string | undefined} */
	let existingSvelteMetadata;
	try {
		existingSvelteMetadata = await fs.readFile(svelteMetadataPath, 'utf8');
	} catch {
		// ignore
	}

	await fs.mkdir(cacheDir, { recursive: true });
	await fs.writeFile(svelteMetadataPath, currentSvelteMetadata);
	return currentSvelteMetadata !== existingSvelteMetadata;
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {Partial<import('../types/options.d.ts').ResolvedOptions>}
 */
function generateSvelteMetadata(options) {
	/** @type {Record<string, any>} */
	const metadata = {};
	for (const key of PREBUNDLE_SENSITIVE_OPTIONS) {
		metadata[key] = options[key];
	}
	return metadata;
}
