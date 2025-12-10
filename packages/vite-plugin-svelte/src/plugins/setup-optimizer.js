import fs from 'node:fs/promises';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import * as svelte from 'svelte/compiler';
import { log } from '../utils/log.js';
import { toESBuildError, toRollupError } from '../utils/error.js';
import { safeBase64Hash } from '../utils/hash.js';
import { normalize } from '../utils/id.js';
import * as vite from 'vite';
// @ts-ignore not typed on vite
const { rolldownVersion } = vite;

/**
 * @typedef {NonNullable<import('vite').DepOptimizationOptions['esbuildOptions']>} EsbuildOptions
 * @typedef {NonNullable<EsbuildOptions['plugins']>[number]} EsbuildPlugin
 */
/**
 * @typedef {NonNullable<import('vite').Rollup.Plugin>} RollupPlugin
 */

const optimizeSveltePluginName = 'vite-plugin-svelte:optimize';
const optimizeSvelteModulePluginName = 'vite-plugin-svelte:optimize-module';

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function setupOptimizer(api) {
	/** @type {import('vite').ResolvedConfig} */
	let viteConfig;

	return {
		name: 'vite-plugin-svelte:setup-optimizer',
		apply: 'serve',
		config() {
			/** @type {import('vite').UserConfig['optimizeDeps']} */
			const optimizeDeps = {
				// Experimental Vite API to allow these extensions to be scanned and prebundled
				extensions: ['.svelte']
			};
			// Add optimizer plugins to prebundle Svelte files.
			// Currently, a placeholder as more information is needed after Vite config is resolved,
			// the added plugins are patched in configResolved below
			if (rolldownVersion) {
				//@ts-ignore rolldown types not finished
				optimizeDeps.rolldownOptions = {
					plugins: [
						placeholderRolldownOptimizerPlugin(optimizeSveltePluginName),
						placeholderRolldownOptimizerPlugin(optimizeSvelteModulePluginName)
					]
				};
			} else {
				optimizeDeps.esbuildOptions = {
					plugins: [
						{ name: optimizeSveltePluginName, setup: () => {} },
						{ name: optimizeSvelteModulePluginName, setup: () => {} }
					]
				};
			}
			return { optimizeDeps };
		},
		configResolved(c) {
			viteConfig = c;
			const optimizeDeps = c.optimizeDeps;
			if (rolldownVersion) {
				const plugins =
					// @ts-expect-error not typed
					optimizeDeps.rolldownOptions?.plugins?.filter((p) =>
						[optimizeSveltePluginName, optimizeSvelteModulePluginName].includes(p.name)
					) ?? [];
				for (const plugin of plugins) {
					patchRolldownOptimizerPlugin(plugin, api.options);
				}
			} else {
				const plugins =
					optimizeDeps.esbuildOptions?.plugins?.filter((p) =>
						[optimizeSveltePluginName, optimizeSvelteModulePluginName].includes(p.name)
					) ?? [];
				for (const plugin of plugins) {
					patchESBuildOptimizerPlugin(plugin, api.options);
				}
			}
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
 * @param {EsbuildPlugin} plugin
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 */
function patchESBuildOptimizerPlugin(plugin, options) {
	const components = plugin.name === optimizeSveltePluginName;
	const compileFn = components ? compileSvelte : compileSvelteModule;
	const statsName = components ? 'prebundle library components' : 'prebundle library modules';
	const filter = components ? /\.svelte(?:\?.*)?$/ : /\.svelte\.[jt]s(?:\?.*)?$/;
	plugin.setup = (build) => {
		if (build.initialOptions.plugins?.some((v) => v.name === 'vite:dep-scan')) return;

		/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
		let statsCollection;
		build.onStart(() => {
			statsCollection = options.stats?.startCollection(statsName, {
				logResult: (c) => c.stats.length > 1
			});
		});
		build.onLoad({ filter }, async ({ path: filename }) => {
			const code = readFileSync(filename, 'utf8');
			try {
				const result = await compileFn(options, { filename, code }, statsCollection);
				const contents = result.map
					? result.code + '//# sourceMappingURL=' + result.map.toUrl()
					: result.code;
				return { contents };
			} catch (e) {
				return { errors: [toESBuildError(e, options)] };
			}
		});
		build.onEnd(() => {
			statsCollection?.finish();
		});
	};
}

/**
 * @param {RollupPlugin} plugin
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 */
function patchRolldownOptimizerPlugin(plugin, options) {
	const components = plugin.name === optimizeSveltePluginName;
	const compileFn = components ? compileSvelte : compileSvelteModule;
	const statsName = components ? 'prebundle library components' : 'prebundle library modules';
	const includeRe = components ? /^[^?#]+\.svelte(?:[?#]|$)/ : /^[^?#]+\.svelte\.[jt]s(?:[?#]|$)/;
	/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
	let statsCollection;

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
						return await compileFn(options, { filename, code }, statsCollection);
					} catch (e) {
						throw toRollupError(e, options);
					}
				}
			};
			plugin.buildStart = () => {
				statsCollection = options.stats?.startCollection(statsName, {
					logResult: (c) => c.stats.length > 1
				});
			};
			plugin.buildEnd = () => {
				statsCollection?.finish();
			};
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @param {{ filename: string, code: string }} input
 * @param {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection} [statsCollection]
 * @returns {Promise<import('../types/compile.d.ts').Code>}
 */
async function compileSvelte(options, { filename, code }, statsCollection) {
	let css = options.compilerOptions.css;
	if (css !== 'injected') {
		// TODO ideally we'd be able to externalize prebundled styles too, but for now always put them in the js
		css = 'injected';
	}
	/** @type {import('svelte/compiler').CompileOptions} */
	const compileOptions = {
		dev: true, // default to dev: true because prebundling is only used in dev
		...options.compilerOptions,
		css,
		filename,
		generate: 'client'
	};

	if (compileOptions.hmr && options.emitCss) {
		const hash = `s-${safeBase64Hash(normalize(filename, options.root))}`;
		compileOptions.cssHash = () => hash;
	}

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
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @param {{ filename: string; code: string }} input
 * @param {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection} [statsCollection]
 * @returns {Promise<import('../types/compile.d.ts').Code>}
 */
async function compileSvelteModule(options, { filename, code }, statsCollection) {
	const endStat = statsCollection?.start(filename);
	const compiled = svelte.compileModule(code, {
		dev: options.compilerOptions?.dev ?? true, // default to dev: true because prebundling is only used in dev
		filename,
		generate: 'client'
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
/** @type {(keyof import('../types/options.d.ts').ResolvedOptions)[]} */
const PREBUNDLE_SENSITIVE_OPTIONS = [
	'compilerOptions',
	'configFile',
	'experimental',
	'extensions',
	'ignorePluginPreprocessors',
	'preprocess'
];

/**
 * stores svelte metadata in cache dir and compares if it has changed
 *
 * @param {string} cacheDir
 * @param {import('../types/options.d.ts').ResolvedOptions} options
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
 *
 * @param {string} name
 * @returns {import('vite').Rollup.Plugin}
 */
function placeholderRolldownOptimizerPlugin(name) {
	return {
		name,
		options() {},
		buildStart() {},
		buildEnd() {},
		transform: { filter: { id: /^$/ }, handler() {} }
	};
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
