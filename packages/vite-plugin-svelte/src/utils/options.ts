/* eslint-disable no-unused-vars */
import { ConfigEnv, UserConfig, ViteDevServer, normalizePath } from 'vite';
import { log } from './log';
import { loadSvelteConfig } from './load-svelte-config';
import { SVELTE_HMR_IMPORTS, SVELTE_IMPORTS, SVELTE_RESOLVE_MAIN_FIELDS } from './constants';
// eslint-disable-next-line node/no-missing-import
import { CompileOptions, Warning } from 'svelte/types/compiler/interfaces';
import {
	MarkupPreprocessor,
	Preprocessor,
	PreprocessorGroup,
	Processed
	// eslint-disable-next-line node/no-missing-import
} from 'svelte/types/compiler/preprocess';
import path from 'path';
import { findRootSvelteDependencies, SvelteDependency } from './dependencies';
import { DepOptimizationOptions } from 'vite/src/node/optimizer/index';

const knownOptions = new Set([
	'configFile',
	'include',
	'exclude',
	'extensions',
	'emitCss',
	'compilerOptions',
	'onwarn',
	'preprocess',
	'hot',
	'ignorePluginPreprocessors',
	'experimental'
]);

function buildDefaultOptions(isProduction: boolean, options: Partial<Options>): Partial<Options> {
	// emit for prod, emit in dev unless css hmr is disabled
	const emitCss = options?.emitCss != null ? options.emitCss : true;
	// no hmr in prod, only inject css in dev if emitCss is false
	const hot = isProduction
		? false
		: {
				injectCss: !emitCss
		  };
	const defaultOptions: Partial<Options> = {
		extensions: ['.svelte'],
		hot,
		emitCss,
		compilerOptions: {
			format: 'esm',
			css: !emitCss,
			dev: !isProduction
		}
	};
	log.debug(`default options for ${isProduction ? 'production' : 'development'}`, defaultOptions);
	return defaultOptions;
}

export function validateInlineOptions(inlineOptions?: Partial<Options>) {
	const invalidKeys = Object.keys(inlineOptions || {}).filter((key) => !knownOptions.has(key));
	if (invalidKeys.length) {
		log.warn(`invalid plugin options "${invalidKeys.join(', ')}" in config`, inlineOptions);
	}
}

function enforceOptionsForHmr(options: ResolvedOptions) {
	if (options.hot) {
		if (!options.compilerOptions.dev) {
			log.warn('hmr is enabled but compilerOptions.dev is false, forcing it to true');
			options.compilerOptions.dev = true;
		}
		if (options.emitCss) {
			if (options.hot !== true && options.hot.injectCss) {
				log.warn('hmr and emitCss are enabled but hot.injectCss is true, forcing it to false');
				options.hot.injectCss = false;
			}
			if (options.compilerOptions.css) {
				log.warn(
					'hmr and emitCss are enabled but compilerOptions.css is true, forcing it to false'
				);
				options.compilerOptions.css = false;
			}
		} else {
			if (options.hot === true || !options.hot.injectCss) {
				log.warn(
					'hmr with emitCss disabled requires option hot.injectCss to be enabled, forcing it to true'
				);
				if (options.hot === true) {
					options.hot = { injectCss: true };
				} else {
					options.hot.injectCss = true;
				}
			}
			if (!options.compilerOptions.css) {
				log.warn(
					'hmr with emitCss disabled requires compilerOptions.css to be enabled, forcing it to true'
				);
				options.compilerOptions.css = true;
			}
		}
	}
}

function enforceOptionsForProduction(options: ResolvedOptions) {
	if (options.isProduction) {
		if (options.hot) {
			log.warn('options.hot is enabled but does not work on production build, forcing it to false');
			options.hot = false;
		}
		if (options.compilerOptions.dev) {
			log.warn(
				'you are building for production but compilerOptions.dev is true, forcing it to false'
			);
			options.compilerOptions.dev = false;
		}
	}
}

