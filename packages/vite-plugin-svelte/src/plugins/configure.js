import process from 'node:process';
import { isDebugNamespaceEnabled, log } from '../utils/log.js';
import * as vite from 'vite';
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
import { gte } from '../utils/svelte-version.js';

// @ts-ignore rolldownVersion
const { version: viteVersion, rolldownVersion } = vite;

/**
 * @param {Partial<import('../public.d.ts').Options>} [inlineOptions]
 * @param {import('../types/plugin-api.d.ts').PluginAPI} api
 * @returns {import('vite').Plugin}
 */
export function configure(api, inlineOptions) {
	if (rolldownVersion) {
		log.warn.once(
			`!!! Support for rolldown-vite in vite-plugin-svelte is experimental (rolldown: ${rolldownVersion}, vite: ${viteVersion}) !!!
			See https://github.com/sveltejs/vite-plugin-svelte/issues/1143 for a list of known issues and to report feedback.`.replace(
				/\t+/g,
				'\t'
			)
		);
	}

	validateInlineOptions(inlineOptions);

	/**
	 * @type {import("../types/options.d.ts").PreResolvedOptions}
	 */
	let preOptions;

	/** @type {import('vite').Plugin} */
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

				if (
					rolldownVersion &&
					configEnv.command === 'build' &&
					gte(rolldownVersion, '1.0.0-beta.35') // inlineConst received a critical bugfix in 1.0.0-beta.35
				) {
					extraViteConfig.build ??= {};
					// rename rollupOptions to rolldownOptions
					//@ts-ignore rolldownOptions only exists in rolldown-vite
					extraViteConfig.build.rolldownOptions = extraViteConfig.build.rollupOptions || {};
					delete extraViteConfig.build.rollupOptions;
					// read user config inlineConst value
					const inlineConst =
						//@ts-ignore optimization only exists in rolldown-vite
						config.build?.rolldownOptions?.optimization?.inlineConst ??
						//@ts-ignore optimization only exists in rolldown-vite
						config.build?.rollupOptions?.optimization?.inlineConst;

					if (inlineConst == null) {
						// set inlineConst build optimization for esm-env
						//@ts-ignore rolldownOptions only exists in rolldown-vite
						extraViteConfig.build.rolldownOptions.optimization ??= {};
						//@ts-ignore rolldownOptions only exists in rolldown-vite
						extraViteConfig.build.rolldownOptions.optimization.inlineConst = true;
					} else if (inlineConst === false) {
						log.warn(
							'Your rolldown config contains `optimization.inlineConst: false`. This can lead to increased bundle size and leaked server code in client build.'
						);
					}
				}

				log.debug('additional vite config', extraViteConfig, 'config');

				return extraViteConfig;
			}
		},
		configResolved: {
			order: 'pre',
			handler(config) {
				const options = resolveOptions(preOptions, config);
				api.options = options;
				if (isDebugNamespaceEnabled('stats')) {
					api.options.stats = new VitePluginSvelteStats();
				}

				api.filter = buildIdFilter(options);
				api.idFilter = api.filter;
				api.idParser = buildIdParser(options);
				api.compileSvelte = createCompileSvelte();
				log.debug('resolved options', api.options, 'config');
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
