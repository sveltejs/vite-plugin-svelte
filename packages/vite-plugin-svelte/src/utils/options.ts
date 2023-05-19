/* eslint-disable no-unused-vars */
import { normalizePath } from 'vite';
import { isDebugNamespaceEnabled, log } from './log';
import { loadSvelteConfig } from './load-svelte-config';
import {
	SVELTE_EXPORT_CONDITIONS,
	SVELTE_HMR_IMPORTS,
	SVELTE_IMPORTS,
	SVELTE_RESOLVE_MAIN_FIELDS,
	VITE_RESOLVE_MAIN_FIELDS
} from './constants';

import path from 'path';
import { esbuildSveltePlugin, facadeEsbuildSveltePluginName } from './esbuild';
import { addExtraPreprocessors } from './preprocess';
import deepmerge from 'deepmerge';
import {
	crawlFrameworkPkgs,
	isDepExcluded,
	isDepExternaled,
	isDepIncluded,
	isDepNoExternaled
	// eslint-disable-next-line node/no-missing-import
} from 'vitefu';

import { isCommonDepWithoutSvelteField } from './dependencies';
import { VitePluginSvelteStats } from './vite-plugin-svelte-stats.js';
import { VitePluginSvelteCache } from './vite-plugin-svelte-cache.js';

const allowedPluginOptions = new Set([
	'include',
	'exclude',
	'emitCss',
	'hot',
	'ignorePluginPreprocessors',
	'disableDependencyReinclusion',
	'prebundleSvelteLibraries',
	'inspector',
	'experimental'
]);

const knownRootOptions = new Set(['extensions', 'compilerOptions', 'preprocess', 'onwarn']);

const allowedInlineOptions = new Set(['configFile', ...allowedPluginOptions, ...knownRootOptions]);

/**
 *
 * @param {Partial<import('./options.d').Options>=} inlineOptions
 */
export function validateInlineOptions(inlineOptions) {
	const invalidKeys = Object.keys(inlineOptions || {}).filter(
		(key) => !allowedInlineOptions.has(key)
	);
	if (invalidKeys.length) {
		log.warn(`invalid plugin options "${invalidKeys.join(', ')}" in inline config`, inlineOptions);
	}
}
/**
 *
 * @param {Partial<import('./options.d').SvelteOptions>=} config
 * @returns {Partial<import('./options.d').Options> | undefined}
 */
function convertPluginOptions(config) {
	if (!config) {
		return;
	}
	const invalidRootOptions = Object.keys(config).filter((key) => allowedPluginOptions.has(key));
	if (invalidRootOptions.length > 0) {
		throw new Error(
			`Invalid options in svelte config. Move the following options into 'vitePlugin:{...}': ${invalidRootOptions.join(
				', '
			)}`
		);
	}
	if (!config.vitePlugin) {
		return config;
	}
	const pluginOptions = config.vitePlugin;
	const pluginOptionKeys = Object.keys(pluginOptions);

	const rootOptionsInPluginOptions = pluginOptionKeys.filter((key) => knownRootOptions.has(key));
	if (rootOptionsInPluginOptions.length > 0) {
		throw new Error(
			`Invalid options in svelte config under vitePlugin:{...}', move them to the config root : ${rootOptionsInPluginOptions.join(
				', '
			)}`
		);
	}
	const duplicateOptions = pluginOptionKeys.filter((key) =>
		Object.prototype.hasOwnProperty.call(config, key)
	);
	if (duplicateOptions.length > 0) {
		throw new Error(
			`Invalid duplicate options in svelte config under vitePlugin:{...}', they are defined in root too and must only exist once: ${duplicateOptions.join(
				', '
			)}`
		);
	}
	const unknownPluginOptions = pluginOptionKeys.filter((key) => !allowedPluginOptions.has(key));
	if (unknownPluginOptions.length > 0) {
		log.warn(
			`ignoring unknown plugin options in svelte config under vitePlugin:{...}: ${unknownPluginOptions.join(
				', '
			)}`
		);
		unknownPluginOptions.forEach((unkownOption) => {
			// @ts-ignore
			delete pluginOptions[unkownOption];
		});
	}
	/** @type {import('./options.d').Options} */
	const result = {
		...config,
		...pluginOptions
	};
	// @ts-expect-error it exists
	delete result.vitePlugin;

	return result;
}

