import fs from 'node:fs';
import process from 'node:process';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';
import { handleHotUpdate } from './handle-hot-update.js';
import { log, logCompilerWarnings } from './utils/log.js';
import { createCompileSvelte } from './utils/compile.js';
import {
	buildIdFilter,
	buildIdParser,
	buildModuleIdFilter,
	buildModuleIdParser
} from './utils/id.js';
import {
	buildExtraViteConfig,
	validateInlineOptions,
	resolveOptions,
	patchResolvedViteConfig,
	preResolveOptions,
	ensureConfigEnvironmentMainFields,
	ensureConfigEnvironmentConditions
} from './utils/options.js';
import { ensureWatchedFile, setupWatchers } from './utils/watch.js';
import { toRollupError } from './utils/error.js';
import { saveSvelteMetadata } from './utils/optimizer.js';
import { VitePluginSvelteCache } from './utils/vite-plugin-svelte-cache.js';
import { loadRaw } from './utils/load-raw.js';
import * as svelteCompiler from 'svelte/compiler';
import { SVELTE_VIRTUAL_STYLE_ID_REGEX } from './utils/constants.js';
import * as vite from 'vite';
// @ts-expect-error rolldownVersion
const { version: viteVersion, rolldownVersion } = vite;

/**
 * @param {Partial<import('./public.d.ts').Options>} [inlineOptions]
 * @returns {import('vite').Plugin[]}
 */