function mergeOptions(
	defaultOptions: Partial<Options>,
	svelteConfig: Partial<Options>,
	inlineOptions: Partial<Options>,
	viteConfig: UserConfig,
	viteEnv: ConfigEnv
): ResolvedOptions {
	const merged = {
		...defaultOptions,
		...svelteConfig,
		...inlineOptions,
		compilerOptions: {
			...defaultOptions.compilerOptions,
			...(svelteConfig?.compilerOptions || {}),
			...(inlineOptions?.compilerOptions || {})
		},
		experimental: {
			...(svelteConfig?.experimental || {}),
			...(inlineOptions?.experimental || {})
		},
		root: viteConfig.root!,
		isProduction: viteEnv.mode === 'production',
		isBuild: viteEnv.command === 'build',
		isServe: viteEnv.command === 'serve'
	};
	// configFile of svelteConfig contains the absolute path it was loaded from,
	// prefer it over the possibly relative inline path
	if (svelteConfig?.configFile) {
		merged.configFile = svelteConfig.configFile;
	}
	return merged;
}

export async function resolveOptions(
	inlineOptions: Partial<Options> = {},
	viteConfig: UserConfig,
	viteEnv: ConfigEnv
): Promise<ResolvedOptions> {
	const viteConfigWithResolvedRoot = {
		...viteConfig,
		root: resolveViteRoot(viteConfig)
	};
	const defaultOptions = buildDefaultOptions(viteEnv.mode === 'production', inlineOptions);
	const svelteConfig = (await loadSvelteConfig(viteConfigWithResolvedRoot, inlineOptions)) || {};
	const resolvedOptions = mergeOptions(
		defaultOptions,
		svelteConfig,
		inlineOptions,
		viteConfigWithResolvedRoot,
		viteEnv
	);

	enforceOptionsForProduction(resolvedOptions);
	enforceOptionsForHmr(resolvedOptions);
	return resolvedOptions;
}

// vite passes unresolved `root`option to config hook but we need the resolved value, so do it here
// https://github.com/sveltejs/vite-plugin-svelte/issues/113
// https://github.com/vitejs/vite/blob/43c957de8a99bb326afd732c962f42127b0a4d1e/packages/vite/src/node/config.ts#L293
function resolveViteRoot(viteConfig: UserConfig): string | undefined {
	return normalizePath(viteConfig.root ? path.resolve(viteConfig.root) : process.cwd());
}

export function buildExtraViteConfig(
	options: ResolvedOptions,
	config: UserConfig
): Partial<UserConfig> {
	// extra handling for svelte dependencies in the project
	const svelteDeps = findRootSvelteDependencies(options.root);
	const extraViteConfig: Partial<UserConfig> = {
		optimizeDeps: buildOptimizeDepsForSvelte(svelteDeps, config.optimizeDeps),
		resolve: {
			mainFields: [...SVELTE_RESOLVE_MAIN_FIELDS],
			dedupe: [...SVELTE_IMPORTS, ...SVELTE_HMR_IMPORTS]
		}
		// this option is still awaiting a PR in vite to be supported
		// see https://github.com/sveltejs/vite-plugin-svelte/issues/60
		// @ts-ignore
		// knownJsSrcExtensions: options.extensions
	};

	// @ts-ignore
	extraViteConfig.ssr = buildSSROptionsForSvelte(svelteDeps, options, config);

	if (options.experimental?.useVitePreprocess) {
		// needed to transform svelte files with component imports
		// can cause issues with other typescript files, see https://github.com/sveltejs/vite-plugin-svelte/pull/20
		extraViteConfig.esbuild = {
			tsconfigRaw: {
				compilerOptions: {
					importsNotUsedAsValues: 'preserve'
				}
			}
		};
	}
	return extraViteConfig;
}

