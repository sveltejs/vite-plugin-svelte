import { HmrContext, IndexHtmlTransformContext, ModuleNode, Plugin, UserConfig } from 'vite';
import { handleHotUpdate } from './handle-hot-update';
import { log, logCompilerWarnings } from './utils/log';
import { CompileData, createCompileSvelte } from './utils/compile';
import { buildIdParser, IdParser, SvelteRequest } from './utils/id';
import {
	validateInlineOptions,
	Options,
	ResolvedOptions,
	resolveOptions,
	PreprocessorGroup
} from './utils/options';
import { VitePluginSvelteCache } from './utils/vite-plugin-svelte-cache';

import { SVELTE_IMPORTS, SVELTE_RESOLVE_MAIN_FIELDS } from './utils/constants';
import { setupWatchers } from './utils/watch';
import { resolveViaPackageJsonSvelte } from './utils/resolve';

// extend the Vite plugin interface to be able to have `sveltePreprocess` injection
declare module 'vite' {
	// eslint-disable-next-line no-unused-vars
	interface Plugin {
		sveltePreprocess?: PreprocessorGroup;
	}
}

export function svelte(inlineOptions?: Partial<Options>): Plugin {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	validateInlineOptions(inlineOptions);
	const cache = new VitePluginSvelteCache();
	const pkg_export_errors = new Set();
	// updated in configResolved hook
	let requestParser: IdParser;
	let options: ResolvedOptions;

	/* eslint-disable no-unused-vars */
	let compileSvelte: (
		svelteRequest: SvelteRequest,
		code: string,
		options: Partial<ResolvedOptions>
	) => Promise<CompileData>;
	/* eslint-enable no-unused-vars */

	return {
		name: 'vite-plugin-svelte',
		// make sure our resolver runs before vite internal resolver to resolve svelte field correctly
		enforce: 'pre',
		config(config): Partial<UserConfig> {
			// setup logger
			if (process.env.DEBUG) {
				log.setLevel('debug');
			} else if (config.logLevel) {
				log.setLevel(config.logLevel);
			}

			// extra vite config
			const extraViteConfig: Partial<UserConfig> = {
				optimizeDeps: {
					exclude: [...SVELTE_IMPORTS]
				},
				resolve: {
					mainFields: [...SVELTE_RESOLVE_MAIN_FIELDS],
					dedupe: [...SVELTE_IMPORTS]
				}
			};
			// needed to transform svelte files with component imports
			// can cause issues with other typescript files, see https://github.com/sveltejs/vite-plugin-svelte/pull/20
			if (inlineOptions?.useVitePreprocess) {
				extraViteConfig.esbuild = {
					tsconfigRaw: {
						compilerOptions: {
							importsNotUsedAsValues: 'preserve'
						}
					}
				};
			}
			log.debug('additional vite config', extraViteConfig);
			return extraViteConfig as Partial<UserConfig>;
		},

		async configResolved(config) {
			options = await resolveOptions(inlineOptions, config);
			requestParser = buildIdParser(options);
			compileSvelte = createCompileSvelte(options);
		},

		configureServer(server) {
			// eslint-disable-next-line no-unused-vars
			options.server = server;
			setupWatchers(server, cache, requestParser);
		},

		load(id, ssr) {
			const svelteRequest = requestParser(id, !!ssr);
			if (!svelteRequest) {
				return;
			}

			log.debug('load', svelteRequest);
			const { filename, query } = svelteRequest;

			//
			if (query.svelte) {
				if (query.type === 'style') {
					const css = cache.getCSS(svelteRequest);
					if (css) {
						log.debug(`load returns css for ${filename}`);
						return css;
					}
				}
			}
		},

		async resolveId(importee, importer, customOptions, ssr) {
			const svelteRequest = requestParser(importee, !!ssr);
			log.debug('resolveId', svelteRequest || importee);
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

			try {
				const resolved = resolveViaPackageJsonSvelte(importee, importer);
				if (resolved) {
					log.debug(`resolveId resolved ${resolved} via package.json svelte field of ${importee}`);
					return resolved;
				}
			} catch (err) {
				switch (err.code) {
					case 'ERR_PACKAGE_PATH_NOT_EXPORTED':
						pkg_export_errors.add(importee);
						return null;
					case 'MODULE_NOT_FOUND':
						return null;
					default:
						throw err;
				}
			}
		},

		async transform(code, id, ssr) {
			const svelteRequest = requestParser(id, !!ssr);
			if (!svelteRequest) {
				return;
			}
			log.debug('transform', svelteRequest);
			const { filename, query } = svelteRequest;

			if (query.svelte) {
				if (query.type === 'style') {
					const css = cache.getCSS(svelteRequest);
					if (css) {
						log.debug(`transform returns css for ${filename}`);
						return css; // TODO return code arg instead? it's the code from load hook.
					}
				}
				log.error('failed to transform tagged svelte request', svelteRequest);
				throw new Error(`failed to transform tagged svelte request for id ${id}`);
			}
			const compileData = await compileSvelte(svelteRequest, code, options);
			logCompilerWarnings(compileData.compiled.warnings, options);
			cache.update(compileData);
			if (compileData.dependencies?.length && options.server) {
				compileData.dependencies.forEach((d) => this.addWatchFile(d));
			}
			log.debug(`transform returns compiled js for ${filename}`);
			return compileData.compiled.js;
		},

		handleHotUpdate(ctx: HmrContext): void | Promise<Array<ModuleNode> | void> {
			if (!options.emitCss || options.disableCssHmr) {
				return;
			}
			const svelteRequest = requestParser(ctx.file, false, ctx.timestamp);
			if (!svelteRequest) {
				return;
			}
			log.debug('handleHotUpdate', svelteRequest);
			return handleHotUpdate(compileSvelte, ctx, svelteRequest, cache, options);
		},

		// eslint-disable-next-line no-unused-vars
		transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
			// TODO useful for ssr? and maybe svelte:head stuff
			log.debug('transformIndexHtml', html);
		},
		/**
		 * All resolutions done; display warnings wrt `package.json` access.
		 */
		// TODO generateBundle isn't called by vite, is buildEnd enough or should it be logged once per violation in resolve
		buildEnd() {
			if (pkg_export_errors.size > 0) {
				log.warn(
					`The following packages did not export their \`package.json\` file so we could not check the "svelte" field. If you had difficulties importing svelte components from a package, then please contact the author and ask them to export the package.json file.`,
					Array.from(pkg_export_errors, (s) => `- ${s}`).join('\n')
				);
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