/**
 * used in config phase, merges the default options, svelte config, and inline options
 * @param {Partial<import('./options.d').Options> | undefined} inlineOptions
 * @param {import('vite').UserConfig} viteUserConfig
 * @param {import('vite').ConfigEnv} viteEnv
 * @returns {Promise<import('./options.d').PreResolvedOptions>}
 */
export async function preResolveOptions(inlineOptions, viteUserConfig, viteEnv) {
	if (!inlineOptions) {
		inlineOptions = {};
	}
	/** @type {import('vite').UserConfig} */
	const viteConfigWithResolvedRoot = {
		...viteUserConfig,
		root: resolveViteRoot(viteUserConfig)
	};
	const isBuild = viteEnv.command === 'build';
	/** @type {Partial<import('./options.d').PreResolvedOptions>} */
	const defaultOptions = {
		extensions: ['.svelte'],
		emitCss: true,
		prebundleSvelteLibraries: !isBuild
	};
	const svelteConfig = convertPluginOptions(
		await loadSvelteConfig(viteConfigWithResolvedRoot, inlineOptions)
	);
	/** @type {Partial<import('./options.d').PreResolvedOptions>} */
	const extraOptions = {
		root: viteConfigWithResolvedRoot.root,
		isBuild,
		isServe: viteEnv.command === 'serve',
		isDebug: process.env.DEBUG != null
	};

	const merged = /** @type {import('./options.d').PreResolvedOptions}*/ mergeConfigs(
		defaultOptions,
		svelteConfig,
		inlineOptions,
		extraOptions
	);
	// configFile of svelteConfig contains the absolute path it was loaded from,
	// prefer it over the possibly relative inline path
	if (svelteConfig?.configFile) {
		merged.configFile = svelteConfig.configFile;
	}
	return merged;
}

/**
 * @template T
 * @param  {(Partial<T> | undefined)[]} configs
 * @returns T
 */
function mergeConfigs(...configs) {
	/** @type {Partial<T>} */
	let result = {};
	for (const config of configs.filter((x) => x != null)) {
		result = deepmerge(result, /**@type {Partial<T>} */ config, {
			// replace arrays
			arrayMerge: (target, source) => source ?? target
		});
	}
	return /** @type {T} */ result;
}

/**
 * used in configResolved phase, merges a contextual default config, pre-resolved options, and some preprocessors. also validates the final config.
 *
 * @param {import('./options.d').PreResolvedOptions} preResolveOptions
 * @param {import('vite').ResolvedConfig} viteConfig
 * @param {VitePluginSvelteCache} cache
 * @returns {import('./options.d').ResolvedOptions}
 */