function buildOptimizeDepsForSvelte(
	svelteDeps: SvelteDependency[],
	optimizeDeps?: DepOptimizationOptions
): DepOptimizationOptions {
	// include svelte imports for optimization unless explicitly excluded
	const include: string[] = [];
	const exclude: string[] = ['svelte-hmr'];
	const isIncluded = (dep: string) => include.includes(dep) || optimizeDeps?.include?.includes(dep);
	const isExcluded = (dep: string) => {
		return (
			exclude.includes(dep) ||
			// vite optimizeDeps.exclude works for subpackages too
			// see https://github.com/vitejs/vite/blob/c87763c1418d1ba876eae13d139eba83ac6f28b2/packages/vite/src/node/optimizer/scan.ts#L293
			optimizeDeps?.exclude?.some((id) => dep === id || id.startsWith(`${dep}/`))
		);
	};
	if (!isExcluded('svelte')) {
		const svelteImportsToInclude = SVELTE_IMPORTS.filter((x) => x !== 'svelte/ssr'); // not used on clientside
		log.debug(
			`adding bare svelte packages to optimizeDeps.include: ${svelteImportsToInclude.join(', ')} `
		);
		include.push(...svelteImportsToInclude.filter((x) => !isIncluded(x)));
	} else {
		log.debug('"svelte" is excluded in optimizeDeps.exclude, skipped adding it to include.');
	}

	const svelteDepsToExclude = Array.from(new Set(svelteDeps.map((dep) => dep.name))).filter(
		(dep) => !isIncluded(dep)
	);
	log.debug(`automatically excluding found svelte dependencies: ${svelteDepsToExclude.join(', ')}`);
	exclude.push(...svelteDepsToExclude.filter((x) => !isExcluded(x)));

	const transitiveDepsToInclude = svelteDeps
		.filter((dep) => isExcluded(dep.name))
		.flatMap((dep) =>
			Object.keys(dep.pkg.dependencies || {})
				.filter((depOfDep) => !isExcluded(depOfDep))
				.map((depOfDep) => dep.path.concat(dep.name, depOfDep).join(' > '))
		);
	log.debug(
		`reincluding transitive dependencies of excluded svelte dependencies`,
		transitiveDepsToInclude
	);
	include.push(...transitiveDepsToInclude);

	return { include, exclude };
}

function buildSSROptionsForSvelte(
	svelteDeps: SvelteDependency[],
	options: ResolvedOptions,
	config: UserConfig
): any {
	const noExternal: string[] = [];

	// add svelte to ssr.noExternal unless it is present in ssr.external
	// so we can resolve it with svelte/ssr
	if (options.isBuild && config.build?.ssr) {
		// @ts-ignore
		if (!config.ssr?.external?.includes('svelte')) {
			noExternal.push('svelte');
		}
	}

	// add svelte dependencies to ssr.noExternal unless present in ssr.external or optimizeDeps.include
	noExternal.push(
		...Array.from(new Set(svelteDeps.map((s) => s.name))).filter((x) => {
			// @ts-ignore
			return !config.ssr?.external?.includes(x) && !config.optimizeDeps?.include?.includes(x);
		})
	);
	return {
		noExternal
	};
}

export interface Options {
	/**
	 * Path to a svelte config file, either absolute or relative to Vite root
	 *
	 * @see https://vitejs.dev/config/#root
	 */
	configFile?: string;

	/**
	 * A `minimatch` pattern, or array of patterns, which specifies the files the plugin should
	 * operate on. By default, all svelte files are included.
	 *
	 * @see https://github.com/isaacs/minimatch
	 */
	include?: Arrayable<string>;

	/**
	 * A `minimatch` pattern, or array of patterns, which specifies the files to be ignored by the
	 * plugin. By default, no files are ignored.
	 *
	 * @see https://github.com/isaacs/minimatch
	 */
	exclude?: Arrayable<string>;

	/**
	 * A list of file extensions to be compiled by Svelte
	 *
	 * @default ['.svelte']
	 */
	extensions?: string[];

