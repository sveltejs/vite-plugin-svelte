import { toRollupError } from '../utils/error.js';
import { mapToRelative } from '../utils/sourcemaps.js';
import * as svelte from 'svelte/compiler';
import { log } from '../utils/log.js';
import { arraify } from '../utils/options.js';

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
	 * @type {import("../types/compile.d.ts").PreprocessSvelte}
	 */
	let preprocessSvelte;
	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'vite-plugin-svelte:preprocess',
		enforce: 'pre',
		configResolved(c) {
			//@ts-expect-error defined below but filter not in type
			plugin.transform.filter = api.idFilter;
			options = api.options;
			if (arraify(options.preprocess).length > 0) {
				preprocessSvelte = createPreprocessSvelte(options, c);
			} else {
				log.debug(
					`disabling ${plugin.name} because no preprocessor is configured`,
					undefined,
					'preprocess'
				);
				delete plugin.transform;
			}
		},

		transform: {
			async handler(code, id) {
				const cache = api.getEnvironmentCache(this);
				const ssr = this.environment.config.consumer === 'server';
				const svelteRequest = api.idParser(id, ssr);
				if (!svelteRequest) {
					return;
				}
				try {
					return await preprocessSvelte(svelteRequest, code, options);
				} catch (e) {
					cache.setError(svelteRequest, e);
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
	/** @type {import('../types/vite-plugin-svelte-stats.d.ts').StatCollection | undefined} */
	let stats;
	/** @type {Array<import('svelte/compiler').PreprocessorGroup>} */
	const preprocessors = arraify(options.preprocess);

	for (const preprocessor of preprocessors) {
		if (preprocessor.style && '__resolvedConfig' in preprocessor.style) {
			preprocessor.style.__resolvedConfig = resolvedConfig;
		}
	}

	/** @type {import('../types/compile.d.ts').PreprocessSvelte} */
	return async function preprocessSvelte(svelteRequest, code, options) {
		const { filename, ssr } = svelteRequest;

		if (options.stats) {
			if (options.isBuild) {
				if (!stats) {
					// build is either completely ssr or csr, create stats collector on first compile
					// it is then finished in the buildEnd hook.
					stats = options.stats.startCollection(`${ssr ? 'ssr' : 'dom'} preprocess`, {
						logInProgress: () => false
					});
				}
			} else {
				// dev time ssr, it's a ssr request and there are no stats, assume new page load and start collecting
				if (ssr && !stats) {
					stats = options.stats.startCollection('ssr preprocess');
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

		let preprocessed;

		if (preprocessors && preprocessors.length > 0) {
			try {
				const endStat = stats?.start(filename);
				preprocessed = await svelte.preprocess(code, preprocessors, { filename }); // full filename here so postcss works
				endStat?.();
			} catch (e) {
				e.message = `Error while preprocessing ${filename}${e.message ? ` - ${e.message}` : ''}`;
				throw e;
			}

			if (typeof preprocessed?.map === 'object') {
				mapToRelative(preprocessed?.map, filename);
			}
			return /** @type {import('../types/compile.d.ts').PreprocessTransformOutput} */ {
				code: preprocessed.code,
				// @ts-expect-error
				map: preprocessed.map,
				meta: {
					svelte: {
						preprocessed
					}
				}
			};
		}
	};
}
