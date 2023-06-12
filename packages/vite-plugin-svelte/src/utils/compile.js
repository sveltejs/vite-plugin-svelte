import { compile, preprocess, walk } from 'svelte/compiler';
// @ts-ignore
import { createMakeHot } from 'svelte-hmr';
import { safeBase64Hash } from './hash.js';
import { log } from './log.js';

import { createInjectScopeEverythingRulePreprocessorGroup } from './preprocess.js';
import { mapToRelative } from './sourcemaps.js';

const scriptLangRE = /<script [^>]*lang=["']?([^"' >]+)["']?[^>]*>/;

import { isSvelte3 } from './svelte-version.js';

/**
 * @param {Function} [makeHot]
 * @returns {import('../types/compile.d.ts').CompileSvelte}
 */
export const _createCompileSvelte = (makeHot) => {
	/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
	let stats;
	const devStylePreprocessor = createInjectScopeEverythingRulePreprocessorGroup();
	/** @type {import('../types/compile.d.ts').CompileSvelte} */
	return async function compileSvelte(svelteRequest, code, options) {
		const { filename, normalizedFilename, cssId, ssr, raw } = svelteRequest;
		const { emitCss = true } = options;
		const dependencies = [];

		if (options.stats) {
			if (options.isBuild) {
				if (!stats) {
					// build is either completely ssr or csr, create stats collector on first compile
					// it is then finished in the buildEnd hook.
					stats = options.stats.startCollection(`${ssr ? 'ssr' : 'dom'} compile`, {
						logInProgress: () => false
					});
				}
			} else {
				// dev time ssr, it's a ssr request and there are no stats, assume new page load and start collecting
				if (ssr && !stats) {
					stats = options.stats.startCollection('ssr compile');
				}
				// stats are being collected but this isn't an ssr request, assume page loaded and stop collecting
				if (!ssr && stats) {
					stats.finish();
					stats = undefined;
				}
				// TODO find a way to trace dom compile during dev
				// problem: we need to call finish at some point but have no way to tell if page load finished
				// also they for hmr updates too
			}
		}
		/** @type {import('../index.d.ts').CompileOptions} */
		const compileOptions = {
			...options.compilerOptions,
			filename: normalizedFilename, // use normalized here to avoid bleeding absolute fs path
			generate: ssr ? 'ssr' : 'dom'
		};
		if (isSvelte3) {
			// @ts-ignore
			compileOptions.format = 'esm';
		}
		if (options.hot && options.emitCss) {
			const hash = `s-${safeBase64Hash(normalizedFilename)}`;
			log.debug(`setting cssHash ${hash} for ${normalizedFilename}`);
			compileOptions.cssHash = () => hash;
		}
		if (ssr && compileOptions.enableSourcemap !== false) {
			if (typeof compileOptions.enableSourcemap === 'object') {
				compileOptions.enableSourcemap.css = false;
			} else {
				compileOptions.enableSourcemap = { js: true, css: false };
			}
		}

		let preprocessed;
		let preprocessors = options.preprocess;
		if (!options.isBuild && options.emitCss && options.hot) {
			// inject preprocessor that ensures css hmr works better
			if (!Array.isArray(preprocessors)) {
				preprocessors = preprocessors
					? [preprocessors, devStylePreprocessor]
					: [devStylePreprocessor];
			} else {
				preprocessors = preprocessors.concat(devStylePreprocessor);
			}
		}
		if (preprocessors) {
			try {
				preprocessed = await preprocess(code, preprocessors, { filename }); // full filename here so postcss works
			} catch (e) {
				e.message = `Error while preprocessing ${filename}${e.message ? ` - ${e.message}` : ''}`;
				throw e;
			}

			if (preprocessed.dependencies) dependencies.push(...preprocessed.dependencies);
			if (preprocessed.map) compileOptions.sourcemap = preprocessed.map;
		}
		if (typeof preprocessed?.map === 'object') {
			mapToRelative(preprocessed?.map, filename);
		}
		if (raw && svelteRequest.query.type === 'preprocessed') {
			// @ts-expect-error shortcut
			return /** @type {import('../types/compile.d.ts').CompileData} */ {
				preprocessed: preprocessed ?? { code }
			};
		}
		const finalCode = preprocessed ? preprocessed.code : code;
		const dynamicCompileOptions = await options.experimental?.dynamicCompileOptions?.({
			filename,
			code: finalCode,
			compileOptions
		});
		if (dynamicCompileOptions && log.debug.enabled) {
			log.debug(
				`dynamic compile options for  ${filename}: ${JSON.stringify(dynamicCompileOptions)}`
			);
		}
		const finalCompileOptions = dynamicCompileOptions
			? {
					...compileOptions,
					...dynamicCompileOptions
			  }
			: compileOptions;

		const endStat = stats?.start(filename);
		const compiled = compile(finalCode, finalCompileOptions);

		if (isSvelte3) {
			// prevent dangling pure comments
			// see https://github.com/sveltejs/kit/issues/9492#issuecomment-1487704985
			// uses regex replace with whitespace to keep sourcemap/character count unmodified
			compiled.js.code = compiled.js.code.replace(
				/\/\* [@#]__PURE__ \*\/(\s*)$/gm,
				'               $1'
			);
		}
		if (endStat) {
			endStat();
		}
		mapToRelative(compiled.js?.map, filename);
		mapToRelative(compiled.css?.map, filename);
		if (!raw) {
			// wire css import and code for hmr
			const hasCss = compiled.css?.code?.trim().length > 0;
			// compiler might not emit css with mode none or it may be empty
			if (emitCss && hasCss) {
				// TODO properly update sourcemap?
				compiled.js.code += `\nimport ${JSON.stringify(cssId)};\n`;
			}

			// only apply hmr when not in ssr context and hot options are set
			if (!ssr && makeHot) {
				compiled.js.code = makeHot({
					id: filename,
					compiledCode: compiled.js.code,
					//@ts-expect-error hot isn't a boolean at this point
					hotOptions: { ...options.hot, injectCss: options.hot?.injectCss === true && hasCss },
					compiled,
					originalCode: code,
					compileOptions: finalCompileOptions
				});
			}
		}

		return {
			filename,
			normalizedFilename,
			lang: code.match(scriptLangRE)?.[1] || 'js',
			// @ts-ignore
			compiled,
			ssr,
			dependencies,
			preprocessed: preprocessed ?? { code }
		};
	};
};

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {Function | undefined}
 */
function buildMakeHot(options) {
	const needsMakeHot = options.hot !== false && options.isServe && !options.isProduction;
	if (needsMakeHot) {
		// @ts-ignore
		const hotApi = options?.hot?.hotApi;
		// @ts-ignore
		const adapter = options?.hot?.adapter;
		return createMakeHot({
			walk,
			hotApi,
			adapter,
			hotOptions: { noOverlay: true, .../** @type {object} */ (options.hot) }
		});
	}
}

/**
 * @param {import('../types/options.d.ts').ResolvedOptions} options
 * @returns {import('../types/compile.d.ts').CompileSvelte}
 */
export function createCompileSvelte(options) {
	const makeHot = buildMakeHot(options);
	return _createCompileSvelte(makeHot);
}
