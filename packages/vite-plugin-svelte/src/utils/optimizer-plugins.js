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
/*
 * @typedef {NonNullable<import('vite').DepOptimizationOptions['rollupOptions']>} RollupOptions
 * @typedef {NonNullable<RollupOptions['plugins']>[number]} RolldownPlugin
 */
// TODO type correctly when the above works
/**
 * @typedef {{
 *   name: string,
 *   options: ()=>void,
 *   transform?:{
 *    filter: any
 *    handler: (code: string,id: string)=>Promise<any>
 *   },
 *   buildStart?:()=>void,
 *   buildEnd?:()=>void
 * }} RolldownPlugin
 */
export const facadeOptimizeSveltePluginName = 'vite-plugin-svelte:facade';
export const facadeOptimizeSvelteModulePluginName = 'vite-plugin-svelte-module:facade';

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {EsbuildPlugin}
 */
export function esbuildSveltePlugin(options) {
	return {
		name: 'vite-plugin-svelte:optimize-svelte',
		setup(build) {
			// Skip in scanning phase as Vite already handles scanning Svelte files.
			// Otherwise this would heavily slow down the scanning phase.
			if (build.initialOptions.plugins?.some((v) => v.name === 'vite:dep-scan')) return;

			const filter = /\.svelte(?:\?.*)?$/;
			/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
			let statsCollection;
			build.onStart(() => {
				statsCollection = options.stats?.startCollection('prebundle library components', {
					logResult: (c) => c.stats.length > 1
				});
			});
			build.onLoad({ filter }, async ({ path: filename }) => {
				const code = readFileSync(filename, 'utf8');
				try {
					const result = await compileSvelte(options, { filename, code }, statsCollection);
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
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {RolldownPlugin}
 */
export function rolldownOptimizeSveltePlugin(options) {
	/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
	let statsCollection;
	/** @type {RolldownPlugin} */
	const plugin = {
		name: 'vite-plugin-svelte:rolldown-optimize-svelte',
		// @ts-expect-error not typed in rolldown yet
		options(opts) {
			if (
				opts.plugins?.some((/** @type {{ name: string; }} */ p) =>
					p.name.startsWith('vite:dep-scan')
				)
			) {
				delete plugin.transform;
				delete plugin.buildStart;
				delete plugin.buildEnd;
			}
		},
		transform: {
			filter: {
				// TODO: remove excludes once above options hook works
				id: { include: [/^[^?#]+\.svelte(?:[?#]|$)/], exclude: [/^virtual-module:/] },
				code: { exclude: [/(?:import|export)[^"\n]+"virtual-module:/] }
			},
			/**
			 * @param {string} code
			 * @param {string} filename
			 */
			async handler(code, filename) {
				try {
					return await compileSvelte(options, { filename, code }, statsCollection);
				} catch (e) {
					throw toRollupError(e, options);
				}
			}
		},
		buildStart() {
			statsCollection = options.stats?.startCollection('prebundle library components', {
				logResult: (c) => c.stats.length > 1
			});
		},
		buildEnd() {
			statsCollection?.finish();
		}
	};
	return plugin;
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
 * @returns {EsbuildPlugin}
 */
export function esbuildSvelteModulePlugin(options) {
	return {
		name: 'vite-plugin-svelte-module:optimize-svelte',
		setup(build) {
			// Skip in scanning phase as Vite already handles scanning Svelte files.
			// Otherwise this would heavily slow down the scanning phase.
			if (build.initialOptions.plugins?.some((v) => v.name === 'vite:dep-scan')) return;

			const filter = /\.svelte\.[jt]s(?:\?.*)?$/;
			/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
			let statsCollection;
			build.onStart(() => {
				statsCollection = options.stats?.startCollection('prebundle library modules', {
					logResult: (c) => c.stats.length > 1
				});
			});
			build.onLoad({ filter }, async ({ path: filename }) => {
				const code = readFileSync(filename, 'utf8');
				try {
					const result = await compileSvelteModule(options, { filename, code }, statsCollection);
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
		}
	};
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {RolldownPlugin}
 */
export function rolldownOptimizeSvelteModulePlugin(options) {
	/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
	let statsCollection;
	/** @type {RolldownPlugin} */
	const plugin = {
		name: 'vite-plugin-svelte:rolldown-optimize-svelte-module',
		// @ts-expect-error not typed in rolldown yet
		options(opts) {
			if (
				opts.plugins?.some((/** @type {{ name: string; }} */ p) =>
					p.name.startsWith('vite:dep-scan')
				)
			) {
				delete plugin.transform;
				delete plugin.buildStart;
				delete plugin.buildEnd;
			}
		},
		transform: {
			filter: {
				// TODO: remove excludes once above options hook works
				id: { include: [/^[^?#]+\.svelte\.js(?:[?#]|$)/], exclude: [/^virtual-module:/] },
				code: { exclude: [/(?:import|export)[^"\n]+"virtual-module:/] }
			},
			/**
			 * @param {string} code
			 * @param {string} filename
			 */
			async handler(code, filename) {
				try {
					return await compileSvelteModule(options, { filename, code }, statsCollection);
				} catch (e) {
					throw toRollupError(e, options);
				}
			}
		},
		buildStart() {
			statsCollection = options.stats?.startCollection('prebundle library components', {
				logResult: (c) => c.stats.length > 1
			});
		},
		buildEnd() {
			statsCollection?.finish();
		}
	};
	return plugin;
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
