/* eslint-disable no-unused-vars */
import { ResolvedConfig, ViteDevServer } from 'vite';
import { log } from './log';
import { loadSvelteConfig } from './load-svelte-config';
import { addExtraPreprocessors } from './preprocess';

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
	'disableCssHmr',
	'useVitePreprocess'
]);

function buildDefaultOptions(
	{ isProduction }: ResolvedConfig,
	options: Partial<Options>
): Partial<Options> {
	const disableCssHmr = !!options?.disableCssHmr;
	// emit for prod, emit in dev unless css hmr is disabled
	const emitCss = options?.emitCss != null ? options.emitCss : isProduction || !disableCssHmr;
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
			dev: !isProduction,
			hydratable: true
		}
	};
	log.debug(
		`default options for ${isProduction ? 'production' : 'development'} ${
			!isProduction && disableCssHmr ? ' with css hmr disabled' : ''
		}`,
		defaultOptions
	);
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
	viteConfig: ResolvedConfig
): ResolvedOptions {
	return {
		...defaultOptions,
		...svelteConfig,
		...inlineOptions,
		compilerOptions: {
			...defaultOptions.compilerOptions,
			...(svelteConfig?.compilerOptions || {}),
			...(inlineOptions?.compilerOptions || {})
		},
		root: viteConfig.root,
		isProduction: viteConfig.isProduction,
		isBuild: viteConfig.command === 'build',
		isServe: viteConfig.command === 'serve'
	};
}

export async function resolveOptions(
	inlineOptions: Partial<Options> = {},
	viteConfig: ResolvedConfig
): Promise<ResolvedOptions> {
	const defaultOptions = buildDefaultOptions(viteConfig, inlineOptions);
	const svelteConfig = (await loadSvelteConfig(viteConfig, inlineOptions)) || {};
	const resolvedOptions = mergeOptions(defaultOptions, svelteConfig, inlineOptions, viteConfig);

	enforceOptionsForProduction(resolvedOptions);

	enforceOptionsForHmr(resolvedOptions);

	addExtraPreprocessors(resolvedOptions, viteConfig);
	log.debug('resolved options', resolvedOptions);
	return resolvedOptions;
}

export interface Options {
	// eslint-disable no-unused-vars
	/** path to svelte config file, either absolute or relative to vite root*/
	configFile?: string;

	/** One or more minimatch patterns */
	include?: Arrayable<string>;

	/** One or more minimatch patterns */
	exclude?: Arrayable<string>;

	/**
	 * By default, all ".svelte" files are compiled
	 * @default ['.svelte']
	 */
	extensions?: string[];

	/**
	 * Optionally, preprocess components with svelte.preprocess:
	 * \@see https://svelte.dev/docs#svelte_preprocess
	 */
	preprocess?: Arrayable<PreprocessorGroup>;

	/** Emit Svelte styles as virtual CSS files for other plugins to process.
	 * @default true
	 */
	emitCss?: boolean;

	/** Options passed to `svelte.compile` method. */
	compilerOptions: Partial<CompileOptions>;

	/**
	 * custom warning handler for svelte compiler warnings
	 */
	onwarn?: (warning: Warning, defaultHandler?: (warning: Warning) => void) => void;