export function resolveOptions(preResolveOptions, viteConfig, cache) {
	const css = preResolveOptions.emitCss ? 'external' : 'injected';
	/** @type {Partial<import('./options.d').Options>} */
	const defaultOptions = {
		hot: viteConfig.isProduction
			? false
			: {
					injectCss: css === 'injected',
					partialAccept: !!viteConfig.experimental?.hmrPartialAccept
			  },
		compilerOptions: {
			css,
			dev: !viteConfig.isProduction
		}
	};
	/** @type {Partial<import('./options.d').ResolvedOptions>} */
	const extraOptions = {
		root: viteConfig.root,
		isProduction: viteConfig.isProduction
	};
	const merged = mergeConfigs(defaultOptions, preResolveOptions, extraOptions);

	removeIgnoredOptions(merged);
	handleDeprecatedOptions(merged);
	addExtraPreprocessors(merged, viteConfig);
	enforceOptionsForHmr(merged);
	enforceOptionsForProduction(merged);
	// mergeConfigs would mangle functions on the stats class, so do this afterwards
	if (log.debug.enabled && isDebugNamespaceEnabled('stats')) {
		merged.stats = new VitePluginSvelteStats(cache);
	}
	return merged;
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
			const css = options.compilerOptions.css;
			if (css === true || css === 'injected') {
				const forcedCss = 'external';
				log.warn(
					`hmr and emitCss are enabled but compilerOptions.css is ${css}, forcing it to ${forcedCss}`
				);
				options.compilerOptions.css = forcedCss;
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
			const css = options.compilerOptions.css;
			if (!(css === true || css === 'injected')) {
				const forcedCss = 'injected';
				log.warn(
					`hmr with emitCss disabled requires compilerOptions.css to be enabled, forcing it to ${forcedCss}`
				);
				options.compilerOptions.css = forcedCss;
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

function removeIgnoredOptions(options: ResolvedOptions) {
	const ignoredCompilerOptions = ['generate', 'format', 'filename'];
	if (options.hot && options.emitCss) {
		ignoredCompilerOptions.push('cssHash');
	}
	const passedCompilerOptions = Object.keys(options.compilerOptions || {});
	const passedIgnored = passedCompilerOptions.filter((o) => ignoredCompilerOptions.includes(o));
	if (passedIgnored.length) {
		log.warn(
			`The following Svelte compilerOptions are controlled by vite-plugin-svelte and essential to its functionality. User-specified values are ignored. Please remove them from your configuration: ${passedIgnored.join(
				', '
			)}`
		);
		passedIgnored.forEach((ignored) => {
			// @ts-expect-error string access
			delete options.compilerOptions[ignored];
		});
	}
}

function handleDeprecatedOptions(options: ResolvedOptions) {
	const experimental = options.experimental as any;
	if (experimental) {
		for (const promoted of ['prebundleSvelteLibraries', 'inspector']) {
			if (experimental[promoted]) {
				//@ts-expect-error untyped assign
				options[promoted] = experimental[promoted];
				delete experimental[promoted];
				log.warn(
					`Option "vitePlugin.experimental.${promoted}" is no longer experimental and has moved to "vitePlugin.${promoted}". Please update your svelte config.`
				);
			}
		}
		if (experimental.generateMissingPreprocessorSourcemaps) {
			log.warn('experimental.generateMissingPreprocessorSourcemaps has been removed.');
		}
	}
}

// vite passes unresolved `root`option to config hook but we need the resolved value, so do it here
// https://github.com/sveltejs/vite-plugin-svelte/issues/113
// https://github.com/vitejs/vite/blob/43c957de8a99bb326afd732c962f42127b0a4d1e/packages/vite/src/node/config.ts#L293
function resolveViteRoot(viteConfig: UserConfig): string | undefined {
	return normalizePath(viteConfig.root ? path.resolve(viteConfig.root) : process.cwd());
}

export async function buildExtraViteConfig(
	options: PreResolvedOptions,
	config: UserConfig
): Promise<Partial<UserConfig>> {
	// make sure we only readd vite default mainFields when no other plugin has changed the config already
	// see https://github.com/sveltejs/vite-plugin-svelte/issues/581
	if (!config.resolve) {
		config.resolve = {};
	}
	config.resolve.mainFields = [
		...SVELTE_RESOLVE_MAIN_FIELDS,
		...(config.resolve.mainFields ?? VITE_RESOLVE_MAIN_FIELDS)
	];

	const extraViteConfig: Partial<UserConfig> = {
		resolve: {
			dedupe: [...SVELTE_IMPORTS, ...SVELTE_HMR_IMPORTS],
			conditions: [...SVELTE_EXPORT_CONDITIONS]
		}
		// this option is still awaiting a PR in vite to be supported
		// see https://github.com/sveltejs/vite-plugin-svelte/issues/60
		// @ts-ignore
		// knownJsSrcExtensions: options.extensions
	};

	const extraSvelteConfig = buildExtraConfigForSvelte(config);
	const extraDepsConfig = await buildExtraConfigForDependencies(options, config);
	// merge extra svelte and deps config, but make sure dep values are not contradicting svelte
	extraViteConfig.optimizeDeps = {
		include: [
			...extraSvelteConfig.optimizeDeps.include,
			...extraDepsConfig.optimizeDeps.include.filter(
				(dep) => !isDepExcluded(dep, extraSvelteConfig.optimizeDeps.exclude)
			)
		],
		exclude: [
			...extraSvelteConfig.optimizeDeps.exclude,
			...extraDepsConfig.optimizeDeps.exclude.filter(
				(dep) => !isDepIncluded(dep, extraSvelteConfig.optimizeDeps.include)
			)
		]
	};

	extraViteConfig.ssr = {
		external: [
			...extraSvelteConfig.ssr.external,
			...extraDepsConfig.ssr.external.filter(
				(dep) => !isDepNoExternaled(dep, extraSvelteConfig.ssr.noExternal)
			)
		],
		noExternal: [
			...extraSvelteConfig.ssr.noExternal,
			...extraDepsConfig.ssr.noExternal.filter(
				(dep) => !isDepExternaled(dep, extraSvelteConfig.ssr.external)
			)
		]
	};

	// handle prebundling for svelte files
	if (options.prebundleSvelteLibraries) {
		extraViteConfig.optimizeDeps = {
			...extraViteConfig.optimizeDeps,
			// Experimental Vite API to allow these extensions to be scanned and prebundled
			// @ts-ignore
			extensions: options.extensions ?? ['.svelte'],
			// Add esbuild plugin to prebundle Svelte files.
			// Currently a placeholder as more information is needed after Vite config is resolved,
			// the real Svelte plugin is added in `patchResolvedViteConfig()`
			esbuildOptions: {
				plugins: [{ name: facadeEsbuildSveltePluginName, setup: () => {} }]
			}
		};
	}

	// enable hmrPartialAccept if not explicitly disabled
	if (
		(options.hot == null ||
			options.hot === true ||
			(options.hot && options.hot.partialAccept !== false)) && // deviate from svelte-hmr, default to true
		config.experimental?.hmrPartialAccept !== false
	) {
		log.debug('enabling "experimental.hmrPartialAccept" in vite config');
		extraViteConfig.experimental = { hmrPartialAccept: true };
	}
	validateViteConfig(extraViteConfig, config, options);
	return extraViteConfig;
}

function validateViteConfig(
	extraViteConfig: Partial<UserConfig>,
	config: UserConfig,
	options: PreResolvedOptions
) {
	const { prebundleSvelteLibraries, isBuild } = options;
	if (prebundleSvelteLibraries) {
		const isEnabled = (option: 'dev' | 'build' | boolean) =>
			option !== true && option !== (isBuild ? 'build' : 'dev');
		const logWarning = (name: string, value: 'dev' | 'build' | boolean, recommendation: string) =>
			log.warn.once(
				`Incompatible options: \`prebundleSvelteLibraries: true\` and vite \`${name}: ${JSON.stringify(
					value
				)}\` ${isBuild ? 'during build.' : '.'} ${recommendation}`
			);
		const viteOptimizeDepsDisabled = config.optimizeDeps?.disabled ?? 'build'; // fall back to vite default
		const isOptimizeDepsEnabled = isEnabled(viteOptimizeDepsDisabled);
		if (!isBuild && !isOptimizeDepsEnabled) {
			logWarning(
				'optimizeDeps.disabled',
				viteOptimizeDepsDisabled,
				'Forcing `optimizeDeps.disabled: "build"`. Disable prebundleSvelteLibraries or update your vite config to enable optimizeDeps during dev.'
			);
			extraViteConfig.optimizeDeps!.disabled = 'build';
		} else if (isBuild && isOptimizeDepsEnabled) {
			logWarning(
				'optimizeDeps.disabled',
				viteOptimizeDepsDisabled,
				'Disable optimizeDeps or prebundleSvelteLibraries for build if you experience errors.'
			);
		}
	}
}

async function buildExtraConfigForDependencies(options: PreResolvedOptions, config: UserConfig) {
	// extra handling for svelte dependencies in the project
	const depsConfig = await crawlFrameworkPkgs({
		root: options.root,
		isBuild: options.isBuild,
		viteUserConfig: config,
		isFrameworkPkgByJson(pkgJson) {
			let hasSvelteCondition = false;
			if (typeof pkgJson.exports === 'object') {
				// use replacer as a simple way to iterate over nested keys
				JSON.stringify(pkgJson.exports, (key, value) => {
					if (SVELTE_EXPORT_CONDITIONS.includes(key)) {
						hasSvelteCondition = true;
					}
					return value;
				});
			}
			return hasSvelteCondition || !!pkgJson.svelte;
		},
		isSemiFrameworkPkgByJson(pkgJson) {
			return !!pkgJson.dependencies?.svelte || !!pkgJson.peerDependencies?.svelte;
		},
		isFrameworkPkgByName(pkgName) {
			const isNotSveltePackage = isCommonDepWithoutSvelteField(pkgName);
			if (isNotSveltePackage) {
				return false;
			} else {
				return undefined;
			}
		}
	});

	log.debug('extra config for dependencies generated by vitefu', depsConfig);

	if (options.prebundleSvelteLibraries) {
		// prebundling enabled, so we don't need extra dependency excludes
		depsConfig.optimizeDeps.exclude = [];
		// but keep dependency reinclusions of explicit user excludes
		const userExclude = config.optimizeDeps?.exclude;
		depsConfig.optimizeDeps.include = !userExclude
			? []
			: depsConfig.optimizeDeps.include.filter((dep: string) => {
					// reincludes look like this: foo > bar > baz
					// in case foo or bar are excluded, we have to retain the reinclude even with prebundling
					return (
						dep.includes('>') &&
						dep
							.split('>')
							.slice(0, -1)
							.some((d) => isDepExcluded(d.trim(), userExclude))
					);
			  });
	}
	if (options.disableDependencyReinclusion === true) {
		depsConfig.optimizeDeps.include = depsConfig.optimizeDeps.include.filter(
			(dep) => !dep.includes('>')
		);
	} else if (Array.isArray(options.disableDependencyReinclusion)) {
		const disabledDeps = options.disableDependencyReinclusion;
		depsConfig.optimizeDeps.include = depsConfig.optimizeDeps.include.filter((dep) => {
			if (!dep.includes('>')) return true;
			const trimDep = dep.replace(/\s+/g, '');
			return disabledDeps.some((disabled) => trimDep.includes(`${disabled}>`));
		});
	}

	log.debug('post-processed extra config for dependencies', depsConfig);

	return depsConfig;
}

function buildExtraConfigForSvelte(config: UserConfig) {
	// include svelte imports for optimization unless explicitly excluded
	const include: string[] = [];
	const exclude: string[] = ['svelte-hmr'];
	if (!isDepExcluded('svelte', config.optimizeDeps?.exclude ?? [])) {
		const svelteImportsToInclude = SVELTE_IMPORTS.filter((x) => x !== 'svelte/ssr'); // not used on clientside
		log.debug(
			`adding bare svelte packages to optimizeDeps.include: ${svelteImportsToInclude.join(', ')} `
		);
		include.push(...svelteImportsToInclude);
	} else {
		log.debug('"svelte" is excluded in optimizeDeps.exclude, skipped adding it to include.');
	}
	const noExternal: (string | RegExp)[] = [];
	const external: string[] = [];
	// add svelte to ssr.noExternal unless it is present in ssr.external
	// so we can resolve it with svelte/ssr
	if (!isDepExternaled('svelte', config.ssr?.external ?? [])) {
		noExternal.push('svelte', /^svelte\//);
	}
	return { optimizeDeps: { include, exclude }, ssr: { noExternal, external } };
}

export function patchResolvedViteConfig(viteConfig: ResolvedConfig, options: ResolvedOptions) {
	if (options.preprocess) {
		for (const preprocessor of arraify(options.preprocess)) {
			if (preprocessor.style && '__resolvedConfig' in preprocessor.style) {
				preprocessor.style.__resolvedConfig = viteConfig;
			}
		}
	}

	// replace facade esbuild plugin with a real one
	const facadeEsbuildSveltePlugin = viteConfig.optimizeDeps.esbuildOptions?.plugins?.find(
		(plugin) => plugin.name === facadeEsbuildSveltePluginName
	);
	if (facadeEsbuildSveltePlugin) {
		Object.assign(facadeEsbuildSveltePlugin, esbuildSveltePlugin(options));
	}
}

function arraify<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}
