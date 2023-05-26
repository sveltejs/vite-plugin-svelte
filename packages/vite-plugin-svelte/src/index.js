import fs from 'fs';
import { version as viteVersion } from 'vite';

import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';

import { isDepExcluded } from 'vitefu';
import { handleHotUpdate } from './handle-hot-update.js';
import { log, logCompilerWarnings } from './utils/log.js';
import { createCompileSvelte } from './utils/compile.js';
import { buildIdParser } from './utils/id.js';
import {
	buildExtraViteConfig,
	validateInlineOptions,
	resolveOptions,
	patchResolvedViteConfig,
	preResolveOptions
} from './utils/options.js';

import { ensureWatchedFile, setupWatchers } from './utils/watch.js';
import { resolveViaPackageJsonSvelte } from './utils/resolve.js';

import { toRollupError } from './utils/error.js';
import { saveSvelteMetadata } from './utils/optimizer.js';
import { VitePluginSvelteCache } from './utils/vite-plugin-svelte-cache.js';
import { loadRaw } from './utils/load-raw.js';
import { FAQ_LINK_CONFLICTS_IN_SVELTE_RESOLVE } from './utils/constants.js';
import { isSvelte3 } from './utils/svelte-version.js';

const isVite4_0 = viteVersion.startsWith('4.0');

/** @type {import('./index.d.ts').svelte} */
export function svelte(inlineOptions) {
	if (process.env.DEBUG != null) {
		log.setLevel('debug');
	}
	validateInlineOptions(inlineOptions);
	const cache = new VitePluginSvelteCache();
	// updated in configResolved hook
	/** @type {import('./types/id.d.ts').IdParser} */
	let requestParser;
	/** @type {import('./types/options.d.ts').ResolvedOptions} */
	let options;
	/** @type {import('vite').ResolvedConfig} */
	let viteConfig;

	/** @type {import('./types/compile.d.ts').CompileSvelte} */
	let compileSvelte;
	/* eslint-enable no-unused-vars */

	/** @type {Promise<import('vite').Rollup.PartialResolvedId | null>} */
	let resolvedSvelteSSR;
	/** @type {Set<string>} */
	let packagesWithResolveWarnings;
	/** @type {import('./types/plugin-api.d.ts').PluginAPI} */
	const api = {};
	/** @type {import('vite').Plugin[]} */
	const plugins = [
		{
			name: 'vite-plugin-svelte',
			// make sure our resolver runs before vite internal resolver to resolve svelte field correctly
			enforce: 'pre',
			api,
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
				log.debug('additional vite config', extraViteConfig);
				return extraViteConfig;
			},

			async configResolved(config) {
				options = resolveOptions(options, config, cache);
				patchResolvedViteConfig(config, options);
				requestParser = buildIdParser(options);
				compileSvelte = createCompileSvelte(options);
				viteConfig = config;
				// TODO deep clone to avoid mutability from outside?
				api.options = options;
				log.debug('resolved options', options);
			},

			async buildStart() {
				packagesWithResolveWarnings = new Set();
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

			async load(id, opts) {
				const ssr = !!opts?.ssr;
				const svelteRequest = requestParser(id, !!ssr);
				if (svelteRequest) {
					const { filename, query, raw } = svelteRequest;
					if (raw) {
						return loadRaw(svelteRequest, compileSvelte, options);
					} else {
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
				}
			},

			async resolveId(importee, importer, opts) {
				const ssr = !!opts?.ssr;
				const svelteRequest = requestParser(importee, ssr);
				if (svelteRequest?.query.svelte) {
					if (svelteRequest.query.type === 'style' && !svelteRequest.raw) {
						// return cssId with root prefix so postcss pipeline of vite finds the directory correctly
						// see https://github.com/sveltejs/vite-plugin-svelte/issues/14
						log.debug(`resolveId resolved virtual css module ${svelteRequest.cssId}`);
						return svelteRequest.cssId;
					}
				}

				// TODO: remove this after bumping peerDep on Vite to 4.1+ or Svelte to 4.0+
				if (isVite4_0 && isSvelte3 && ssr && importee === 'svelte') {
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
				//@ts-expect-error scan
				const scan = !!opts?.scan; // scanner phase of optimizeDeps
				const isPrebundled =
					options.prebundleSvelteLibraries &&
					viteConfig.optimizeDeps?.disabled !== true &&
					viteConfig.optimizeDeps?.disabled !== (options.isBuild ? 'build' : 'dev') &&
					!isDepExcluded(importee, viteConfig.optimizeDeps?.exclude ?? []);
				// for prebundled libraries we let vite resolve the prebundling result
				// for ssr, during scanning and non-prebundled, we do it
				if (ssr || scan || !isPrebundled) {
					try {
						const isFirstResolve = !cache.hasResolvedSvelteField(importee, importer);
						const resolved = await resolveViaPackageJsonSvelte(importee, importer, cache);
						if (isFirstResolve && resolved) {
							const packageInfo = await cache.getPackageInfo(resolved);
							const packageVersion = `${packageInfo.name}@${packageInfo.version}`;
							log.debug.once(
								`resolveId resolved ${importee} to ${resolved} via package.json svelte field of ${packageVersion}`
							);

							try {
								const viteResolved = (
									await this.resolve(importee, importer, { ...opts, skipSelf: true })
								)?.id;
								if (resolved !== viteResolved) {
									packagesWithResolveWarnings.add(packageVersion);
									log.debug.enabled &&
										log.debug.once(
											`resolve difference for ${packageVersion} ${importee} - svelte: "${resolved}", vite: "${viteResolved}"`
										);
								}
							} catch (e) {
								packagesWithResolveWarnings.add(packageVersion);
								log.debug.enabled &&
									log.debug.once(
										`resolve error for ${packageVersion} ${importee} - svelte: "${resolved}", vite: ERROR`,
										e
									);
							}
						}
						return resolved;
					} catch (e) {
						log.debug.once(
							`error trying to resolve ${importee} from ${importer} via package.json svelte field `,
							e
						);
						// this error most likely happens due to non-svelte related importee/importers so swallow it here
						// in case it really way a svelte library, users will notice anyway. (lib not working due to failed resolve)
					}
				}
			},

			async transform(code, id, opts) {
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
				log.debug(`transform returns compiled js for ${svelteRequest.filename}`);
				return {
					...compileData.compiled.js,
					meta: {
						vite: {
							lang: compileData.lang
						}
					}
				};
			},

			handleHotUpdate(ctx) {
				if (!options.hot || !options.emitCss) {
					return;
				}
				const svelteRequest = requestParser(ctx.file, false, ctx.timestamp);
				if (svelteRequest) {
					return handleHotUpdate(compileSvelte, ctx, svelteRequest, cache, options);
				}
			},
			async buildEnd() {
				await options.stats?.finishAll();
				if (
					!options.experimental?.disableSvelteResolveWarnings &&
					packagesWithResolveWarnings?.size > 0
				) {
					log.warn(
						`WARNING: The following packages use a svelte resolve configuration in package.json that has conflicting results and is going to cause problems future.\n\n${[
							...packagesWithResolveWarnings
						].join('\n')}\n\nPlease see ${FAQ_LINK_CONFLICTS_IN_SVELTE_RESOLVE} for details.`
					);
				}
			}
		},
		svelteInspector()
	];
	return plugins;
}

export { vitePreprocess } from './preprocess.js';
export { loadSvelteConfig } from './utils/load-svelte-config.js';
