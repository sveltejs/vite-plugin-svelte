import { toRollupError } from '../utils/error.js';
import { mapToRelative } from '../utils/sourcemaps.js';
import * as svelte from 'svelte/compiler';
import { log } from '../utils/log.js';
import { arraify } from '../utils/options.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function preprocess(api) {
	/**
	 * @type {import("../types/options.js").ResolvedOptions}
	 */
	let options;

	/**
	 * @type {DependenciesCache}
	 */
	let dependenciesCache;

	/**
	 * @type {import("../types/compile.d.ts").PreprocessSvelte}
	 */
	let preprocessSvelte;

	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:preprocess',
		enforce: 'pre',
		configResolved(c) {
			options = api.options;
			if (arraify(options.preprocess).length > 0) {
				preprocessSvelte = createPreprocessSvelte(options, c);
				// @ts-expect-error defined below but filter not in type
				plugin.transform.filter = api.filter;
			} else {
				log.debug(
					`disabling ${plugin.name} because no preprocessor is configured`,
					undefined,
					'preprocess'
				);
				// @ts-expect-error force set undefined to clear memory
				preprocessSvelte = undefined;
				// @ts-expect-error defined below but filter not in type
				plugin.transform.filter = { id: /$./ }; // never match
			}
		},
		configureServer(server) {
			dependenciesCache = new DependenciesCache(server);
		},
		buildStart() {
			dependenciesCache?.clear();
		},
		transform: {
			async handler(code, id) {
				const ssr = this.environment.config.consumer === 'server';
				const svelteRequest = api.idParser(id, ssr);
				if (!svelteRequest) {
					return;
				}
				try {
					const preprocessed = await preprocessSvelte(svelteRequest, code, options);
					dependenciesCache?.update(svelteRequest, preprocessed?.dependencies ?? []);
					if (!preprocessed) {
						return;
					}
					if (options.isBuild && this.environment.config.build.watch && preprocessed.dependencies) {
						for (const dep of preprocessed.dependencies) {
							this.addWatchFile(dep);
						}
					}

					/** @type {import('vite').Rollup.SourceDescription}*/
					const result = { code: preprocessed.code };
					if (preprocessed.map) {
						// @ts-expect-error type differs but should work
						result.map = preprocessed.map;
					}
					return result;
				} catch (e) {
					throw toRollupError(e, options);
				}
			}
		}
	};
	return plugin;
}
/**
 * @param {import("../types/options.js").ResolvedOptions} options
 * @param {import("vite").ResolvedConfig} resolvedConfig
 * @returns {import('../types/compile.d.ts').PreprocessSvelte}
 */
function createPreprocessSvelte(options, resolvedConfig) {
	/** @type {Array<import('svelte/compiler').PreprocessorGroup>} */
	const preprocessors = arraify(options.preprocess);

	for (const preprocessor of preprocessors) {
		if (preprocessor.style && '__resolvedConfig' in preprocessor.style) {
			preprocessor.style.__resolvedConfig = resolvedConfig;
		}
	}

	/** @type {import('../types/compile.d.ts').PreprocessSvelte} */
	return async function preprocessSvelte(svelteRequest, code) {
		const { filename } = svelteRequest;
		let preprocessed;
		if (preprocessors && preprocessors.length > 0) {
			try {
				preprocessed = await svelte.preprocess(code, preprocessors, { filename }); // full filename here so postcss works
			} catch (e) {
				e.message = `Error while preprocessing ${filename}${e.message ? ` - ${e.message}` : ''}`;
				throw e;
			}
			if (typeof preprocessed?.map === 'object') {
				mapToRelative(preprocessed?.map, filename);
			}
			return preprocessed;
		}
	};
}

/**
 * @class
 *
 * caches dependencies of preprocessed files and emit change events on dependants
 */
class DependenciesCache {
	/** @type {Map<string, string[]>} */
	#dependencies = new Map();
	/** @type {Map<string, Set<string>>} */
	#dependants = new Map();

	/** @type {import('vite').ViteDevServer} */
	#server;
	/**
	 *
	 * @param {import('vite').ViteDevServer} server
	 */
	constructor(server) {
		this.#server = server;
		/** @type {(filename: string) => void} */
		const emitChangeEventOnDependants = (filename) => {
			const dependants = this.#dependants.get(filename);
			dependants?.forEach((dependant) => {
				if (fs.existsSync(dependant)) {
					log.debug(
						`emitting virtual change event for "${dependant}" because dependency "${filename}" changed`,
						undefined,
						'hmr'
					);
					server.watcher.emit('change', dependant);
				}
			});
		};
		server.watcher.on('change', emitChangeEventOnDependants);
		server.watcher.on('unlink', emitChangeEventOnDependants);
	}

	/**
	 * @param {string} file
	 */
	#ensureWatchedFile(file) {
		const root = this.#server.config.root;
		if (
			file &&
			// only need to watch if out of root
			!file.startsWith(root + '/') &&
			// some rollup plugins use null bytes for private resolved Ids
			!file.includes('\0') &&
			fs.existsSync(file)
		) {
			// resolve file to normalized system path
			this.#server.watcher.add(path.resolve(file));
		}
	}

	clear() {
		this.#dependencies.clear();
		this.#dependants.clear();
	}

	/**
	 *
	 * @param {import('../types/id.d.ts').SvelteRequest} svelteRequest
	 * @param {string[]} dependencies
	 */
	update(svelteRequest, dependencies) {
		const id = svelteRequest.normalizedFilename;
		const prevDependencies = this.#dependencies.get(id) || [];

		this.#dependencies.set(id, dependencies);
		const removed = prevDependencies.filter((d) => !dependencies.includes(d));
		const added = dependencies.filter((d) => !prevDependencies.includes(d));
		added.forEach((d) => {
			this.#ensureWatchedFile(d);
			if (!this.#dependants.has(d)) {
				this.#dependants.set(d, new Set());
			}
			/** @type {Set<string>} */ (this.#dependants.get(d)).add(svelteRequest.filename);
		});
		removed.forEach((d) => {
			/** @type {Set<string>} */ (this.#dependants.get(d)).delete(svelteRequest.filename);
		});
	}
}