	/**
	 * enable/disable hmr. You want this enabled.
	 *
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 * DO NOT CUSTOMIZE SVELTE-HMR OPTIONS UNLESS YOU KNOW EXACTLY WHAT YOU ARE DOING
	 *
	 *                             YOU HAVE BEEN WARNED
	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 *
	 * @default true for development, always false for production
	 */
	hot?:
		| undefined
		| boolean
		| {
				// svelte-hmr options
				/**
				 * preserve all local state
				 * @default false
				 */
				preserveLocalState?: boolean;

				/**
				 * escape hatchs from preservation of local state
				 * disable preservation of state for this component
				 *
				 * @default ['\@hmr:reset', '\@!hmr']
				 */
				noPreserveStateKey?: string[];

				/**
				 * enable preservation of state for all variables in this component
				 *
				 * @default '\@hmr:keep-all'
				 */
				preserveAllLocalStateKey?: string;

				/**
				 * enable preservation of state for a given variable (must be inline or
				 * above the target variable or variables; can be repeated)
				 *
				 * @default '\@hmr:keep'
				 */
				preserveLocalStateKey?: string;

				/**
				 * don't reload on fatal error
				 *
				 * @default false
				 */
				noReload?: boolean;

				/**
				 * try to recover after runtime errors during component init
				 *
				 * @default true
				 */
				optimistic?: boolean;
				/**
				 * auto accept modules of components that have named exports (i.e. exports
				 * from context="module")
				 *
				 * @default true
				 */
				acceptNamedExports?: boolean;

				/**
				 * auto accept modules of components have accessors (either accessors compile
				 * option, or \<svelte:option accessors=\{true\} /\>) -- this means that if you
				 * set accessors compile option globally, you must also set this option to
				 * true, or no component will be hot reloaded (but there are a lot of edge
				 * cases that HMR can't support correctly with accessors)
				 *
				 * @default true
				 */
				acceptAccessors?: boolean;

				/**
				 * only inject CSS instead of recreating components when only CSS changes
				 *
				 * @default true, but vite-plugin-svelte configures this automatically according to emitCss requirements
				 */
				injectCss?: boolean;

				/**
				 * to mitigate FOUC between dispose (remove stylesheet) and accept
				 *
				 * note: has no effect when emitCss is true (vite-plugin-svelte default)
				 * @default 100
				 */
				cssEjectDelay?: number;

				//
				/**
				 * Svelte Native mode
				 *
				 * @default false
				 */
				native?: boolean;

				/**
				 * name of the adapter import binding
				 *
				 * @default '___SVELTE_HMR_HOT_API_PROXY_ADAPTER'
				 */
				importAdapterName?: string;
				/**
				 * use absolute file paths to import runtime deps of svelte-hmr
				 * (see https://github.com/rixo/svelte-hmr/issues/11)
				 *
				 * @default true
				 */
				absoluteImports?: boolean;

				/**
				 * disable runtime error overlay
				 *
				 * @default false
				 */
				noOverlay?: boolean;

				/**
				 * custom import path for hotApi
				 */
				hotApi?: string;
				/**
				 * custom path for adapter
				 */
				adapter?: string;
		  };
	/**
	 * disable separate hmr update for css files via vite
	 * @default false
	 */
	disableCssHmr?: boolean;

	/**
	 * use vite as extra css preprocessor EXPERIMENTAL!
	 * @default false
	 */
	useVitePreprocess?: boolean;
}

export interface ResolvedOptions extends Options {
	root: string;
	isProduction: boolean;
	isBuild?: boolean;
	isServe?: boolean;
	server?: ViteDevServer;
}

// TODO import from appropriate places
export declare type ModuleFormat = 'esm' | 'cjs';

export interface CompileOptions {
	format?: ModuleFormat;
	name?: string;
	filename?: string;
	generate?: 'dom' | 'ssr' | false;
	sourcemap?: object | string;
	outputFilename?: string;
	cssOutputFilename?: string;
	sveltePath?: string;
	dev?: boolean;
	accessors?: boolean;
	immutable?: boolean;
	hydratable?: boolean;
	legacy?: boolean;
	customElement?: boolean;
	tag?: string;
	css?: boolean;
	loopGuardTimeout?: number;
	namespace?: string;
	preserveComments?: boolean;
	preserveWhitespace?: boolean;
	cssHash?: CssHashGetter;
}

export interface Processed {
	code: string;
	map?: string | object;
	dependencies?: string[];
	toString?: () => string;
}

export declare type CssHashGetter = (args: {
	name: string;
	filename: string | undefined;
	css: string;
	hash: (input: string) => string;
}) => string;

export declare type MarkupPreprocessor = (options: {
	content: string;
	filename: string;
}) => Processed | Promise<Processed>;

export declare type Preprocessor = (options: {
	content: string;
	attributes: Record<string, string | boolean>;
	filename?: string;
}) => Processed | Promise<Processed>;

export interface PreprocessorGroup {
	markup?: MarkupPreprocessor;
	style?: Preprocessor;
	script?: Preprocessor;
}

export type Arrayable<T> = T | T[];

export interface Warning {
	start?: {
		line: number;
		column: number;
		pos?: number;
	};
	end?: {
		line: number;
		column: number;
	};
	pos?: number;
	code: string;
	message: string;
	filename?: string;
	frame?: string;
	toString: () => string;
}
