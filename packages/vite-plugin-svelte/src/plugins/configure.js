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
			`!!! Support for vite 8 beta in vite-plugin-svelte is experimental (rolldown: ${rolldownVersion}, vite: ${viteVersion}) !!!
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
