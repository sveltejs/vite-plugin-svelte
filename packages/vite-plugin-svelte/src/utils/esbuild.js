import { readFileSync } from 'node:fs';
import * as svelte from 'svelte/compiler';
import { log } from './log.js';
import { toESBuildError } from './error.js';
import {
	DEFAULT_SVELTE_EXT,
	DEFAULT_SVELTE_MODULE_EXT,
	DEFAULT_SVELTE_MODULE_INFIX
} from './constants.js';

/**
 * @typedef {NonNullable<import('vite').DepOptimizationOptions['esbuildOptions']>} EsbuildOptions
 * @typedef {NonNullable<EsbuildOptions['plugins']>[number]} EsbuildPlugin
 */

export const facadeEsbuildSveltePluginName = 'vite-plugin-svelte:facade';

/**
 * escape regex special chars
 * @param {string} s
 * @returns {string}
 */
function rescape(s) {
	return s.replace(/([/.+^${}()|[\]\\])/g, '\\$1');
}

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

			const svelteExtensions = DEFAULT_SVELTE_EXT;
			const svelteModuleInfixes = DEFAULT_SVELTE_MODULE_INFIX;
			const svelteModuleExt = DEFAULT_SVELTE_MODULE_EXT;
			const svelteExtRE = `(?:${svelteExtensions.map(rescape).join('|')})`;
			const svelteModuleRE = `(?:${svelteModuleInfixes.map((infix) => rescape(infix.slice(0, -1))).join('|')})(?:\\.[^.]+)*(?:${svelteModuleExt.map(rescape).join('|')})`;
			const optionalQueryStringRE = '(?:\\?.*)?';
			// one regex that matches either .svelte OR .svelte(.something)?.(js|ts) optionally followed by a querystring ?foo=bar
			// onload decides which one to call
			// TODO: better split this in two plugins? but then we need 2 facades too
			const filter = new RegExp(`${svelteModuleRE}|${svelteExtRE}${optionalQueryStringRE}$`);
			/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
			let statsCollection;
			build.onStart(() => {
				statsCollection = options.stats?.startCollection('prebundle libraries', {
					logResult: (c) => c.stats.length > 1
				});
			});
			build.onLoad({ filter }, async ({ path: filename }) => {
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
	if (DEFAULT_SVELTE_MODULE_EXT.some((ext) => filename.endsWith(ext))) {
		const endStat = statsCollection?.start(filename);
		const compiled = svelte.compileModule(code, {
			filename,
			generate: 'client'
		});
		if (endStat) {
			endStat();
		}
		return compiled.js.map
			? compiled.js.code + '//# sourceMappingURL=' + compiled.js.map.toUrl()
			: compiled.js.code;
	}
	let css = options.compilerOptions.css;
	if (css !== 'injected') {
		// TODO ideally we'd be able to externalize prebundled styles too, but for now always put them in the js
		css = 'injected';
	}
	/** @type {import('svelte/compiler').CompileOptions} */
	const compileOptions = {
		...options.compilerOptions,
		css,
		filename,
		generate: 'client'
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
	return compiled.js.map
		? compiled.js.code + '//# sourceMappingURL=' + compiled.js.map.toUrl()
		: compiled.js.code;
}