export function svelte(inlineOptions) {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	if (rolldownVersion) {
		log.warn.once('!!! Support for rolldown-vite in vite-plugin-svelte is experimental !!!', {
			rolldownVersion,
			viteVersion
		});
	}

	validateInlineOptions(inlineOptions);
	const cache = new VitePluginSvelteCache();
	// updated in configResolved hook
	/** @type {import('./types/id.d.ts').IdParser} */
	let requestParser;
	/** @type {import('./types/id.d.ts').ModuleIdParser} */
	let moduleRequestParser;
	/** @type {import('./types/options.d.ts').ResolvedOptions} */
	let options;
	/** @type {import('vite').ResolvedConfig} */
	let viteConfig;
	/** @type {import('./types/compile.d.ts').CompileSvelte} */
	let compileSvelte;

	/** @type {import('vite').Plugin} */
	const compilePlugin = {
		name: 'vite-plugin-svelte',
		// make sure our resolver runs before vite internal resolver to resolve svelte field correctly
		enforce: 'pre',
		/** @type {import('./types/plugin-api.d.ts').PluginAPI} */
		api: {},
		async config(config, configEnv) {
			// setup logger
			if (process.env.DEBUG) {
				log.setLevel('debug');
			} else if (config.logLevel) {
				log.setLevel(config.logLevel);
			}
			// @ts-expect-error temporarily lend the options variable until fixed in configResolved
			options = await preResolveOptions(inlineOptions, config, configEnv);
			// extra vite config
			const extraViteConfig = await buildExtraViteConfig(options, config);
			log.debug('additional vite config', extraViteConfig, 'config');
			return extraViteConfig;
		},

		configEnvironment(name, config, opts) {
			ensureConfigEnvironmentMainFields(name, config, opts);
			// @ts-expect-error the function above should make `resolve.mainFields` non-nullable
			config.resolve.mainFields.unshift('svelte');

			ensureConfigEnvironmentConditions(name, config, opts);
			// @ts-expect-error the function above should make `resolve.conditions` non-nullable
			config.resolve.conditions.push('svelte');
		},

		async configResolved(config) {
			options = resolveOptions(options, config, cache);
			patchResolvedViteConfig(config, options);
			const filter = buildIdFilter(options);
			//@ts-expect-error transform defined below but filter not in type
			compilePlugin.transform.filter = filter;
			//@ts-expect-error load defined below but filter not in type
			compilePlugin.load.filter = filter;

			requestParser = buildIdParser(options);
			compileSvelte = createCompileSvelte();
			viteConfig = config;
			// TODO deep clone to avoid mutability from outside?
			compilePlugin.api.options = options;
			log.debug('resolved options', options, 'config');
			log.debug('filters', filter, 'config');
		},

		async buildStart() {
			if (!options.prebundleSvelteLibraries) return;
			const isSvelteMetadataChanged = await saveSvelteMetadata(viteConfig.cacheDir, options);
			if (isSvelteMetadataChanged) {
				// Force Vite to optimize again. Although we mutate the config here, it works because
				// Vite's optimizer runs after `buildStart()`.
				viteConfig.optimizeDeps.force = true;
			}
		},

		configureServer(server) {
			options.server = server;
			setupWatchers(options, cache, requestParser);
		},

		load: {
			async handler(id, opts) {
				const ssr = !!opts?.ssr;
				const svelteRequest = requestParser(id, !!ssr);
				if (svelteRequest) {
					const { filename, query, raw } = svelteRequest;
					if (raw) {
						const code = await loadRaw(svelteRequest, compileSvelte, options);
						// prevent vite from injecting sourcemaps in the results.
						return {
							code,
							map: {
								mappings: ''
							}
						};
					} else {
						if (query.svelte && query.type === 'style') {
							const cachedCss = cache.getCSS(svelteRequest);
							if (cachedCss) {
								const { hasGlobal, ...css } = cachedCss;
								if (hasGlobal === false) {
									// hasGlobal was added in svelte 5.26.0, so make sure it is boolean false
									css.meta ??= {};
									css.meta.vite ??= {};
									css.meta.vite.cssScopeTo = [svelteRequest.filename, 'default'];
								}
								css.moduleType = 'css';

								return css;
							}
						}
						// prevent vite asset plugin from loading files as url that should be compiled in transform
						if (viteConfig.assetsInclude(filename)) {
							log.debug(`load returns raw content for ${filename}`, undefined, 'load');
							return fs.readFileSync(filename, 'utf-8');
						}
					}
				}
			}
		},

		resolveId: {
			// we don't use our generic filter here but a reduced one that only matches our virtual css
			filter: { id: SVELTE_VIRTUAL_STYLE_ID_REGEX },
			handler(id) {
				// return cssId with root prefix so postcss pipeline of vite finds the directory correctly
				// see https://github.com/sveltejs/vite-plugin-svelte/issues/14
				log.debug(`resolveId resolved virtual css module ${id}`, undefined, 'resolve');
				// TODO: do we have to repeat the dance for constructing the virtual id here? our transform added it that way
				return id;
			}
		},

		transform: {
			async handler(code, id, opts) {
				const ssr = !!opts?.ssr;
				const svelteRequest = requestParser(id, ssr);
				if (!svelteRequest || svelteRequest.query.type === 'style' || svelteRequest.raw) {
					return;
				}
				let compileData;
				try {
					compileData = await compileSvelte(svelteRequest, code, options);
				} catch (e) {
					cache.setError(svelteRequest, e);
					throw toRollupError(e, options);
				}
				logCompilerWarnings(svelteRequest, compileData.compiled.warnings, options);
				cache.update(compileData);
				if (compileData.dependencies?.length) {
					if (options.server) {
						for (const dep of compileData.dependencies) {
							ensureWatchedFile(options.server.watcher, dep, options.root);
						}
					} else if (options.isBuild && viteConfig.build.watch) {
						for (const dep of compileData.dependencies) {
							this.addWatchFile(dep);
						}
					}
				}
				return {
					...compileData.compiled.js,
					moduleType: 'js',
					meta: {
						vite: {
							lang: compileData.lang
						}
					}
				};
			}
		},

		handleHotUpdate(ctx) {
			if (!options.compilerOptions.hmr || !options.emitCss) {
				return;
			}
			const svelteRequest = requestParser(ctx.file, false, ctx.timestamp);
			if (svelteRequest) {
				return handleHotUpdate(compileSvelte, ctx, svelteRequest, cache, options);
			}
		},
		async buildEnd() {
			await options.stats?.finishAll();
		}
	};

	/** @type {import('vite').Plugin} */
	const moduleCompilePlugin = {
		name: 'vite-plugin-svelte-module',
		enforce: 'post',
		async configResolved() {
			//@ts-expect-error transform defined below but filter not in type
			moduleCompilePlugin.transform.filter = buildModuleIdFilter(options);
			moduleRequestParser = buildModuleIdParser(options);
		},
		transform: {
			async handler(code, id, opts) {
				const ssr = !!opts?.ssr;
				const moduleRequest = moduleRequestParser(id, ssr);
				if (!moduleRequest) {
					return;
				}
				try {
					const compileResult = svelteCompiler.compileModule(code, {
						dev: !viteConfig.isProduction,
						generate: ssr ? 'server' : 'client',
						filename: moduleRequest.filename
					});
					logCompilerWarnings(moduleRequest, compileResult.warnings, options);
					return compileResult.js;
				} catch (e) {
					throw toRollupError(e, options);
				}
			}
		}
	};

	/** @type {import('vite').Plugin[]} */
	const plugins = [compilePlugin, moduleCompilePlugin, svelteInspector()];
	return plugins;
}

export { vitePreprocess } from './preprocess.js';
export { loadSvelteConfig } from './utils/load-svelte-config.js';
