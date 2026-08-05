/** @import { Options } from '../public.js' */
/** @import { PreResolvedOptions } from '../types/options.js' */
/** @import { PluginAPI } from '../types/plugin-api.js' */
/** @import { Plugin } from 'vite' */

import process from 'node:process';
import { isDebugNamespaceEnabled, log } from '../utils/log.js';
import { VitePluginSvelteStats } from '../utils/vite-plugin-svelte-stats.js';
import {
	buildExtraViteConfig,
	validateInlineOptions,
	resolveOptions,
	preResolveOptions,
	ensureConfigEnvironmentMainFields,
	ensureConfigEnvironmentConditions
} from '../utils/options.js';
import { buildIdFilter, buildIdParser } from '../utils/id.js';
import { createCompileSvelte } from '../utils/compile.js';

/**
 * @param {Partial<Options>} [inlineOptions]
 * @param {PluginAPI} api
 * @returns {Plugin}
 */
export function configure(api, inlineOptions) {
	validateInlineOptions(inlineOptions);

	/**
	 * @type {PreResolvedOptions}
	 */
	let preOptions;

	/** @param {import('vite').ResolvedConfig} config */
	function configureApi(config) {
		const options = resolveOptions(preOptions, config);
		api.options = options;
		if (isDebugNamespaceEnabled('stats')) {
			api.options.stats = new VitePluginSvelteStats();
		}

		api.filter = buildIdFilter(options);
		api.idParser = buildIdParser(options);
		api.compileSvelte = createCompileSvelte();
		api.runConfigResolved(config);
		log.debug('resolved options', api.options, 'config');
	}

	/** @type {Plugin} */
	return {
		name: 'vite-plugin-svelte:config',
		api,
		// make sure it runs first
		enforce: 'pre',
		config: {
			order: 'pre',
			async handler(config, configEnv) {
				// setup logger
				if (process.env.DEBUG) {
					log.setLevel('debug');
				} else if (config.logLevel) {
					log.setLevel(config.logLevel);
				}

				preOptions = await preResolveOptions(inlineOptions, config, configEnv);
				// extra vite config
				const extraViteConfig = await buildExtraViteConfig(preOptions, config);
				log.debug('additional vite config', extraViteConfig, 'config');
				return extraViteConfig;
			}
		},
		configResolved: {
			order: 'pre',
			handler(config) {
				configureApi(config);
			}
		},

		buildStart: {
			order: 'pre',
			sequential: true,
			async handler() {
				if (api.options) return;
				// Plugins returned by applyToEnvironment are created after Vite runs configResolved.
				const config = this.environment.getTopLevelConfig();
				preOptions = await preResolveOptions(
					inlineOptions,
					{ root: config.root },
					{
						command: config.command,
						mode: config.mode,
						isSsrBuild: config.command === 'build' && !!config.build.ssr
					}
				);
				configureApi(config);
			}
		},

		configEnvironment(name, config, opts) {
			ensureConfigEnvironmentMainFields(name, config, opts);
			// @ts-expect-error the function above should make `resolve.mainFields` non-nullable
			config.resolve.mainFields.unshift('svelte');

			ensureConfigEnvironmentConditions(name, config, opts);
			// @ts-expect-error the function above should make `resolve.conditions` non-nullable
			config.resolve.conditions.push('svelte');
		},

		configureServer(server) {
			const { options } = api;
			options.server = server;
		}
	};
}
