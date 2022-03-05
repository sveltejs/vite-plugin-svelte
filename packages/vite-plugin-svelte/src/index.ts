import fs from 'fs';
import { HmrContext, ModuleNode, Plugin, ResolvedConfig, UserConfig } from 'vite';
import { handleHotUpdate } from './handle-hot-update';
import { log, logCompilerWarnings } from './utils/log';
import { CompileData, createCompileSvelte } from './utils/compile';
import { buildIdParser, IdParser, SvelteRequest } from './utils/id';
import {
	buildExtraViteConfig,
	validateInlineOptions,
	Options,
	ResolvedOptions,
	resolveOptions,
	patchResolvedViteConfig,
	preResolveOptions
} from './utils/options';
import { VitePluginSvelteCache } from './utils/vite-plugin-svelte-cache';

import { ensureWatchedFile, setupWatchers } from './utils/watch';
import { resolveViaPackageJsonSvelte } from './utils/resolve';
import { PartialResolvedId } from 'rollup';
import { toRollupError } from './utils/error';
import { handleOptimizeDeps } from './utils/optimizer';

export function svelte(inlineOptions?: Partial<Options>): Plugin {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	validateInlineOptions(inlineOptions);
	const cache = new VitePluginSvelteCache();
	// updated in configResolved hook
	let requestParser: IdParser;
	let options: ResolvedOptions;
	let viteConfig: ResolvedConfig;
	/* eslint-disable no-unused-vars */
	let compileSvelte: (
		svelteRequest: SvelteRequest,
		code: string,
		options: Partial<ResolvedOptions>
	) => Promise<CompileData>;
	/* eslint-enable no-unused-vars */

	let resolvedSvelteSSR: Promise<PartialResolvedId | null>;

	return {
		name: 'vite-plugin-svelte',
		// make sure our resolver runs before vite internal resolver to resolve svelte field correctly
		enforce: 'pre',
		async config(config, configEnv): Promise<Partial<UserConfig>> {
			// setup logger
			if (process.env.DEBUG) {
				log.setLevel('debug');
			} else if (config.logLevel) {
				log.setLevel(config.logLevel);
			}
			// @ts-expect-error temporarily lend the options variable until fixed in configResolved
			options = await preResolveOptions(inlineOptions, config, configEnv);
			// extra vite config
			const extraViteConfig = buildExtraViteConfig(options, config, configEnv);
			log.debug('additional vite config', extraViteConfig);
			return extraViteConfig;
		},

		async configResolved(config) {
			options = resolveOptions(options, config);
			patchResolvedViteConfig(config, options);
			requestParser = buildIdParser(options);
			compileSvelte = createCompileSvelte(options);
			viteConfig = config;
			log.debug('resolved options', options);
		},

		async buildStart() {
			await handleOptimizeDeps(options, viteConfig);
		},

		configureServer(server) {
			// eslint-disable-next-line no-unused-vars
			options.server = server;
			setupWatchers(options, cache, requestParser);
		},

		load(id, opts) {
			// @ts-expect-error anticipate vite changing second parameter as options object
			// see https://github.com/vitejs/vite/discussions/5109
			const ssr: boolean = opts === true || opts?.ssr;
			const svelteRequest = requestParser(id, !!ssr);
			if (svelteRequest) {
				const { filename, query } = svelteRequest;
				// virtual css module
				if (query.svelte && query.type === 'style') {
					const css = cache.getCSS(svelteRequest);
					if (css) {
						log.debug(`load returns css for ${filename}`);
						return css;
					}
				}
				// prevent vite asset plugin from loading files as url that should be compiled in transform
				if (viteConfig.assetsInclude(filename)) {
					log.debug(`load returns raw content for ${filename}`);
					return fs.readFileSync(filename, 'utf-8');
				}
			}
		},

		async resolveId(importee, importer, opts) {
			const ssr = !!opts?.ssr;
			const svelteRequest = requestParser(importee, ssr);
			if (svelteRequest?.query.svelte) {
				if (svelteRequest.query.type === 'style') {
					// return cssId with root prefix so postcss pipeline of vite finds the directory correctly
					// see https://github.com/sveltejs/vite-plugin-svelte/issues/14
					log.debug(`resolveId resolved virtual css module ${svelteRequest.cssId}`);
					return svelteRequest.cssId;
				}
				log.debug(`resolveId resolved ${importee}`);
				return importee; // query with svelte tag, an id we generated, no need for further analysis
			}

			if (ssr && importee === 'svelte') {
				if (!resolvedSvelteSSR) {
					resolvedSvelteSSR = this.resolve('svelte/ssr', undefined, { skipSelf: true }).then(
						(svelteSSR) => {
							log.debug('resolved svelte to svelte/ssr');
							return svelteSSR;
						},
						(err) => {
							log.debug(
								'failed to resolve svelte to svelte/ssr. Update svelte to a version that exports it',
								err
							);
							return null; // returning null here leads to svelte getting resolved regularly
						}
					);
				}
				return resolvedSvelteSSR;
			}
			try {
				const resolved = resolveViaPackageJsonSvelte(importee, importer, cache);
				if (resolved) {
					log.debug(`resolveId resolved ${resolved} via package.json svelte field of ${importee}`);
					return resolved;
				}
			} catch (e) {
				log.debug.once(
					`error trying to resolve ${importee} from ${importer} via package.json svelte field `,
					e
				);
				// this error most likely happens due to non-svelte related importee/importers so swallow it here
				// in case it really way a svelte library, users will notice anyway. (lib not working due to failed resolve)
			}
		},

		async transform(code, id, opts) {
			const ssr = !!opts?.ssr;
			const svelteRequest = requestParser(id, ssr);
			if (!svelteRequest || svelteRequest.query.svelte) {
				return;
			}
			let compileData;
			try {
				compileData = await compileSvelte(svelteRequest, code, options);
			} catch (e) {
				throw toRollupError(e, options);
			}
			logCompilerWarnings(compileData.compiled.warnings, options);
			cache.update(compileData);
			if (compileData.dependencies?.length && options.server) {
				compileData.dependencies.forEach((d) => {
					ensureWatchedFile(options.server!.watcher, d, options.root);
				});
			}
			log.debug(`transform returns compiled js for ${svelteRequest.filename}`);
			return compileData.compiled.js;
		},

		handleHotUpdate(ctx: HmrContext): void | Promise<Array<ModuleNode> | void> {
			if (!options.hot || !options.emitCss) {
				return;
			}
			const svelteRequest = requestParser(ctx.file, false, ctx.timestamp);
			if (svelteRequest) {
				return handleHotUpdate(compileSvelte, ctx, svelteRequest, cache, options);
			}
		}
	};
}

export {
	Options,
	Preprocessor,
	PreprocessorGroup,
	CompileOptions,
	CssHashGetter,
	Arrayable,
	MarkupPreprocessor,
	ModuleFormat,
	Processed,
	Warning
} from './utils/options';
