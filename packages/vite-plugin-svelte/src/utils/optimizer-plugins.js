import { readFileSync } from 'node:fs';
import * as svelte from 'svelte/compiler';
import { log } from './log.js';
import { toESBuildError, toRollupError } from './error.js';
import { safeBase64Hash } from './hash.js';
import { normalize } from './id.js';

/**
 * @typedef {NonNullable<import('vite').DepOptimizationOptions['esbuildOptions']>} EsbuildOptions
 * @typedef {NonNullable<EsbuildOptions['plugins']>[number]} EsbuildPlugin
 */
/**
 * @typedef {NonNullable<import('vite').Rollup.Plugin>} RollupPlugin
 */

export const optimizeSveltePluginName = 'vite-plugin-svelte:optimize';
export const optimizeSvelteModulePluginName = 'vite-plugin-svelte-module:optimize';

/**
 * @param {EsbuildPlugin} plugin
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 */
export function patchESBuildOptimizerPlugin(plugin, options) {
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
export function patchRolldownOptimizerPlugin(plugin, options) {
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
