import { readFileSync } from 'fs';
import { compile, preprocess } from 'svelte/compiler';
import { log } from './log.js';
import { toESBuildError } from './error.js';
import { isSvelte3 } from './svelte-version.js';

/**
 * @typedef {NonNullable<import('vite').DepOptimizationOptions['esbuildOptions']>} EsbuildOptions
 * @typedef {NonNullable<EsbuildOptions['plugins']>[number]} EsbuildPlugin
 */

export const facadeEsbuildSveltePluginName = 'vite-plugin-svelte:facade';

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

			const svelteExtensions = (options.extensions ?? ['.svelte']).map((ext) => ext.slice(1));
			const svelteFilter = new RegExp(`\\.(` + svelteExtensions.join('|') + `)(\\?.*)?$`);
			/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
			let statsCollection;
			build.onStart(() => {
				statsCollection = options.stats?.startCollection('prebundle libraries', {
					logResult: (c) => c.stats.length > 1
				});
			});
			build.onLoad({ filter: svelteFilter }, async ({ path: filename }) => {
				const code = readFileSync(filename, 'utf8');
				try {
					const contents = await compileSvelte(options, { filename, code }, statsCollection);
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
 * @param {{ filename: string; code: string }} input
 * @param {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection} [statsCollection]
 * @returns {Promise<string>}
 */
async function compileSvelte(options, { filename, code }, statsCollection) {
	let css = options.compilerOptions.css;
	if (css !== 'none') {
		// TODO ideally we'd be able to externalize prebundled styles too, but for now always put them in the js
		css = 'injected';
	}
	/** @type {import('../index.d.ts').CompileOptions} */
	const compileOptions = {
		...options.compilerOptions,
		css,
		filename,
		generate: 'dom'
	};
	if (isSvelte3) {
		// @ts-ignore
		compileOptions.format = 'esm';
	}
	let preprocessed;

	if (options.preprocess) {
		try {
			preprocessed = await preprocess(code, options.preprocess, { filename });
		} catch (e) {
			e.message = `Error while preprocessing ${filename}${e.message ? ` - ${e.message}` : ''}`;
			throw e;
		}
		if (preprocessed.map) compileOptions.sourcemap = preprocessed.map;
	}

	const finalCode = preprocessed ? preprocessed.code : code;

	const dynamicCompileOptions = await options.experimental?.dynamicCompileOptions?.({
		filename,
		code: finalCode,
		compileOptions
	});

	if (dynamicCompileOptions && log.debug.enabled) {
		log.debug(`dynamic compile options for  ${filename}: ${JSON.stringify(dynamicCompileOptions)}`);
	}

	const finalCompileOptions = dynamicCompileOptions
		? {
				...compileOptions,
				...dynamicCompileOptions
		  }
		: compileOptions;
	const endStat = statsCollection?.start(filename);
	const compiled = compile(finalCode, finalCompileOptions);
	if (endStat) {
		endStat();
	}
	return compiled.js.code + '//# sourceMappingURL=' + compiled.js.map.toUrl();
}