	/**
	 * An array of preprocessors to transform the Svelte source code before compilation
	 *
	 * @see https://svelte.dev/docs#svelte_preprocess
	 */
	preprocess?: Arrayable<PreprocessorGroup>;

	/**
	 * Emit Svelte styles as virtual CSS files for Vite and other plugins to process
	 *
	 * @default true
	 */
	emitCss?: boolean;

	/**
	 * The options to be passed to the Svelte compiler
	 *
	 * @see https://svelte.dev/docs#svelte_compile
	 */
	compilerOptions?: CompileOptions;

	/**
	 * Handles warning emitted from the Svelte compiler
	 */
	onwarn?: (warning: Warning, defaultHandler?: (warning: Warning) => void) => void;

	/**
	 * Enable or disable Hot Module Replacement.
	 *
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 *
	 * DO NOT CUSTOMIZE SVELTE-HMR OPTIONS UNLESS YOU KNOW EXACTLY WHAT YOU ARE DOING
	 *
	 *                             YOU HAVE BEEN WARNED
	 *
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 *
	 * Set an object to pass custom options to svelte-hmr
	 *
	 * @see https://github.com/rixo/svelte-hmr#options
	 * @default true for development, always false for production
	 */
	hot?: boolean | { injectCss?: boolean; [key: string]: any };

	/**
	 * Some Vite plugins can contribute additional preprocessors by defining `api.sveltePreprocess`.
	 * If you don't want to use them, set this to true to ignore them all or use an array of strings
	 * with plugin names to specify which.
	 *
	 * @default false
	 */
	ignorePluginPreprocessors?: boolean | string[];

	/**
	 * These options are considered experimental and breaking changes to them can occur in any release
	 */
	experimental?: ExperimentalOptions;
}

/**
 * These options are considered experimental and breaking changes to them can occur in any release
 */
export interface ExperimentalOptions {
	/**
	 * Use extra preprocessors that delegate style and TypeScript preprocessing to native Vite plugins
	 *
	 * Do not use together with `svelte-preprocess`!
	 *
	 * @default false
	 */
	useVitePreprocess?: boolean;

	/**
	 * If a preprocessor does not provide a sourcemap, a best-effort fallback sourcemap will be provided.
	 * This option requires `diff-match-patch` to be installed as a peer dependency.
	 *
	 * @see https://github.com/google/diff-match-patch
	 * @default false
	 */
	generateMissingPreprocessorSourcemaps?: boolean;

	/**
	 * A function to update `compilerOptions` before compilation
	 *
	 * `data.filename` - The file to be compiled
	 * `data.code` - The preprocessed Svelte code
	 * `data.compileOptions` - The current compiler options
	 *
	 * To change part of the compiler options, return an object with the changes you need.
	 *
	 * @example
	 * ```
	 * ({ filename, compileOptions }) => {
	 *   // Dynamically set hydration per Svelte file
	 *   if (compileWithHydratable(filename) && !compileOptions.hydratable) {
	 *     return { hydratable: true };
	 *   }
	 * }
	 * ```
	 */
	dynamicCompileOptions?: (data: {
		filename: string;
		code: string;
		compileOptions: Partial<CompileOptions>;
	}) => Promise<Partial<CompileOptions> | void> | Partial<CompileOptions> | void;
}

export interface ResolvedOptions extends Options {
	// these options are non-nullable after resolve
	compilerOptions: CompileOptions;
	experimental: ExperimentalOptions;
	// extra options
	root: string;
	isProduction: boolean;
	isBuild: boolean;
	isServe: boolean;
	server?: ViteDevServer;
}

export type {
	CompileOptions,
	Processed,
	MarkupPreprocessor,
	Preprocessor,
	PreprocessorGroup,
	Warning
};

export type ModuleFormat = NonNullable<CompileOptions['format']>;

export type CssHashGetter = NonNullable<CompileOptions['cssHash']>;

export type Arrayable<T> = T | T[];
